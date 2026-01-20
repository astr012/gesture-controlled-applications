# Backend Pipeline Architecture

> **Document**: 01-BACKEND-ARCHITECTURE.md  
> **Version**: 2.0.0  
> **Scope**: Backend restructuring with pipeline-based processing

---

## Overview

The backend architecture follows a **staged pipeline model** where each concern is isolated into specialized processing stages. This design enables:

- **Horizontal scaling** of individual stages
- **Clear testing boundaries** for each component
- **Performance optimization** at stage level
- **Easy extension** with new processing capabilities

---

## Pipeline Architecture

### Core Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PIPELINE ORCHESTRATOR                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   INGESTION  │───▶│ PREPROCESSING│───▶│  EXTRACTION  │───▶│  INFERENCE   │          │
│  │   PIPELINE   │    │   PIPELINE   │    │   PIPELINE   │    │   PIPELINE   │          │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │                   │
│         │                   │                   │                   │                   │
│         ▼                   ▼                   ▼                   ▼                   │
│  ┌────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         SHARED PIPELINE CONTEXT                                 │    │
│  │  • Session State  • Metrics Collector  • Error Handler  • Event Bus            │    │
│  └────────────────────────────────────────────────────────────────────────────────┘    │
│         │                                                                               │
│         ▼                                                                               │
│  ┌──────────────┐                                                                       │
│  │    OUTPUT    │───▶  WebSocket Events  │  System Actions  │  Notifications           │
│  │   PIPELINE   │                                                                       │
│  └──────────────┘                                                                       │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Pipeline Stage Definitions

### 1. Ingestion Pipeline

**Purpose**: Acquire raw data from camera or video streams with reliable buffering and rate control.

```python
# pipelines/ingestion/camera.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, AsyncIterator
import numpy as np
import asyncio
from enum import Enum


class CaptureState(Enum):
    IDLE = "idle"
    CAPTURING = "capturing"
    PAUSED = "paused"
    ERROR = "error"


@dataclass
class CaptureConfig:
    """Configuration for camera capture."""
    device_index: int = 0
    width: int = 640
    height: int = 480
    fps: int = 30
    buffer_size: int = 3
    auto_exposure: bool = True


@dataclass
class CapturedFrame:
    """Output from ingestion pipeline."""
    frame: np.ndarray
    timestamp: float
    frame_number: int
    capture_latency_ms: float
    metadata: dict


class IngestionPipeline(ABC):
    """Abstract base for all ingestion sources."""
    
    @abstractmethod
    async def initialize(self, config: CaptureConfig) -> bool:
        """Initialize the capture source."""
        pass
    
    @abstractmethod
    async def start(self) -> None:
        """Start frame acquisition."""
        pass
    
    @abstractmethod
    async def stop(self) -> None:
        """Stop frame acquisition."""
        pass
    
    @abstractmethod
    async def get_frame(self) -> Optional[CapturedFrame]:
        """Get the next available frame."""
        pass
    
    @abstractmethod
    def stream(self) -> AsyncIterator[CapturedFrame]:
        """Async generator for continuous streaming."""
        pass
    
    @property
    @abstractmethod
    def state(self) -> CaptureState:
        """Current capture state."""
        pass


class CameraIngestion(IngestionPipeline):
    """OpenCV-based camera ingestion with async support."""
    
    def __init__(self):
        self._state = CaptureState.IDLE
        self._cap = None
        self._config = None
        self._frame_buffer: asyncio.Queue = None
        self._capture_task = None
        self._frame_count = 0
    
    async def initialize(self, config: CaptureConfig) -> bool:
        import cv2
        
        self._config = config
        self._cap = cv2.VideoCapture(config.device_index)
        
        if not self._cap.isOpened():
            self._state = CaptureState.ERROR
            return False
        
        # Configure camera
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.width)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.height)
        self._cap.set(cv2.CAP_PROP_FPS, config.fps)
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, config.buffer_size)
        
        self._frame_buffer = asyncio.Queue(maxsize=config.buffer_size)
        self._state = CaptureState.IDLE
        return True
    
    async def start(self) -> None:
        if self._state == CaptureState.CAPTURING:
            return
        
        self._state = CaptureState.CAPTURING
        self._capture_task = asyncio.create_task(self._capture_loop())
    
    async def _capture_loop(self):
        """Background capture loop."""
        import cv2
        import time
        
        while self._state == CaptureState.CAPTURING:
            start_time = time.perf_counter()
            
            ret, frame = self._cap.read()
            
            if not ret:
                continue
            
            # Mirror the frame for natural interaction
            frame = cv2.flip(frame, 1)
            
            capture_latency = (time.perf_counter() - start_time) * 1000
            
            captured = CapturedFrame(
                frame=frame,
                timestamp=time.time(),
                frame_number=self._frame_count,
                capture_latency_ms=capture_latency,
                metadata={
                    "width": frame.shape[1],
                    "height": frame.shape[0],
                    "channels": frame.shape[2] if len(frame.shape) > 2 else 1
                }
            )
            
            self._frame_count += 1
            
            # Non-blocking put (drop old frames if buffer full)
            if self._frame_buffer.full():
                try:
                    self._frame_buffer.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            
            await self._frame_buffer.put(captured)
            
            # Rate limiting
            await asyncio.sleep(1 / self._config.fps)
    
    async def stop(self) -> None:
        self._state = CaptureState.IDLE
        if self._capture_task:
            self._capture_task.cancel()
            try:
                await self._capture_task
            except asyncio.CancelledError:
                pass
    
    async def get_frame(self) -> Optional[CapturedFrame]:
        try:
            return await asyncio.wait_for(
                self._frame_buffer.get(),
                timeout=1.0
            )
        except asyncio.TimeoutError:
            return None
    
    async def stream(self) -> AsyncIterator[CapturedFrame]:
        while self._state == CaptureState.CAPTURING:
            frame = await self.get_frame()
            if frame:
                yield frame
    
    @property
    def state(self) -> CaptureState:
        return self._state
    
    def release(self):
        if self._cap:
            self._cap.release()
```

