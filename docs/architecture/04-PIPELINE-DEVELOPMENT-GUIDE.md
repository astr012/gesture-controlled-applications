# Pipeline Development Guide

> **Document**: 04-PIPELINE-DEVELOPMENT-GUIDE.md  
> **Version**: 2.0.0  
> **Scope**: Guidelines for creating new processing pipelines and gesture classifiers

---

## Overview

This guide provides step-by-step instructions for extending the Gesture Control Platform with new processing pipelines and gesture classifiers. Each new feature should follow the pipeline architecture patterns established in the core system.

---

## Pipeline Development Workflow

### 1. Planning Phase

Before writing code, answer these questions:

| Question                              | Purpose                      |
| ------------------------------------- | ---------------------------- |
| What data does this pipeline consume? | Define input contract        |
| What data does this pipeline produce? | Define output contract       |
| What are the latency requirements?    | Determine optimization needs |
| Does it need ML models?               | Plan model loading/caching   |
| What errors can occur?                | Design error handling        |

### 2. Development Steps

```
1. Define Contracts       → Create data classes for input/output
2. Implement Core Logic   → Build the processing function
3. Add Error Handling     → Wrap with exception handling
4. Integrate Metrics      → Add timing and counters
5. Write Tests            → Unit and integration tests
6. Register Pipeline      → Add to orchestrator
7. Create Frontend        → Build visualization components
8. Document               → API docs and usage guide
```

---

## Creating a New Gesture Classifier

### Step 1: Define the Classifier Contract

```python
# pipelines/inference/classifiers/volume_gesture.py

from dataclasses import dataclass
from typing import List, Optional, Tuple
from enum import Enum

from pipelines.inference.engine import GestureClassifier, InferenceResult, GestureType
from pipelines.extraction.hand_tracker import ExtractionResult, HandLandmarks


class VolumeGesture(Enum):
    """Volume control gesture types."""
    NONE = "none"
    INCREASE = "increase"
    DECREASE = "decrease"
    MUTE = "mute"
    UNMUTE = "unmute"


@dataclass
class VolumeControlOutput:
    """Specialized output for volume control."""
    gesture: VolumeGesture
    volume_delta: float  # -1.0 to 1.0
    pinch_distance: float  # Distance between thumb and index
    is_actively_controlling: bool
    confidence: float
```

### Step 2: Implement the Classifier

