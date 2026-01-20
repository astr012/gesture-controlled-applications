"""
Finger Count Feature
====================

Complete finger counting and pose detection feature.

This feature provides:
- Real-time finger counting (0-10 across two hands)
- Pose detection (fist, peace, thumbs up, etc.)
- Per-finger state tracking
- Temporal smoothing for stability
"""

from .classifier import FingerCountClassifier
from .config import FingerCountConfig
from .actions import FingerCountActions

__all__ = [
    "FingerCountFeature",
    "FingerCountClassifier",
    "FingerCountConfig",
    "FingerCountActions"
]


class FingerCountFeature:
    """
    Finger Count Feature facade.
    
    Provides easy access to feature components.
    """
    
    # Feature metadata
    ID = "finger_count"
    NAME = "Smart Finger Counter"
    DESCRIPTION = "Real-time finger counting with pose detection"
    ICON = "✋"
    CATEGORY = "basic"
    VERSION = "2.0.0"
    
    @classmethod
    def get_classifier(cls, config: FingerCountConfig = None):
        """Get configured classifier instance."""
        config = config or FingerCountConfig()
        return FingerCountClassifier(config)
    
    @classmethod
    def get_actions(cls):
        """Get actions handler instance."""
        return FingerCountActions()
    
    @classmethod
    def get_metadata(cls) -> dict:
        """Get feature metadata."""
        return {
            "id": cls.ID,
            "name": cls.NAME,
            "description": cls.DESCRIPTION,
            "icon": cls.ICON,
            "category": cls.CATEGORY,
            "version": cls.VERSION,
            "supported_gestures": [
                "finger_count",
                "fist",
                "open_palm",
                "peace",
                "thumbs_up",
                "pointing"
            ],
            "features": [
                "Multi-hand tracking (up to 2 hands)",
                "Pose classification",
                "Temporal smoothing",
                "Per-finger state detection"
            ]
        }
