"""
Finger Count Classifier
========================

Gesture classifier for counting raised fingers and detecting hand poses.
"""

import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from collections import deque

from core.types import (
    GestureType, HandLabel, FingerStates,
    ExtractionResult, InferenceResult
)
from pipelines.inference.engine import GestureClassifier
from .config import FingerCountConfig


@dataclass
class HandAnalysis:
    """Analysis result for a single hand."""
    label: str
    fingers_up: int
    finger_states: FingerStates
    confidence: float
    pose: str


class FingerCountClassifier(GestureClassifier):
    """
    Classifier for finger counting and pose detection.
    
    Features:
    - Counts raised fingers (0-5 per hand, 0-10 total)
    - Detects hand poses (fist, peace, thumbs up, etc.)
    - Temporal smoothing for stable output
    - Per-finger state tracking
    """
    
    # Finger landmark indices
    THUMB_TIP, THUMB_IP = 4, 3
    INDEX_TIP, INDEX_PIP = 8, 6
    MIDDLE_TIP, MIDDLE_PIP = 12, 10
    RING_TIP, RING_PIP = 16, 14
    PINKY_TIP, PINKY_PIP = 20, 18
    
    def __init__(self, config: FingerCountConfig = None):
        self.config = config or FingerCountConfig()
        
        # Temporal smoothing buffer
        self._history: deque = deque(maxlen=self.config.smoothing_frames)
        
        # Pose definitions (finger states -> pose name)
        self._pose_patterns = {
            # (thumb, index, middle, ring, pinky) -> pose
            (False, False, False, False, False): "fist",
            (True, True, True, True, True): "open_palm",
            (False, True, True, False, False): "peace",
            (True, False, False, False, False): "thumbs_up",
            (False, True, False, False, False): "pointing",
            (True, True, False, False, True): "call",  # Rock on / Call me
            (True, False, False, False, True): "shaka",  # Hang loose
        }
    
    @property
    def name(self) -> str:
        return "finger_count"
    
    @property
    def supported_gestures(self) -> List[GestureType]:
        return [
            GestureType.FINGER_COUNT,
            GestureType.FIST,
            GestureType.OPEN_PALM,
            GestureType.PEACE,
            GestureType.THUMBS_UP,
            GestureType.POINTING
        ]
    
    def classify(self, extraction: ExtractionResult) -> InferenceResult:
        """
        Classify gesture from extraction result.
        
        Args:
            extraction: Hand landmarks from extraction pipeline
            
        Returns:
            InferenceResult with finger count and pose
        """
        start_time = time.perf_counter()
        
        # Skip if no hands detected
        if extraction.hands_detected == 0:
            if self.config.skip_empty_frames:
                return self._create_empty_result(start_time)
        
        # Analyze each hand
        hands_analysis: List[HandAnalysis] = []
        total_fingers = 0
        
        for hand in extraction.hands:
            analysis = self._analyze_hand(hand)
            hands_analysis.append(analysis)
            total_fingers += analysis.fingers_up
        
        # Apply temporal smoothing
        if self.config.smoothing_enabled:
            total_fingers = self._smooth_count(total_fingers)
        
        # Determine overall pose (based on first hand if available)
        pose = GestureType.FINGER_COUNT
        primary_pose = "none"
        
        if hands_analysis and self.config.pose_detection_enabled:
            primary_pose = hands_analysis[0].pose
            pose = self._pose_to_gesture_type(primary_pose)
        
        # Build result
        inference_latency = (time.perf_counter() - start_time) * 1000
        
        # Aggregate finger states
        combined_states = FingerStates()
        if hands_analysis:
            primary = hands_analysis[0].finger_states
            combined_states = primary
        
        return InferenceResult(
            gesture_type=pose,
            confidence=max([h.confidence for h in hands_analysis], default=0.0),
            raw_output=self._build_output(hands_analysis, primary_pose),
            inference_latency_ms=inference_latency,
            finger_count=total_fingers,
            finger_states=combined_states
        )
    
    def _analyze_hand(self, hand) -> HandAnalysis:
        """Analyze a single hand for finger states and pose."""
        landmarks = hand.landmarks
        label = hand.hand_label
        
        # Get finger states
        finger_states = self._detect_finger_states(landmarks, label)
        fingers_up = finger_states.count
        
        # Detect pose
        pose = self._detect_pose(finger_states)
        
        return HandAnalysis(
            label=label.value if hasattr(label, 'value') else str(label),
            fingers_up=fingers_up,
            finger_states=finger_states,
            confidence=hand.confidence,
            pose=pose
        )
    
    def _detect_finger_states(self, landmarks, hand_label) -> FingerStates:
        """Detect which fingers are raised."""
        if len(landmarks) < 21:
            return FingerStates()
        
        # Determine if left or right hand
        is_right = (
            hand_label == HandLabel.RIGHT or 
            hand_label == "Right" or 
            str(hand_label) == "Right"
        )
        
        # Thumb: compare x positions (different logic for left/right)
        if is_right:
            thumb_up = landmarks[self.THUMB_TIP].x > landmarks[self.THUMB_IP].x
        else:
            thumb_up = landmarks[self.THUMB_TIP].x < landmarks[self.THUMB_IP].x
        
        # Other fingers: tip.y < pip.y means finger is up
        # (Remember: y=0 is top of image)
        index_up = landmarks[self.INDEX_TIP].y < landmarks[self.INDEX_PIP].y
        middle_up = landmarks[self.MIDDLE_TIP].y < landmarks[self.MIDDLE_PIP].y
        ring_up = landmarks[self.RING_TIP].y < landmarks[self.RING_PIP].y
        pinky_up = landmarks[self.PINKY_TIP].y < landmarks[self.PINKY_PIP].y
        
        # Apply thumb detection setting
        if not self.config.thumb_detection_enabled:
            thumb_up = False
        
        return FingerStates(
            thumb=thumb_up,
            index=index_up,
            middle=middle_up,
            ring=ring_up,
            pinky=pinky_up
        )
    
    def _detect_pose(self, states: FingerStates) -> str:
        """Detect hand pose from finger states."""
        if not self.config.pose_detection_enabled:
            return "none"
        
        # Create tuple for pattern matching
        state_tuple = (
            states.thumb,
            states.index,
            states.middle,
            states.ring,
            states.pinky
        )
        
        # Check against known patterns
        pose = self._pose_patterns.get(state_tuple, "none")
        
        # Only return if pose is enabled
        if pose in self.config.enabled_poses:
            return pose
        
        return "none"
    
    def _smooth_count(self, count: int) -> int:
        """Apply temporal smoothing to finger count."""
        self._history.append(count)
        
        if len(self._history) < 2:
            return count
        
        # Return rounded average
        return round(sum(self._history) / len(self._history))
    
    def _pose_to_gesture_type(self, pose: str) -> GestureType:
        """Convert pose string to GestureType enum."""
        mapping = {
            "fist": GestureType.FIST,
            "open_palm": GestureType.OPEN_PALM,
            "peace": GestureType.PEACE,
            "thumbs_up": GestureType.THUMBS_UP,
            "pointing": GestureType.POINTING,
        }
        return mapping.get(pose, GestureType.FINGER_COUNT)
    
    def _build_output(
        self,
        hands_analysis: List[HandAnalysis],
        primary_pose: str
    ) -> Dict[str, Any]:
        """Build raw output dictionary."""
        hands_data = []
        
        for analysis in hands_analysis:
            hand_data = {
                "label": analysis.label,
                "fingers": analysis.fingers_up,
                "confidence": round(analysis.confidence, 3),
                "pose": analysis.pose
            }
            
            if self.config.show_finger_states:
                hand_data["finger_states"] = analysis.finger_states.to_dict()
            
            hands_data.append(hand_data)
        
        return {
            "hands_detected": len(hands_analysis),
            "hands": hands_data,
            "primary_pose": primary_pose,
            "smoothing_enabled": self.config.smoothing_enabled,
            "smoothing_frames": len(self._history)
        }
    
    def _create_empty_result(self, start_time: float) -> InferenceResult:
        """Create result for when no hands are detected."""
        inference_latency = (time.perf_counter() - start_time) * 1000
        
        return InferenceResult(
            gesture_type=GestureType.NONE,
            confidence=0.0,
            raw_output={
                "hands_detected": 0,
                "hands": [],
                "primary_pose": "none"
            },
            inference_latency_ms=inference_latency,
            finger_count=0,
            finger_states=FingerStates()
        )
    
    def reset(self):
        """Reset classifier state (clears smoothing history)."""
        self._history.clear()