```python
# pipelines/inference/classifiers/volume_gesture.py (continued)

import numpy as np
import time


class VolumeGestureClassifier(GestureClassifier):
    """
    Classifier for volume control gestures.

    Gestures:
    - Pinch (thumb + index) with vertical movement: Volume up/down
    - Pinch with spread: Mute toggle
    - Open palm: Volume indicator
    """

    def __init__(
        self,
        pinch_threshold: float = 0.05,
        movement_threshold: float = 0.02,
        smoothing_factor: float = 0.3
    ):
        self.pinch_threshold = pinch_threshold
        self.movement_threshold = movement_threshold
        self.smoothing_factor = smoothing_factor

        # State tracking for gesture continuity
        self._previous_pinch_distance: Optional[float] = None
        self._previous_pinch_y: Optional[float] = None
        self._gesture_start_time: Optional[float] = None
        self._is_controlling: bool = False

    @property
    def name(self) -> str:
        return "volume_control"

    @property
    def supported_gestures(self) -> List[GestureType]:
        return [GestureType.PINCH]

    def classify(self, extraction: ExtractionResult) -> InferenceResult:
        """Classify volume control gesture from extracted hand data."""
        start_time = time.perf_counter()

        # Default output
        output = VolumeControlOutput(
            gesture=VolumeGesture.NONE,
            volume_delta=0.0,
            pinch_distance=0.0,
            is_actively_controlling=False,
            confidence=0.0
        )

        if not extraction.hands:
            self._reset_state()
            return self._create_result(output, start_time)

        # Use the first detected hand (or prefer right hand)
        hand = self._select_control_hand(extraction.hands)
        if not hand:
            self._reset_state()
            return self._create_result(output, start_time)

        landmarks = hand.landmarks

        # Calculate pinch distance (thumb tip to index tip)
        thumb_tip = landmarks[4]  # Landmark 4: Thumb tip
        index_tip = landmarks[8]  # Landmark 8: Index fingertip

        pinch_distance = self._calculate_distance(thumb_tip, index_tip)

        # Detect pinch gesture
        is_pinching = pinch_distance < self.pinch_threshold

        if is_pinching:
            self._is_controlling = True

            if self._gesture_start_time is None:
                self._gesture_start_time = time.time()

            # Calculate volume delta from vertical movement
            pinch_center_y = (thumb_tip.y + index_tip.y) / 2

            volume_delta = 0.0
            if self._previous_pinch_y is not None:
                y_movement = self._previous_pinch_y - pinch_center_y  # Inverted: up = positive

                if abs(y_movement) > self.movement_threshold:
                    # Normalize to -1 to 1 range
                    volume_delta = np.clip(y_movement * 5, -1.0, 1.0)

                    if volume_delta > 0:
                        output.gesture = VolumeGesture.INCREASE
                    else:
                        output.gesture = VolumeGesture.DECREASE

            self._previous_pinch_y = pinch_center_y

            output = VolumeControlOutput(
                gesture=output.gesture if output.gesture != VolumeGesture.NONE else VolumeGesture.NONE,
                volume_delta=volume_delta,
                pinch_distance=pinch_distance,
                is_actively_controlling=True,
                confidence=hand.confidence
            )
        else:
            # Check for mute gesture (all fingers closed)
            if self._is_fist(landmarks):
                output = VolumeControlOutput(
                    gesture=VolumeGesture.MUTE,
                    volume_delta=0.0,
                    pinch_distance=pinch_distance,
                    is_actively_controlling=True,
                    confidence=hand.confidence
                )
            else:
                self._reset_state()

        self._previous_pinch_distance = pinch_distance

        return self._create_result(output, start_time)

    def _select_control_hand(
        self,
        hands: List[HandLandmarks]
    ) -> Optional[HandLandmarks]:
        """Select the hand to use for control (prefer right hand)."""
        right_hands = [h for h in hands if h.hand_label == "Right"]
        if right_hands:
            return right_hands[0]
        return hands[0] if hands else None

    def _calculate_distance(self, lm1, lm2) -> float:
        """Calculate Euclidean distance between two landmarks."""
        return np.sqrt(
            (lm1.x - lm2.x) ** 2 +
            (lm1.y - lm2.y) ** 2 +
            (lm1.z - lm2.z) ** 2
        )

    def _is_fist(self, landmarks) -> bool:
        """Check if hand is making a fist gesture."""
        # All fingertips should be below their respective PIP joints
        tip_indices = [4, 8, 12, 16, 20]
        pip_indices = [3, 6, 10, 14, 18]

        for tip_idx, pip_idx in zip(tip_indices[1:], pip_indices[1:]):  # Skip thumb
            if landmarks[tip_idx].y < landmarks[pip_idx].y:
                return False

        return True

    def _reset_state(self):
        """Reset tracking state when gesture is lost."""
        self._previous_pinch_distance = None
        self._previous_pinch_y = None
        self._gesture_start_time = None
        self._is_controlling = False

    def _create_result(
        self,
        output: VolumeControlOutput,
        start_time: float
    ) -> InferenceResult:
        """Create standardized inference result."""
        inference_latency = (time.perf_counter() - start_time) * 1000

        return InferenceResult(
            gesture_type=GestureType.PINCH if output.is_actively_controlling else GestureType.NONE,
            confidence=output.confidence,
            raw_output={
                "gesture": output.gesture.value,
                "volume_delta": output.volume_delta,
                "pinch_distance": output.pinch_distance,
                "is_controlling": output.is_actively_controlling
            },
            inference_latency_ms=inference_latency,
            pinch_distance=output.pinch_distance
        )
```

### Step 3: Create an Output Action