**Key Design Decisions**:
- **Async-first**: All operations are async for non-blocking execution
- **Backpressure handling**: Old frames are dropped when buffer is full
- **Explicit configuration**: All settings are passed via `CaptureConfig`
- **Observable state**: `CaptureState` enum for monitoring

---

### 2. Preprocessing Pipeline

**Purpose**: Normalize and prepare frames for ML processing.

```python
# pipelines/preprocessing/normalizer.py

from dataclasses import dataclass
from typing import Optional, Tuple
from enum import Enum
import numpy as np


class ColorSpace(Enum):
    BGR = "bgr"
    RGB = "rgb"
    HSV = "hsv"
    GRAYSCALE = "grayscale"


@dataclass
class PreprocessConfig:
    """Configuration for preprocessing."""
    target_width: int = 640
    target_height: int = 480
    target_color_space: ColorSpace = ColorSpace.RGB
    normalize_values: bool = True
    enable_histogram_equalization: bool = False
    crop_region: Optional[Tuple[int, int, int, int]] = None  # x, y, w, h


@dataclass
class PreprocessedFrame:
    """Output from preprocessing pipeline."""
    frame: np.ndarray
    original_size: Tuple[int, int]
    processed_size: Tuple[int, int]
    color_space: ColorSpace
    preprocessing_latency_ms: float
    scale_factor: Tuple[float, float]


class PreprocessingPipeline:
    """Frame preprocessing with configurable transformations."""
    
    def __init__(self, config: PreprocessConfig):
        self.config = config
    
    def process(self, captured: 'CapturedFrame') -> PreprocessedFrame:
        import cv2
        import time
        
        start_time = time.perf_counter()
        frame = captured.frame.copy()
        original_size = (frame.shape[1], frame.shape[0])
        
        # Step 1: Color space conversion
        if self.config.target_color_space == ColorSpace.RGB:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        elif self.config.target_color_space == ColorSpace.HSV:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        elif self.config.target_color_space == ColorSpace.GRAYSCALE:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Step 2: Optional crop
        if self.config.crop_region:
            x, y, w, h = self.config.crop_region
            frame = frame[y:y+h, x:x+w]
        
        # Step 3: Resize if needed
        current_size = (frame.shape[1], frame.shape[0])
        if current_size != (self.config.target_width, self.config.target_height):
            frame = cv2.resize(
                frame,
                (self.config.target_width, self.config.target_height),
                interpolation=cv2.INTER_LINEAR
            )
        
        processed_size = (self.config.target_width, self.config.target_height)
        
        # Step 4: Optional histogram equalization
        if self.config.enable_histogram_equalization:
            if len(frame.shape) == 2:
                frame = cv2.equalizeHist(frame)
            else:
                # Apply to luminance channel only
                lab = cv2.cvtColor(frame, cv2.COLOR_RGB2LAB)
                lab[:, :, 0] = cv2.equalizeHist(lab[:, :, 0])
                frame = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        
        # Step 5: Normalize values to [0, 1]
        if self.config.normalize_values:
            frame = frame.astype(np.float32) / 255.0
        
        preprocessing_latency = (time.perf_counter() - start_time) * 1000
        
        return PreprocessedFrame(
            frame=frame,
            original_size=original_size,
            processed_size=processed_size,
            color_space=self.config.target_color_space,
            preprocessing_latency_ms=preprocessing_latency,
            scale_factor=(
                processed_size[0] / original_size[0],
                processed_size[1] / original_size[1]
            )
        )
```

