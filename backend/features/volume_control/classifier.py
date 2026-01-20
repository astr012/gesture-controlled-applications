"""
Volume Control Classifier
==========================

Gesture classifier for volume control using pinch distance.
"""

import time
import math
from typing import List, Optional
from dataclasses import dataclass

from core.types import GestureType, ExtractionResult, InferenceResult, HandLabel
from pipelines.inference.engine import GestureClassifier
from .config import VolumeControlConfig


@dataclass
class PinchState:
    """Current pinch state."""
    distance: float
    is_pinched: bool
    mapped_volume: float
    hand_label: str


class VolumeControlClassifier(GestureClassifier):
    """
    Classifier for volume control gestures.
    
    Detects:
    - Pinch gesture: thumb-to-index distance mapped to volume
    - Fist gesture: mute toggle
    """
    
    # Landmark indices
    THUMB_TIP = 4
    INDEX_TIP = 8
    
    def __init__(self, config: VolumeControlConfig = None):
        self.config = config or VolumeControlConfig()
        
        # State tracking
        self._current_volume: float = 0.5
        self._fist_start_time: Optional[float] = None
        self._is_muted: bool = False
        self._last_pinch_distance: float = 0.0
    
    @property
    def name(self) -> str:
        return "volume_control"
    
    @property
    def supported_gestures(self) -> List[GestureType]:
        return [GestureType.PINCH, GestureType.FIST]
    
    def classify(self, extraction: ExtractionResult) -> InferenceResult:
        """
        Classify volume control gesture.
        
        Args:
            extraction: Hand landmarks from extraction pipeline
            
        Returns:
            InferenceResult with volume control data
        """
        start_time = time.perf_counter()
        
        # Get preferred hand
        hand = self._get_preferred_hand(extraction)
        
        if not hand:
            return self._create_result(start_time, GestureType.NONE, 0.0)
        
        # Calculate pinch distance
        landmarks = hand.landmarks
        if len(landmarks) < 21:
            return self._create_result(start_time, GestureType.NONE, 0.0)
        
        thumb_tip = landmarks[self.THUMB_TIP]
        index_tip = landmarks[self.INDEX_TIP]
        
        # Calculate Euclidean distance (normalized coordinates)
        distance = math.sqrt(
            (thumb_tip.x - index_tip.x) ** 2 +
            (thumb_tip.y - index_tip.y) ** 2
        )
        
        self._last_pinch_distance = distance
        
        # Check for fist gesture (mute)
        if self.config.mute_enabled:
            is_fist = self._check_fist(landmarks)
            if is_fist:
                return self._handle_fist(start_time, hand.confidence)
        
        # Map pinch distance to volume
        pinch_state = self._calculate_pinch_state(distance, hand)
        
        # Apply smoothing
        if self.config.smoothing_enabled:
            self._current_volume = self._smooth_volume(pinch_state.mapped_volume)
        else:
            self._current_volume = pinch_state.mapped_volume
        
        # Determine gesture type
        gesture = GestureType.PINCH if pinch_state.is_pinched else GestureType.NONE
        
        return self._create_result(
            start_time,
            gesture,
            hand.confidence,
            pinch_distance=distance,
            volume_level=self._current_volume,
            is_muted=self._is_muted
        )
    
    def _get_preferred_hand(self, extraction: ExtractionResult):
        """Get the preferred hand for control."""
        if extraction.hands_detected == 0:
            return None
        
        if self.config.preferred_hand == "Any":
            return extraction.hands[0]
        
        for hand in extraction.hands:
            label = hand.hand_label
            label_str = label.value if hasattr(label, 'value') else str(label)
            
            if label_str == self.config.preferred_hand:
                return hand
        
        # Fall back to first hand
        return extraction.hands[0]
    
    def _calculate_pinch_state(self, distance: float, hand) -> PinchState:
        """Calculate pinch state and mapped volume."""
        # Clamp distance to range
        clamped = max(
            self.config.pinch_threshold_min,
            min(distance, self.config.pinch_threshold_max)
        )
        
        # Map to volume (inverse: small distance = low volume)
        # Normalize to 0-1 range
        range_size = self.config.pinch_threshold_max - self.config.pinch_threshold_min
        normalized = (clamped - self.config.pinch_threshold_min) / range_size
        
        # Map to volume range
        volume_range = self.config.volume_max - self.config.volume_min
        mapped_volume = self.config.volume_min + (normalized * volume_range)
        
        is_pinched = distance < self.config.pinch_threshold_min
        
        label = hand.hand_label
        label_str = label.value if hasattr(label, 'value') else str(label)
        
        return PinchState(
            distance=distance,
            is_pinched=is_pinched,
            mapped_volume=mapped_volume,
            hand_label=label_str
        )
    
    def _check_fist(self, landmarks) -> bool:
        """Check if hand is making a fist."""
        # Fist: all fingertips below their PIP joints
        tips = [8, 12, 16, 20]  # index, middle, ring, pinky tips
        pips = [6, 10, 14, 18]  # corresponding PIP joints
        
        for tip, pip in zip(tips, pips):
            if landmarks[tip].y < landmarks[pip].y:
                return False  # Finger is up, not a fist
        
        return True
    
    def _handle_fist(self, start_time: float, confidence: float) -> InferenceResult:
        """Handle fist gesture for mute toggle."""
        current_time = time.time()
        
        if self._fist_start_time is None:
            self._fist_start_time = current_time
        
        # Check if held long enough
        hold_duration = (current_time - self._fist_start_time) * 1000
        
        if hold_duration >= self.config.mute_hold_duration_ms:
            # Toggle mute
            self._is_muted = not self._is_muted
            self._fist_start_time = None  # Reset
            
            return self._create_result(
                start_time,
                GestureType.FIST,
                confidence,
                volume_level=self._current_volume,
                is_muted=self._is_muted,
                mute_toggled=True
            )
        
        return self._create_result(
            start_time,
            GestureType.FIST,
            confidence,
            volume_level=self._current_volume,
            is_muted=self._is_muted,
            fist_hold_progress=hold_duration / self.config.mute_hold_duration_ms
        )
    
    def _smooth_volume(self, target: float) -> float:
        """Apply exponential smoothing to volume."""
        alpha = self.config.smoothing_factor
        return alpha * target + (1 - alpha) * self._current_volume
    
    def _create_result(
        self,
        start_time: float,
        gesture: GestureType,
        confidence: float,
        **kwargs
    ) -> InferenceResult:
        """Create inference result."""
        inference_latency = (time.perf_counter() - start_time) * 1000
        
        raw_output = {
            "volume_level": kwargs.get("volume_level", self._current_volume),
            "volume_percent": int(kwargs.get("volume_level", self._current_volume) * 100),
            "is_muted": kwargs.get("is_muted", self._is_muted),
            "pinch_distance": kwargs.get("pinch_distance", self._last_pinch_distance),
        }
        
        # Add optional fields
        if "mute_toggled" in kwargs:
            raw_output["mute_toggled"] = kwargs["mute_toggled"]
        if "fist_hold_progress" in kwargs:
            raw_output["fist_hold_progress"] = kwargs["fist_hold_progress"]
        
        return InferenceResult(
            gesture_type=gesture,
            confidence=confidence,
            raw_output=raw_output,
            inference_latency_ms=inference_latency,
            pinch_distance=kwargs.get("pinch_distance")
        )
    
    def reset(self):
        """Reset classifier state."""
        self._current_volume = 0.5
        self._fist_start_time = None
        self._is_muted = False