```python
# pipelines/output/actions/volume_control.py

from abc import ABC, abstractmethod
from typing import Optional
import asyncio

from pipelines.output.dispatcher import OutputAction
from pipelines.inference.engine import InferenceResult


class VolumeControlAction(OutputAction):
    """
    System action for controlling audio volume.

    Uses pycaw on Windows for volume control.
    """

    def __init__(
        self,
        min_volume: float = 0.0,
        max_volume: float = 1.0,
        step_size: float = 0.05
    ):
        self.min_volume = min_volume
        self.max_volume = max_volume
        self.step_size = step_size

        self._volume_interface = None
        self._initialized = False

    @property
    def name(self) -> str:
        return "volume_control"

    def initialize(self) -> bool:
        """Initialize the volume control interface."""
        try:
            # Windows-specific volume control
            from ctypes import cast, POINTER
            from comtypes import CLSCTX_ALL
            from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume

            devices = AudioUtilities.GetSpeakers()
            interface = devices.Activate(
                IAudioEndpointVolume._iid_,
                CLSCTX_ALL,
                None
            )
            self._volume_interface = cast(interface, POINTER(IAudioEndpointVolume))
            self._initialized = True
            return True

        except ImportError:
            print("pycaw not available - volume control disabled")
            return False
        except Exception as e:
            print(f"Failed to initialize volume control: {e}")
            return False

    async def execute(self, inference: InferenceResult) -> bool:
        """Execute volume control based on inference result."""
        if not self._initialized:
            return False

        raw = inference.raw_output
        volume_delta = raw.get("volume_delta", 0)
        gesture = raw.get("gesture", "none")

        if gesture == "mute":
            return self._toggle_mute()

        if abs(volume_delta) > 0.01:  # Threshold to prevent jitter
            return self._adjust_volume(volume_delta)

        return True

    def _adjust_volume(self, delta: float) -> bool:
        """Adjust system volume by delta."""
        try:
            current = self._volume_interface.GetMasterVolumeLevelScalar()
            new_volume = max(
                self.min_volume,
                min(self.max_volume, current + delta * self.step_size)
            )
            self._volume_interface.SetMasterVolumeLevelScalar(new_volume, None)
            return True
        except Exception as e:
            print(f"Volume adjustment failed: {e}")
            return False

    def _toggle_mute(self) -> bool:
        """Toggle system mute."""
        try:
            current_mute = self._volume_interface.GetMute()
            self._volume_interface.SetMute(not current_mute, None)
            return True
        except Exception as e:
            print(f"Mute toggle failed: {e}")
            return False

    def get_current_volume(self) -> Optional[float]:
        """Get current system volume level."""
        if not self._initialized:
            return None
        try:
            return self._volume_interface.GetMasterVolumeLevelScalar()
        except:
            return None

    def is_muted(self) -> Optional[bool]:
        """Check if system is muted."""
        if not self._initialized:
            return None
        try:
            return bool(self._volume_interface.GetMute())
        except:
            return None
```

### Step 4: Register the Classifier

```python
# pipelines/inference/engine.py (addition)

def get_inference_engine() -> InferenceEngine:
    """Factory function to create configured inference engine."""
    engine = InferenceEngine()

    # Register all classifiers
    from .classifiers.finger_count import FingerCountClassifier
    from .classifiers.volume_gesture import VolumeGestureClassifier
    from .classifiers.cursor_control import CursorControlClassifier

    engine.register_classifier(FingerCountClassifier())
    engine.register_classifier(VolumeGestureClassifier())
    engine.register_classifier(CursorControlClassifier())

    return engine
```

### Step 5: Create the Project Definition

```python
# projects/volume_controller/project.py

from dataclasses import dataclass
from typing import Optional, List

from projects.base import BaseProject, ProjectConfig, ProjectState


@dataclass
class VolumeControllerConfig(ProjectConfig):
    """Configuration for volume control project."""

    # Gesture sensitivity
    pinch_threshold: float = 0.05
    movement_threshold: float = 0.02

    # Volume control
    volume_step: float = 0.05
    show_volume_overlay: bool = True

    # Audio feedback
    audio_feedback: bool = False

    # Smoothing
    smoothing_enabled: bool = True
    smoothing_factor: float = 0.3


class VolumeControllerProject(BaseProject):
    """
    Volume Controller Project

    Controls system volume using pinch gestures.
    Vertical movement adjusts volume, fist gesture toggles mute.
    """

    PROJECT_ID = "volume_control"
    PROJECT_NAME = "Volume Controller"
    PROJECT_VERSION = "2.0.0"
    PROJECT_CATEGORY = "basic"

    def __init__(self, config: Optional[VolumeControllerConfig] = None):
        super().__init__(
            project_id=self.PROJECT_ID,
            name=self.PROJECT_NAME,
            version=self.PROJECT_VERSION,
            category=self.PROJECT_CATEGORY
        )
        self.config = config or VolumeControllerConfig()
        self._volume_action = None

    async def initialize(self):
        """Initialize volume control components."""
        from pipelines.output.actions.volume_control import VolumeControlAction

        self._volume_action = VolumeControlAction(
            step_size=self.config.volume_step
        )

        if not self._volume_action.initialize():
            raise RuntimeError("Failed to initialize volume control")

        self.state = ProjectState.READY

    async def start(self):
        """Start the volume control project."""
        if self.state != ProjectState.READY:
            await self.initialize()

        # Register the classifier with inference engine
        from pipelines.inference.engine import InferenceEngine
        engine = InferenceEngine.get_instance()
        engine.set_active_classifier("volume_control")

        # Register output action
        from pipelines.output.dispatcher import OutputPipeline
        output = OutputPipeline.get_instance()
        output.register_action(self._volume_action)

        self.state = ProjectState.RUNNING

    async def stop(self):
        """Stop the volume control project."""
        self.state = ProjectState.STOPPED

    def get_current_status(self) -> dict:
        """Get current project status including volume level."""
        if not self._volume_action:
            return {"volume": None, "muted": None}

        return {
            "volume": self._volume_action.get_current_volume(),
            "muted": self._volume_action.is_muted(),
            "state": self.state.value
        }
```