---

### 3. Feature Extraction Pipeline

**Purpose**: Extract ML features (landmarks, keypoints, descriptors) from preprocessed frames.

```python
# pipelines/extraction/hand_tracker.py

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import numpy as np


@dataclass
class Landmark:
    """Single landmark point."""
    x: float  # Normalized [0, 1]
    y: float  # Normalized [0, 1]
    z: float  # Depth estimate
    pixel_x: int
    pixel_y: int
    visibility: float = 1.0


@dataclass
class HandLandmarks:
    """Complete hand landmark set (21 points per hand)."""
    hand_label: str  # "Left" or "Right"
    landmarks: List[Landmark]
    confidence: float
    wrist_position: Landmark = field(init=False)
    palm_center: Landmark = field(init=False)
    
    def __post_init__(self):
        if self.landmarks:
            self.wrist_position = self.landmarks[0]
            # Palm center approximation
            palm_indices = [0, 5, 9, 13, 17]
            palm_x = np.mean([self.landmarks[i].x for i in palm_indices])
            palm_y = np.mean([self.landmarks[i].y for i in palm_indices])
            palm_z = np.mean([self.landmarks[i].z for i in palm_indices])
            self.palm_center = Landmark(
                x=palm_x, y=palm_y, z=palm_z,
                pixel_x=int(palm_x * 640), pixel_y=int(palm_y * 480)
            )


@dataclass
class ExtractionResult:
    """Complete extraction output."""
    hands: List[HandLandmarks]
    extraction_latency_ms: float
    model_confidence: float
    frame_timestamp: float
    
    @property
    def hands_detected(self) -> int:
        return len(self.hands)
    
    def get_hand(self, label: str) -> Optional[HandLandmarks]:
        for hand in self.hands:
            if hand.hand_label == label:
                return hand
        return None


class HandExtractionPipeline:
    """MediaPipe-based hand landmark extraction."""
    
    def __init__(self, max_hands: int = 2, min_confidence: float = 0.7):
        self.max_hands = max_hands
        self.min_confidence = min_confidence
        self._hands_model = None
        self._initialized = False
    
    def initialize(self) -> bool:
        """Initialize MediaPipe hands model."""
        try:
            import mediapipe as mp
            
            self._mp_hands = mp.solutions.hands
            self._hands_model = self._mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=self.max_hands,
                min_detection_confidence=self.min_confidence,
                min_tracking_confidence=0.5
            )
            self._initialized = True
            return True
        except Exception as e:
            print(f"Failed to initialize hand tracker: {e}")
            return False
    
    def extract(
        self,
        preprocessed: 'PreprocessedFrame',
        frame_width: int = 640,
        frame_height: int = 480
    ) -> ExtractionResult:
        """Extract hand landmarks from preprocessed frame."""
        import time
        
        if not self._initialized:
            raise RuntimeError("Hand extraction pipeline not initialized")
        
        start_time = time.perf_counter()
        
        # MediaPipe expects RGB uint8
        frame = preprocessed.frame
        if preprocessed.color_space.value != "rgb":
            raise ValueError("Hand extraction requires RGB color space")
        
        # Convert back to uint8 if normalized
        if frame.dtype == np.float32:
            frame = (frame * 255).astype(np.uint8)
        
        # Run MediaPipe
        results = self._hands_model.process(frame)
        
        hands = []
        
        if results.multi_hand_landmarks and results.multi_handedness:
            for hand_landmarks, handedness in zip(
                results.multi_hand_landmarks,
                results.multi_handedness
            ):
                landmarks = []
                for lm in hand_landmarks.landmark:
                    landmarks.append(Landmark(
                        x=lm.x,
                        y=lm.y,
                        z=lm.z,
                        pixel_x=int(lm.x * frame_width),
                        pixel_y=int(lm.y * frame_height),
                        visibility=getattr(lm, 'visibility', 1.0)
                    ))
                
                hand = HandLandmarks(
                    hand_label=handedness.classification[0].label,
                    landmarks=landmarks,
                    confidence=handedness.classification[0].score
                )
                hands.append(hand)
        
        extraction_latency = (time.perf_counter() - start_time) * 1000
        
        return ExtractionResult(
            hands=hands,
            extraction_latency_ms=extraction_latency,
            model_confidence=self.min_confidence,
            frame_timestamp=time.time()
        )
    
    def release(self):
        """Release MediaPipe resources."""
        if self._hands_model:
            self._hands_model.close()
            self._initialized = False
```

