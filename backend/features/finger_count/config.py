"""
Finger Count Feature Configuration
===================================

Configuration dataclass for the finger count feature.
"""

from dataclasses import dataclass, field
from typing import List


@dataclass
class FingerCountConfig:
    """Configuration for finger count feature."""
    
    # Detection settings
    min_confidence: float = 0.7
    """Minimum detection confidence threshold."""
    
    # Smoothing
    smoothing_frames: int = 3
    """Number of frames for temporal smoothing."""
    
    smoothing_enabled: bool = True
    """Enable temporal smoothing."""
    
    # Thumb detection
    thumb_detection_enabled: bool = True
    """Include thumb in finger count."""
    
    thumb_angle_threshold: float = 0.05
    """Threshold for thumb up/down detection."""
    
    # Pose detection
    pose_detection_enabled: bool = True
    """Enable hand pose classification."""
    
    pose_min_confidence: float = 0.75
    """Minimum confidence for pose detection."""
    
    # Display settings
    display_mode: str = "detailed"
    """Display mode: 'minimal', 'detailed', 'debug'."""
    
    show_finger_states: bool = True
    """Show individual finger states in output."""
    
    show_landmarks: bool = False
    """Include raw landmarks in output."""
    
    # Performance
    max_hands: int = 2
    """Maximum number of hands to track."""
    
    skip_empty_frames: bool = True
    """Skip processing when no hands detected."""
    
    # Gestures to detect
    enabled_poses: List[str] = field(default_factory=lambda: [
        "fist",
        "open_palm", 
        "peace",
        "thumbs_up",
        "thumbs_down",
        "pointing",
        "call"
    ])
    """List of poses to detect."""
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "min_confidence": self.min_confidence,
            "smoothing_frames": self.smoothing_frames,
            "smoothing_enabled": self.smoothing_enabled,
            "thumb_detection_enabled": self.thumb_detection_enabled,
            "pose_detection_enabled": self.pose_detection_enabled,
            "display_mode": self.display_mode,
            "max_hands": self.max_hands,
            "enabled_poses": self.enabled_poses
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'FingerCountConfig':
        """Create from dictionary."""
        return cls(
            min_confidence=data.get("min_confidence", 0.7),
            smoothing_frames=data.get("smoothing_frames", 3),
            smoothing_enabled=data.get("smoothing_enabled", True),
            thumb_detection_enabled=data.get("thumb_detection_enabled", True),
            pose_detection_enabled=data.get("pose_detection_enabled", True),
            display_mode=data.get("display_mode", "detailed"),
            max_hands=data.get("max_hands", 2),
            enabled_poses=data.get("enabled_poses", [])
        )