---

## Creating Frontend Components

### Step 1: Create the Dashboard Component

```tsx
// features/volume-control/VolumeControlPage.tsx

import React, { useCallback, useEffect, useState } from "react";
import { useProjectStore } from "@/state/stores/projectStore";
import { useWebSocketHub } from "@/services/websocket/useWebSocketHub";
import ProjectLayout from "@/features/projects/ProjectLayout";
import GestureCanvas from "@/features/projects/components/GestureCanvas";
import VolumeBar from "./components/VolumeBar";
import GestureGuide from "./components/GestureGuide";
import VolumeStats from "./components/VolumeStats";
import { Card } from "@/components/ui";
import styles from "./VolumeControlPage.module.css";

const VolumeControlPage: React.FC = () => {
  const {
    currentGesture,
    isRunning,
    startProject,
    stopProject,
    updateGestureData,
  } = useProjectStore();

  const { subscribe, isConnected } = useWebSocketHub();

  const [currentVolume, setCurrentVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isControlling, setIsControlling] = useState(false);

  // Subscribe to gesture updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe("volume_control", (data) => {
      updateGestureData(data);

      // Extract volume-specific data
      const raw = data.gesture_result || {};

      if (raw.is_controlling !== undefined) {
        setIsControlling(raw.is_controlling);
      }

      // Volume level comes from the backend action result
      if (raw.current_volume !== undefined) {
        setCurrentVolume(raw.current_volume);
      }

      if (raw.is_muted !== undefined) {
        setIsMuted(raw.is_muted);
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  return (
    <ProjectLayout projectId="volume_control">
      <div className={styles.container}>
        <div className={styles.mainPanel}>
          <GestureCanvas
            gestureData={currentGesture}
            isRunning={isRunning}
            onStart={startProject}
            onStop={stopProject}
          />

          <Card className={styles.volumeDisplay} variant="elevated">
            <VolumeBar
              volume={currentVolume}
              isMuted={isMuted}
              isActive={isControlling}
            />
          </Card>
        </div>

        <aside className={styles.sidebar}>
          <Card className={styles.guideCard} variant="outlined">
            <h3>Gesture Guide</h3>
            <GestureGuide />
          </Card>

          <Card className={styles.statsCard} variant="outlined">
            <h3>Session Stats</h3>
            <VolumeStats />
          </Card>
        </aside>
      </div>
    </ProjectLayout>
  );
};

export default VolumeControlPage;
```

### Step 2: Create Visualization Components