---

### 4. Inference Pipeline

**Purpose**: Apply business logic and ML classifiers to extracted features.

```python
# pipelines/inference/engine.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
from enum import Enum


class GestureType(Enum):
    NONE = "none"
    FINGER_COUNT = "finger_count"
    PINCH = "pinch"
    SWIPE_LEFT = "swipe_left"
    SWIPE_RIGHT = "swipe_right"
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    FIST = "fist"
    OPEN_PALM = "open_palm"


@dataclass
class InferenceResult:
    """Output from inference pipeline."""
    gesture_type: GestureType
    confidence: float
    raw_output: Dict[str, Any]
    inference_latency_ms: float
    
    # Gesture-specific data
    finger_count: Optional[int] = None
    pinch_distance: Optional[float] = None
    gesture_velocity: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "gesture_type": self.gesture_type.value,
            "confidence": self.confidence,
            "finger_count": self.finger_count,
            "pinch_distance": self.pinch_distance,
            "gesture_velocity": self.gesture_velocity,
            "inference_latency_ms": self.inference_latency_ms,
            **self.raw_output
        }


class GestureClassifier(ABC):
    """Abstract base for gesture classifiers."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Classifier name."""
        pass
    
    @property
    @abstractmethod
    def supported_gestures(self) -> List[GestureType]:
        """List of gestures this classifier can detect."""
        pass
    
    @abstractmethod
    def classify(self, extraction: 'ExtractionResult') -> InferenceResult:
        """Classify gesture from extracted features."""
        pass


class FingerCountClassifier(GestureClassifier):
    """Classifier for counting raised fingers."""
    
    @property
    def name(self) -> str:
        return "finger_count"
    
    @property
    def supported_gestures(self) -> List[GestureType]:
        return [GestureType.FINGER_COUNT]
    
    def classify(self, extraction: 'ExtractionResult') -> InferenceResult:
        import time
        
        start_time = time.perf_counter()
        
        total_fingers = 0
        hands_data = []
        
        for hand in extraction.hands:
            landmarks = hand.landmarks
            hand_label = hand.hand_label
            
            fingers_up = 0
            finger_states = {}
            
            if len(landmarks) >= 21:
                # Thumb logic (different for left/right)
                if hand_label == "Right":
                    thumb_up = landmarks[4].x > landmarks[3].x
                else:
                    thumb_up = landmarks[4].x < landmarks[3].x
                
                finger_states["thumb"] = thumb_up
                if thumb_up:
                    fingers_up += 1
                
                # Other fingers: tip above PIP joint
                finger_tips = [8, 12, 16, 20]
                finger_pips = [6, 10, 14, 18]
                finger_names = ["index", "middle", "ring", "pinky"]
                
                for name, tip, pip in zip(finger_names, finger_tips, finger_pips):
                    is_up = landmarks[tip].y < landmarks[pip].y
                    finger_states[name] = is_up
                    if is_up:
                        fingers_up += 1
            
            total_fingers += fingers_up
            hands_data.append({
                "label": hand_label,
                "confidence": hand.confidence,
                "fingers": fingers_up,
                "finger_states": finger_states
            })
        
        inference_latency = (time.perf_counter() - start_time) * 1000
        
        return InferenceResult(
            gesture_type=GestureType.FINGER_COUNT,
            confidence=max([h.confidence for h in extraction.hands], default=0),
            raw_output={
                "hands": hands_data,
                "hands_detected": extraction.hands_detected
            },
            inference_latency_ms=inference_latency,
            finger_count=total_fingers
        )


class InferenceEngine:
    """Manages multiple classifiers and routes inference."""
    
    def __init__(self):
        self._classifiers: Dict[str, GestureClassifier] = {}
        self._active_classifier: Optional[str] = None
    
    def register_classifier(self, classifier: GestureClassifier):
        """Register a gesture classifier."""
        self._classifiers[classifier.name] = classifier
    
    def set_active_classifier(self, name: str) -> bool:
        """Set the active classifier by name."""
        if name in self._classifiers:
            self._active_classifier = name
            return True
        return False
    
    def infer(self, extraction: 'ExtractionResult') -> Optional[InferenceResult]:
        """Run inference with active classifier."""
        if not self._active_classifier:
            return None
        
        classifier = self._classifiers.get(self._active_classifier)
        if not classifier:
            return None
        
        return classifier.classify(extraction)
    
    def get_available_classifiers(self) -> List[str]:
        """List all registered classifiers."""
        return list(self._classifiers.keys())
```

