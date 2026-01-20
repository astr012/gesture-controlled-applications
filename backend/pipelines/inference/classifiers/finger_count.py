"""
Finger Count Classifier
Detects and counts raised fingers on each hand.
"""

import time
from typing import List, Optional
from dataclasses import dataclass

from core.types import (
    ExtractionResult, InferenceResult, GestureType,
    HandLandmarks, FingerStates
)
from pipelines.inference.engine import GestureClassifier
from core.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class FingerCountConfig:
    """Configuration for finger count classifier."""
    # Threshold for considering a finger as "up"
    # Lower = more sensitive, Higher = less sensitive
    finger_up_threshold: float = 0.05
    
    # Enable thumb detection (can be unreliable)
    enable_thumb: bool = True
    
    # Number of frames for temporal smoothing
    smoothing_frames: int = 3


class FingerCountClassifier(GestureClassifier):
    """
    Classifier that counts raised fingers on detected hands.
    
    Detection logic:
    - For fingers (index, middle, ring, pinky): Compare tip Y position 
      with PIP joint Y position. If tip is above PIP, finger is up.
    - For thumb: Compare tip X position with IP joint X position,
      accounting for hand orientation (left/right).
    
    Features:
    - Per-hand finger counting (0-5 per hand)
    - Total finger count (0-10 for both hands)
    - Individual finger states (which fingers are up)
    - Pose detection (peace, thumbs up, fist, etc.)
    """
    
    # Landmark indices for finger tips and their reference joints
    FINGER_TIPS = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky
    FINGER_PIPS = [3, 6, 10, 14, 18]  # One joint below tip
    FINGER_MCPS = [2, 5, 9, 13, 17]   # Base of fingers
    
    def __init__(
        self,
        finger_up_threshold: float = 0.05,
        enable_thumb: bool = True,
        smoothing_frames: int = 3
    ):
        self.config = FingerCountConfig(
            finger_up_threshold=finger_up_threshold,
            enable_thumb=enable_thumb,
            smoothing_frames=smoothing_frames
        )
        
        # State for temporal smoothing
        self._history: List[int] = []
    
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
            GestureType.THUMBS_DOWN,
            GestureType.POINTING,
            GestureType.OK_SIGN
        ]
    
    def classify(self, extraction: ExtractionResult) -> InferenceResult:
        """
        Classify finger count from extracted hand data.
        
        Args:
            extraction: ExtractionResult with hand landmarks
            
        Returns:
            InferenceResult with finger count and states
        """
        start_time = time.perf_counter()
        
        hands_data = []
        total_fingers = 0
        
        for hand in extraction.hands:
            # Count fingers for this hand
            finger_states = self._get_finger_states(hand)
            count = finger_states.count
            total_fingers += count
            
            hands_data.append({
                "label": hand.hand_label.value if hasattr(hand.hand_label, 'value') else hand.hand_label,
                "finger_count": count,
                "finger_states": finger_states.to_dict(),
                "confidence": hand.confidence
            })
        
        # Apply temporal smoothing
        smoothed_total = self._smooth_count(total_fingers)
        
        # Detect pose based on finger states
        detected_pose = self._detect_pose(extraction.hands)
        
        inference_latency = (time.perf_counter() - start_time) * 1000
        
        # Determine primary gesture type
        gesture_type = detected_pose if detected_pose != GestureType.NONE else GestureType.FINGER_COUNT
        
        return InferenceResult(
            gesture_type=gesture_type,
            confidence=extraction.model_confidence,
            raw_output={
                "hands": hands_data,
                "total_fingers": smoothed_total,
                "raw_total": total_fingers,
                "detected_pose": detected_pose.value,
                "hands_detected": len(extraction.hands)
            },
            inference_latency_ms=inference_latency,
            finger_count=smoothed_total,
            finger_states=self._get_combined_states(extraction.hands)
        )
    
    def _get_finger_states(self, hand: HandLandmarks) -> FingerStates:
        """
        Determine which fingers are raised for a single hand.
        
        Args:
            hand: HandLandmarks data
            
        Returns:
            FingerStates with boolean for each finger
        """
        landmarks = hand.landmarks
        
        if len(landmarks) < 21:
            return FingerStates()
        
        # Determine hand orientation (for thumb)
        is_right_hand = hand.hand_label.value == "Right" if hasattr(hand.hand_label, 'value') else hand.hand_label == "Right"
        
        # Thumb: Compare tip X with IP joint X
        # For right hand: thumb is up if tip is to the left of IP
        # For left hand: thumb is up if tip is to the right of IP
        thumb_up = False
        if self.config.enable_thumb:
            thumb_tip = landmarks[4]
            thumb_ip = landmarks[3]
            
            if is_right_hand:
                thumb_up = thumb_tip.x < thumb_ip.x
            else:
                thumb_up = thumb_tip.x > thumb_ip.x
        
        # Other fingers: Compare tip Y with PIP Y (lower Y = higher on screen)
        index_up = landmarks[8].y < landmarks[6].y
        middle_up = landmarks[12].y < landmarks[10].y
        ring_up = landmarks[16].y < landmarks[14].y
        pinky_up = landmarks[20].y < landmarks[18].y
        
        return FingerStates(
            thumb=thumb_up,
            index=index_up,
            middle=middle_up,
            ring=ring_up,
            pinky=pinky_up
        )
    
    def _get_combined_states(self, hands: List[HandLandmarks]) -> Optional[FingerStates]:
        """Get combined finger states from all hands (OR logic)."""
        if not hands:
            return None
        
        combined = FingerStates()
        
        for hand in hands:
            states = self._get_finger_states(hand)
            combined.thumb = combined.thumb or states.thumb
            combined.index = combined.index or states.index
            combined.middle = combined.middle or states.middle
            combined.ring = combined.ring or states.ring
            combined.pinky = combined.pinky or states.pinky
        
        return combined
    
    def _smooth_count(self, count: int) -> int:
        """Apply temporal smoothing to finger count."""
        self._history.append(count)
        
        # Keep only recent history
        if len(self._history) > self.config.smoothing_frames:
            self._history.pop(0)
        
        # Return mode (most common value)
        if len(self._history) >= self.config.smoothing_frames:
            return max(set(self._history), key=self._history.count)
        
        return count
    
    def _detect_pose(self, hands: List[HandLandmarks]) -> GestureType:
        """
        Detect specific hand poses based on finger states.
        
        Args:
            hands: List of HandLandmarks
            
        Returns:
            Detected GestureType or NONE
        """
        if not hands:
            return GestureType.NONE
        
        # Use first/primary hand for pose detection
        states = self._get_finger_states(hands[0])
        
        # Fist: All fingers down
        if not any([states.thumb, states.index, states.middle, states.ring, states.pinky]):
            return GestureType.FIST
        
        # Open palm: All fingers up
        if all([states.thumb, states.index, states.middle, states.ring, states.pinky]):
            return GestureType.OPEN_PALM
        
        # Peace sign: Only index and middle up
        if (states.index and states.middle and 
            not states.ring and not states.pinky and not states.thumb):
            return GestureType.PEACE
        
        # Thumbs up: Only thumb up
        if (states.thumb and not states.index and 
            not states.middle and not states.ring and not states.pinky):
            return GestureType.THUMBS_UP
        
        # Pointing: Only index up
        if (states.index and not states.middle and 
            not states.ring and not states.pinky):
            return GestureType.POINTING
        
        # OK sign (approximation): Thumb and some fingers up in specific config
        # This is simplified - real OK sign detection would need distance check
        
        return GestureType.NONE
    
    def reset(self):
        """Reset classifier state."""
        self._history.clear()