```tsx
// features/volume-control/components/VolumeBar.tsx

import React from "react";
import clsx from "clsx";
import styles from "./VolumeBar.module.css";

interface VolumeBarProps {
  volume: number; // 0 to 1
  isMuted: boolean;
  isActive: boolean;
}

const VolumeBar: React.FC<VolumeBarProps> = ({ volume, isMuted, isActive }) => {
  const volumePercent = Math.round(volume * 100);

  return (
    <div
      className={clsx(
        styles.container,
        isActive && styles.active,
        isMuted && styles.muted,
      )}
    >
      <div className={styles.iconContainer}>
        {isMuted ? (
          <VolumeOffIcon className={styles.icon} />
        ) : volumePercent === 0 ? (
          <VolumeMuteIcon className={styles.icon} />
        ) : volumePercent < 50 ? (
          <VolumeLowIcon className={styles.icon} />
        ) : (
          <VolumeHighIcon className={styles.icon} />
        )}
      </div>

      <div className={styles.barContainer}>
        <div className={styles.barBackground}>
          <div
            className={styles.barFill}
            style={{
              width: `${isMuted ? 0 : volumePercent}%`,
              transition: isActive ? "width 0.05s" : "width 0.3s",
            }}
          />

          {/* Level markers */}
          <div className={styles.markers}>
            {[25, 50, 75].map((level) => (
              <div
                key={level}
                className={styles.marker}
                style={{ left: `${level}%` }}
              />
            ))}
          </div>
        </div>

        <span className={styles.volumeText}>
          {isMuted ? "Muted" : `${volumePercent}%`}
        </span>
      </div>

      {isActive && (
        <div className={styles.activeIndicator}>
          <span className={styles.dot} />
          Controlling
        </div>
      )}
    </div>
  );
};

// Icon components
const VolumeHighIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeLowIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.5 12A4.5 4.5 0 0016 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
  </svg>
);

const VolumeMuteIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 9v6h4l5 5V4l-5 5H7z" />
  </svg>
);

const VolumeOffIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

export default VolumeBar;
```

```css
/* features/volume-control/components/VolumeBar.module.css */

.container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: var(--color-background-secondary);
  transition: all var(--transition-normal);
}

.active {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1),
    rgba(118, 75, 162, 0.1)
  );
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
}

.muted {
  opacity: 0.7;
}

.iconContainer {
  flex-shrink: 0;
}

.icon {
  width: 48px;
  height: 48px;
  color: var(--color-primary);
}

.muted .icon {
  color: var(--color-text-secondary);
}

.barContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.barBackground {
  position: relative;
  height: 12px;
  background: var(--color-background-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.barFill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--color-primary-gradient);
  border-radius: var(--radius-full);
}

.muted .barFill {
  background: var(--color-text-disabled);
}

.markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.volumeText {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.activeIndicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-success);
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  animation: pulse 1.5s ease-in-out infinite;
}

.dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

---

## Testing Guidelines

### Unit Testing Classifiers

```python
# tests/unit/pipelines/inference/test_volume_gesture.py

import pytest
import numpy as np
from pipelines.inference.classifiers.volume_gesture import (
    VolumeGestureClassifier,
    VolumeGesture
)
from pipelines.extraction.hand_tracker import (
    ExtractionResult,
    HandLandmarks,
    Landmark
)