---

### 5. Output Pipeline

**Purpose**: Execute actions and dispatch events based on inference results.

```python
# pipelines/output/dispatcher.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, List, Callable
from enum import Enum
import asyncio


class OutputEventType(Enum):
    GESTURE_DETECTED = "gesture_detected"
    VOLUME_CHANGED = "volume_changed"
    CURSOR_MOVED = "cursor_moved"
    CURSOR_CLICKED = "cursor_clicked"
    STATE_CHANGED = "state_changed"
    ERROR = "error"


@dataclass
class OutputEvent:
    """Event dispatched by output pipeline."""
    event_type: OutputEventType
    project: str
    timestamp: float
    data: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.event_type.value,
            "project": self.project,
            "timestamp": self.timestamp,
            "data": self.data
        }


class OutputAction(ABC):
    """Abstract base for system actions."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        pass
    
    @abstractmethod
    async def execute(self, inference: 'InferenceResult') -> bool:
        """Execute the action. Returns success status."""
        pass


class EventDispatcher:
    """Central event dispatcher for output pipeline."""
    
    def __init__(self):
        self._listeners: Dict[OutputEventType, List[Callable]] = {}
        self._websocket_handler = None
    
    def set_websocket_handler(self, handler: Callable):
        """Set the WebSocket handler for broadcasting events."""
        self._websocket_handler = handler
    
    def add_listener(
        self,
        event_type: OutputEventType,
        callback: Callable[[OutputEvent], None]
    ):
        """Add event listener."""
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(callback)
    
    async def dispatch(self, event: OutputEvent):
        """Dispatch event to all listeners."""
        # Local listeners
        listeners = self._listeners.get(event.event_type, [])
        for listener in listeners:
            try:
                if asyncio.iscoroutinefunction(listener):
                    await listener(event)
                else:
                    listener(event)
            except Exception as e:
                print(f"Error in event listener: {e}")
        
        # WebSocket broadcast
        if self._websocket_handler:
            try:
                await self._websocket_handler(event.to_dict())
            except Exception as e:
                print(f"Error broadcasting to WebSocket: {e}")


class OutputPipeline:
    """Coordinates output actions and event dispatching."""
    
    def __init__(self, dispatcher: EventDispatcher):
        self.dispatcher = dispatcher
        self._actions: Dict[str, OutputAction] = {}
    
    def register_action(self, action: OutputAction):
        """Register an output action."""
        self._actions[action.name] = action
    
    async def process(
        self,
        inference: 'InferenceResult',
        project: str,
        active_actions: List[str] = None
    ) -> OutputEvent:
        """Process inference result and dispatch events."""
        import time
        
        # Execute active actions
        if active_actions:
            for action_name in active_actions:
                action = self._actions.get(action_name)
                if action:
                    await action.execute(inference)
        
        # Create and dispatch event
        event = OutputEvent(
            event_type=OutputEventType.GESTURE_DETECTED,
            project=project,
            timestamp=time.time(),
            data=inference.to_dict()
        )
        
        await self.dispatcher.dispatch(event)
        
        return event
```

---

## Pipeline Orchestrator

The orchestrator coordinates all pipeline stages:

```python
# pipelines/orchestrator.py

from dataclasses import dataclass
from typing import Optional, Dict, Any
import asyncio
import time


@dataclass
class PipelineMetrics:
    """Aggregated pipeline performance metrics."""
    total_latency_ms: float
    ingestion_latency_ms: float
    preprocessing_latency_ms: float
    extraction_latency_ms: float
    inference_latency_ms: float
    output_latency_ms: float
    frames_processed: int
    frames_dropped: int
    errors_count: int


class PipelineOrchestrator:
    """Coordinates all pipeline stages for gesture processing."""
    
    def __init__(
        self,
        ingestion: 'IngestionPipeline',
        preprocessing: 'PreprocessingPipeline',
        extraction: 'HandExtractionPipeline',
        inference: 'InferenceEngine',
        output: 'OutputPipeline'
    ):
        self.ingestion = ingestion
        self.preprocessing = preprocessing
        self.extraction = extraction
        self.inference = inference
        self.output = output
        
        self._running = False
        self._current_project: Optional[str] = None
        self._metrics = PipelineMetrics(
            total_latency_ms=0,
            ingestion_latency_ms=0,
            preprocessing_latency_ms=0,
            extraction_latency_ms=0,
            inference_latency_ms=0,
            output_latency_ms=0,
            frames_processed=0,
            frames_dropped=0,
            errors_count=0
        )
    
    async def start(self, project: str, classifier: str):
        """Start the pipeline for a specific project."""
        if self._running:
            await self.stop()
        
        self._current_project = project
        self.inference.set_active_classifier(classifier)
        
        # Initialize extraction if needed
        if not self.extraction._initialized:
            self.extraction.initialize()
        
        # Start ingestion
        await self.ingestion.start()
        
        self._running = True
        
        # Start processing loop
        asyncio.create_task(self._processing_loop())
    
    async def stop(self):
        """Stop the pipeline."""
        self._running = False
        await self.ingestion.stop()
    
    async def _processing_loop(self):
        """Main processing loop."""
        while self._running:
            try:
                pipeline_start = time.perf_counter()
                
                # Stage 1: Ingestion
                captured = await self.ingestion.get_frame()
                if not captured:
                    continue
                
                # Stage 2: Preprocessing
                preprocessed = self.preprocessing.process(captured)
                
                # Stage 3: Extraction
                extraction = self.extraction.extract(preprocessed)
                
                # Stage 4: Inference
                inference = self.inference.infer(extraction)
                
                if inference:
                    # Stage 5: Output
                    output_start = time.perf_counter()
                    await self.output.process(
                        inference,
                        self._current_project
                    )
                    output_latency = (time.perf_counter() - output_start) * 1000
                    
                    # Update metrics
                    total_latency = (time.perf_counter() - pipeline_start) * 1000
                    self._update_metrics(
                        total_latency,
                        captured.capture_latency_ms,
                        preprocessed.preprocessing_latency_ms,
                        extraction.extraction_latency_ms,
                        inference.inference_latency_ms,
                        output_latency
                    )
                
                self._metrics.frames_processed += 1
                
            except Exception as e:
                self._metrics.errors_count += 1
                print(f"Pipeline error: {e}")
                continue
    
    def _update_metrics(
        self,
        total: float,
        ingestion: float,
        preprocessing: float,
        extraction: float,
        inference: float,
        output: float
    ):
        """Update running average of metrics."""
        alpha = 0.1  # Exponential moving average factor
        
        self._metrics.total_latency_ms = (
            alpha * total + (1 - alpha) * self._metrics.total_latency_ms
        )
        self._metrics.ingestion_latency_ms = (
            alpha * ingestion + (1 - alpha) * self._metrics.ingestion_latency_ms
        )
        self._metrics.preprocessing_latency_ms = (
            alpha * preprocessing + (1 - alpha) * self._metrics.preprocessing_latency_ms
        )
        self._metrics.extraction_latency_ms = (
            alpha * extraction + (1 - alpha) * self._metrics.extraction_latency_ms
        )
        self._metrics.inference_latency_ms = (
            alpha * inference + (1 - alpha) * self._metrics.inference_latency_ms
        )
        self._metrics.output_latency_ms = (
            alpha * output + (1 - alpha) * self._metrics.output_latency_ms
        )
    
    def get_metrics(self) -> PipelineMetrics:
        """Get current pipeline metrics."""
        return self._metrics
```