class TestVolumeGestureClassifier:
    """Unit tests for volume gesture classifier."""

    @pytest.fixture
    def classifier(self):
        return VolumeGestureClassifier(
            pinch_threshold=0.05,
            movement_threshold=0.02
        )

    @pytest.fixture
    def extraction_factory(self):
        """Factory for creating mock extraction results."""

        def create(landmarks_list, hand_label="Right", confidence=0.95):
            landmarks = [
                Landmark(
                    x=lm[0], y=lm[1], z=lm[2] if len(lm) > 2 else 0,
                    pixel_x=int(lm[0] * 640),
                    pixel_y=int(lm[1] * 480)
                )
                for lm in landmarks_list
            ]

            hand = HandLandmarks(
                hand_label=hand_label,
                landmarks=landmarks,
                confidence=confidence
            )

            return ExtractionResult(
                hands=[hand],
                extraction_latency_ms=10,
                model_confidence=0.95,
                frame_timestamp=0
            )

        return create

    def test_pinch_detected(self, classifier, extraction_factory):
        """Test that pinch gesture is detected when thumb and index are close."""
        # Create landmarks where thumb and index tips are close
        landmarks = []
        for i in range(21):
            if i == 4:  # Thumb tip
                landmarks.append((0.5, 0.5, 0))
            elif i == 8:  # Index tip
                landmarks.append((0.52, 0.5, 0))  # Close to thumb
            else:
                landmarks.append((0.3, 0.3, 0))

        extraction = extraction_factory(landmarks)
        result = classifier.classify(extraction)

        assert result.raw_output["is_controlling"] is True
        assert result.raw_output["pinch_distance"] < 0.05

    def test_no_pinch_when_fingers_apart(self, classifier, extraction_factory):
        """Test that pinch is not detected when fingers are far apart."""
        landmarks = []
        for i in range(21):
            if i == 4:  # Thumb tip
                landmarks.append((0.2, 0.5, 0))
            elif i == 8:  # Index tip
                landmarks.append((0.8, 0.5, 0))  # Far from thumb
            else:
                landmarks.append((0.5, 0.5, 0))

        extraction = extraction_factory(landmarks)
        result = classifier.classify(extraction)

        assert result.raw_output["is_controlling"] is False

    def test_volume_increase_on_upward_movement(self, classifier, extraction_factory):
        """Test volume increase when pinch moves upward."""
        # First frame - pinch at lower position
        landmarks1 = self._create_pinch_landmarks(y_position=0.6)
        extraction1 = extraction_factory(landmarks1)
        classifier.classify(extraction1)

        # Second frame - pinch moved up
        landmarks2 = self._create_pinch_landmarks(y_position=0.3)
        extraction2 = extraction_factory(landmarks2)
        result = classifier.classify(extraction2)

        assert result.raw_output["gesture"] == "increase"
        assert result.raw_output["volume_delta"] > 0

    def test_volume_decrease_on_downward_movement(self, classifier, extraction_factory):
        """Test volume decrease when pinch moves downward."""
        # First frame - pinch at higher position
        landmarks1 = self._create_pinch_landmarks(y_position=0.3)
        extraction1 = extraction_factory(landmarks1)
        classifier.classify(extraction1)

        # Second frame - pinch moved down
        landmarks2 = self._create_pinch_landmarks(y_position=0.6)
        extraction2 = extraction_factory(landmarks2)
        result = classifier.classify(extraction2)

        assert result.raw_output["gesture"] == "decrease"
        assert result.raw_output["volume_delta"] < 0

    def test_empty_extraction(self, classifier):
        """Test handling of empty extraction result."""
        extraction = ExtractionResult(
            hands=[],
            extraction_latency_ms=5,
            model_confidence=0.95,
            frame_timestamp=0
        )

        result = classifier.classify(extraction)

        assert result.raw_output["is_controlling"] is False
        assert result.raw_output["volume_delta"] == 0

    def _create_pinch_landmarks(self, y_position: float):
        """Helper to create landmarks with thumb and index pinched at given y."""
        landmarks = []
        for i in range(21):
            if i == 4:  # Thumb tip
                landmarks.append((0.5, y_position, 0))
            elif i == 8:  # Index tip
                landmarks.append((0.52, y_position, 0))
            else:
                landmarks.append((0.3, 0.3, 0))
        return landmarks
```

### Integration Testing

```python
# tests/integration/test_volume_pipeline.py

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch


class TestVolumeControlPipeline:
    """Integration tests for the complete volume control pipeline."""

    @pytest.fixture
    async def pipeline(self):
        """Create a configured pipeline for testing."""
        from pipelines.orchestrator import PipelineOrchestrator
        from core.dependencies import (
            get_preprocessing_pipeline,
            get_extraction_pipeline,
            get_inference_engine,
            get_output_pipeline
        )

        # Create mock ingestion
        mock_ingestion = Mock()
        mock_ingestion.state = "capturing"
        mock_ingestion.get_frame = AsyncMock()

        orchestrator = PipelineOrchestrator(
            ingestion=mock_ingestion,
            preprocessing=get_preprocessing_pipeline(),
            extraction=get_extraction_pipeline(),
            inference=get_inference_engine(),
            output=get_output_pipeline()
        )

        return orchestrator

    @pytest.mark.asyncio
    async def test_full_pipeline_flow(self, pipeline):
        """Test complete data flow through pipeline."""
        # This would be implemented with proper mocking
        pass

    @pytest.mark.asyncio
    async def test_volume_action_integration(self):
        """Test volume control action with mock audio interface."""
        from pipelines.output.actions.volume_control import VolumeControlAction

        action = VolumeControlAction()

        with patch.object(action, '_volume_interface') as mock_volume:
            mock_volume.GetMasterVolumeLevelScalar.return_value = 0.5
            action._initialized = True

            # Test volume adjustment
            from pipelines.inference.engine import InferenceResult, GestureType

            result = InferenceResult(
                gesture_type=GestureType.PINCH,
                confidence=0.95,
                raw_output={
                    "gesture": "increase",
                    "volume_delta": 0.5
                },
                inference_latency_ms=5
            )

            success = await action.execute(result)

            assert success
            mock_volume.SetMasterVolumeLevelScalar.assert_called()