---

## Module Boundaries & Interfaces

### Interface Contract Summary

| Stage | Input Type | Output Type | Dependencies |
|-------|-----------|-------------|--------------|
| Ingestion | `CaptureConfig` | `CapturedFrame` | OpenCV |
| Preprocessing | `CapturedFrame` | `PreprocessedFrame` | NumPy, OpenCV |
| Extraction | `PreprocessedFrame` | `ExtractionResult` | MediaPipe |
| Inference | `ExtractionResult` | `InferenceResult` | Custom models |
| Output | `InferenceResult` | `OutputEvent` | pycaw, pyautogui |

### Dependency Injection Pattern

```python
# core/dependencies.py

from functools import lru_cache
from .config import Settings


@lru_cache()
def get_settings():
    return Settings()


def get_ingestion_pipeline(settings: Settings = None):
    from pipelines.ingestion.camera import CameraIngestion, CaptureConfig
    
    settings = settings or get_settings()
    pipeline = CameraIngestion()
    config = CaptureConfig(
        device_index=settings.camera_index,
        width=settings.camera_width,
        height=settings.camera_height,
        fps=settings.camera_fps
    )
    pipeline.initialize(config)
    return pipeline


def get_preprocessing_pipeline(settings: Settings = None):
    from pipelines.preprocessing.normalizer import (
        PreprocessingPipeline, PreprocessConfig, ColorSpace
    )
    
    settings = settings or get_settings()
    config = PreprocessConfig(
        target_width=settings.camera_width,
        target_height=settings.camera_height,
        target_color_space=ColorSpace.RGB
    )
    return PreprocessingPipeline(config)


def get_extraction_pipeline(settings: Settings = None):
    from pipelines.extraction.hand_tracker import HandExtractionPipeline
    
    settings = settings or get_settings()
    pipeline = HandExtractionPipeline(
        max_hands=2,
        min_confidence=settings.mediapipe_confidence
    )
    pipeline.initialize()
    return pipeline


def get_inference_engine():
    from pipelines.inference.engine import InferenceEngine, FingerCountClassifier
    
    engine = InferenceEngine()
    engine.register_classifier(FingerCountClassifier())
    return engine


def get_output_pipeline():
    from pipelines.output.dispatcher import OutputPipeline, EventDispatcher
    
    dispatcher = EventDispatcher()
    return OutputPipeline(dispatcher)


def get_pipeline_orchestrator(
    ingestion=None,
    preprocessing=None,
    extraction=None,
    inference=None,
    output=None
):
    from pipelines.orchestrator import PipelineOrchestrator
    
    return PipelineOrchestrator(
        ingestion=ingestion or get_ingestion_pipeline(),
        preprocessing=preprocessing or get_preprocessing_pipeline(),
        extraction=extraction or get_extraction_pipeline(),
        inference=inference or get_inference_engine(),
        output=output or get_output_pipeline()
    )
```

---

## Error Handling Strategy

```python
# core/exceptions.py

from enum import Enum
from typing import Optional


class ErrorSeverity(Enum):
    LOW = "low"          # Recoverable, continue processing
    MEDIUM = "medium"    # Degraded operation, log warning
    HIGH = "high"        # Critical, stop current operation
    FATAL = "fatal"      # System-wide failure, restart required


class PipelineError(Exception):
    """Base exception for pipeline errors."""
    
    def __init__(
        self,
        message: str,
        stage: str,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        cause: Optional[Exception] = None
    ):
        super().__init__(message)
        self.stage = stage
        self.severity = severity
        self.cause = cause


class IngestionError(PipelineError):
    def __init__(self, message: str, cause: Optional[Exception] = None):
        super().__init__(message, "ingestion", cause=cause)


class PreprocessingError(PipelineError):
    def __init__(self, message: str, cause: Optional[Exception] = None):
        super().__init__(message, "preprocessing", ErrorSeverity.LOW, cause)


class ExtractionError(PipelineError):
    def __init__(self, message: str, cause: Optional[Exception] = None):
        super().__init__(message, "extraction", cause=cause)


class InferenceError(PipelineError):
    def __init__(self, message: str, cause: Optional[Exception] = None):
        super().__init__(message, "inference", ErrorSeverity.LOW, cause)


class OutputError(PipelineError):
    def __init__(self, message: str, cause: Optional[Exception] = None):
        super().__init__(message, "output", cause=cause)
```

---

## Testing Strategy

### Unit Test Example

```python
# tests/unit/pipelines/test_inference.py

import pytest
from pipelines.inference.engine import (
    FingerCountClassifier,
    InferenceEngine,
    GestureType
)
from pipelines.extraction.hand_tracker import (
    ExtractionResult,
    HandLandmarks,
    Landmark
)


class TestFingerCountClassifier:
    
    @pytest.fixture
    def classifier(self):
        return FingerCountClassifier()
    
    @pytest.fixture
    def mock_extraction_all_fingers_up(self):
        # Create landmarks with all fingers up
        landmarks = []
        for i in range(21):
            landmarks.append(Landmark(
                x=0.5, y=0.2 if i in [4, 8, 12, 16, 20] else 0.5,
                z=0, pixel_x=320, pixel_y=100
            ))
        
        hand = HandLandmarks(
            hand_label="Right",
            landmarks=landmarks,
            confidence=0.95
        )
        
        return ExtractionResult(
            hands=[hand],
            extraction_latency_ms=10,
            model_confidence=0.95,
            frame_timestamp=0
        )
    
    def test_classify_five_fingers(self, classifier, mock_extraction_all_fingers_up):
        result = classifier.classify(mock_extraction_all_fingers_up)
        
        assert result.gesture_type == GestureType.FINGER_COUNT
        assert result.finger_count == 5
        assert result.confidence > 0.9
    
    def test_empty_extraction(self, classifier):
        extraction = ExtractionResult(
            hands=[],
            extraction_latency_ms=5,
            model_confidence=0.95,
            frame_timestamp=0
        )
        
        result = classifier.classify(extraction)
        
        assert result.finger_count == 0
```

---

## Performance Considerations

### Optimization Points

1. **Frame Buffering**: Triple buffering to prevent frame drops
2. **Async Processing**: All I/O operations are non-blocking
3. **Model Caching**: MediaPipe model loaded once at startup
4. **Memory Pools**: Reuse numpy arrays for frame processing
5. **Batch Processing**: Optional batch inference for multiple streams

### Profiling Integration

```python
# services/telemetry.py

import time
from contextlib import contextmanager
from typing import Dict
import logging


class PipelineProfiler:
    """Lightweight profiler for pipeline stages."""
    
    def __init__(self):
        self._stage_times: Dict[str, list] = {}
        self._logger = logging.getLogger(__name__)
    
    @contextmanager
    def profile_stage(self, stage_name: str):
        """Context manager for profiling a pipeline stage."""
        start = time.perf_counter()
        try:
            yield
        finally:
            elapsed = (time.perf_counter() - start) * 1000
            if stage_name not in self._stage_times:
                self._stage_times[stage_name] = []
            self._stage_times[stage_name].append(elapsed)
            
            # Log if exceeding threshold
            if elapsed > 30:  # 30ms threshold
                self._logger.warning(
                    f"Stage {stage_name} took {elapsed:.2f}ms"
                )
    
    def get_average_times(self) -> Dict[str, float]:
        """Get average execution time for each stage."""
        return {
            stage: sum(times) / len(times) if times else 0
            for stage, times in self._stage_times.items()
        }
```

---

## Summary

This backend architecture provides:

1. **Clear separation** between data acquisition, processing, inference, and output
2. **Explicit contracts** between pipeline stages via dataclasses
3. **Async-first design** for real-time performance
4. **Dependency injection** for testability and flexibility
5. **Comprehensive error handling** with severity levels
6. **Observable metrics** at every stage
7. **Extensible classifier system** for new gesture types

The architecture supports horizontal scaling by allowing stages to be distributed across processes or machines, while maintaining the simplicity needed for a single-machine development environment.