```

---

## Best Practices Checklist

### Code Quality

- [ ] All types are properly defined with dataclasses/Pydantic
- [ ] Functions have docstrings with Args, Returns, Raises
- [ ] Edge cases are handled (empty data, missing values)
- [ ] Constants are defined in configuration
- [ ] No hardcoded values in business logic

### Performance

- [ ] Processing latency is measured and logged
- [ ] Heavy operations are async where possible
- [ ] State is minimal and well-scoped
- [ ] Memory allocations are minimized in hot paths

### Testing

- [ ] Unit tests cover core logic paths
- [ ] Edge cases are tested (empty, null, error conditions)
- [ ] Integration tests verify pipeline flow
- [ ] Performance tests for latency requirements

### Documentation

- [ ] README for the project/feature
- [ ] API documentation for public interfaces
- [ ] Usage examples with code snippets
- [ ] Architecture decision records for complex choices

---

## Common Patterns

### Gesture State Machine

```python
from enum import Enum
from dataclasses import dataclass
from typing import Optional


class GestureState(Enum):
    IDLE = "idle"
    DETECTING = "detecting"
    CONFIRMED = "confirmed"
    EXECUTING = "executing"
    COOLDOWN = "cooldown"


@dataclass
class GestureStateMachine:
    """State machine for gesture detection with hysteresis."""

    state: GestureState = GestureState.IDLE
    confidence_threshold: float = 0.8
    confirmation_frames: int = 3
    cooldown_frames: int = 10

    _confidence_buffer: list = None
    _cooldown_counter: int = 0

    def __post_init__(self):
        self._confidence_buffer = []

    def update(self, confidence: float, gesture_detected: bool) -> bool:
        """Update state machine with new frame data. Returns True if gesture should fire."""

        if self.state == GestureState.COOLDOWN:
            self._cooldown_counter -= 1
            if self._cooldown_counter <= 0:
                self.state = GestureState.IDLE
            return False

        if gesture_detected and confidence >= self.confidence_threshold:
            self._confidence_buffer.append(confidence)

            if self.state == GestureState.IDLE:
                self.state = GestureState.DETECTING

            if len(self._confidence_buffer) >= self.confirmation_frames:
                avg_confidence = sum(self._confidence_buffer) / len(self._confidence_buffer)
                if avg_confidence >= self.confidence_threshold:
                    self.state = GestureState.CONFIRMED
                    self._confidence_buffer = []
                    return True
        else:
            self._confidence_buffer = []
            if self.state in (GestureState.DETECTING, GestureState.CONFIRMED):
                self.state = GestureState.IDLE

        return False

    def trigger_cooldown(self):
        """Enter cooldown state after gesture execution."""
        self.state = GestureState.COOLDOWN
        self._cooldown_counter = self.cooldown_frames
```

### Smoothing Filter

```python
import numpy as np
from collections import deque


class ExponentialSmoother:
    """Exponential moving average smoother for gesture values."""

    def __init__(self, alpha: float = 0.3):
        self.alpha = alpha
        self._value: Optional[float] = None

    def update(self, new_value: float) -> float:
        if self._value is None:
            self._value = new_value
        else:
            self._value = self.alpha * new_value + (1 - self.alpha) * self._value
        return self._value

    def reset(self):
        self._value = None


class OneEuroFilter:
    """One Euro Filter for jitter reduction with low latency."""

    def __init__(
        self,
        min_cutoff: float = 1.0,
        beta: float = 0.0,
        d_cutoff: float = 1.0
    ):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff

        self._x_filter = LowPassFilter(self._compute_alpha(min_cutoff))
        self._dx_filter = LowPassFilter(self._compute_alpha(d_cutoff))
        self._last_time: Optional[float] = None

    def __call__(self, x: float, t: float) -> float:
        if self._last_time is None:
            self._last_time = t
            return x

        # Compute derivative
        dt = t - self._last_time
        if dt <= 0:
            dt = 1e-6

        dx = (x - self._x_filter.value) / dt if self._x_filter.value is not None else 0
        edx = self._dx_filter(dx, self._compute_alpha(self.d_cutoff))

        # Adaptive cutoff
        cutoff = self.min_cutoff + self.beta * abs(edx)

        # Filter
        result = self._x_filter(x, self._compute_alpha(cutoff))

        self._last_time = t
        return result

    def _compute_alpha(self, cutoff: float) -> float:
        tau = 1.0 / (2 * np.pi * cutoff)
        return 1.0 / (1.0 + tau)
```

---

This guide provides the foundation for extending the Gesture Control Platform with new pipelines and classifiers. Follow these patterns to ensure consistency, testability, and maintainability across all features.
