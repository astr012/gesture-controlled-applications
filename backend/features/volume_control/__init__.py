"""
Volume Control Feature
======================

Gesture-based volume control using pinch gestures.

This feature provides:
- Pinch-to-control volume adjustment
- Mute toggle with fist gesture
- Visual volume feedback
- Smooth volume interpolation
"""

from .classifier import VolumeControlClassifier
from .config import VolumeControlConfig
from .actions import VolumeControlActions

__all__ = [
    "VolumeControlFeature",
    "VolumeControlClassifier",
    "VolumeControlConfig",
    "VolumeControlActions"
]


class VolumeControlFeature:
    """
    Volume Control Feature facade.
    
    Provides easy access to feature components.
    """
    
    # Feature metadata
    ID = "volume_control"
    NAME = "Gesture Volume Controller"
    DESCRIPTION = "Control system audio volume with pinch gestures"
    ICON = "🔊"
    CATEGORY = "intermediate"
    VERSION = "2.0.0"
    
    @classmethod
    def get_classifier(cls, config: VolumeControlConfig = None):
        """Get configured classifier instance."""
        config = config or VolumeControlConfig()
        return VolumeControlClassifier(config)
    
    @classmethod
    def get_actions(cls):
        """Get actions handler instance."""
        return VolumeControlActions()
    
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
                "pinch",
                "fist"
            ],
            "features": [
                "Pinch-to-control volume",
                "Smooth interpolation",
                "Mute toggle with fist",
                "Visual feedback"
            ],
            "requirements": [
                "Camera",
                "MediaPipe Hands",
                "pycaw (Windows)"
            ]
        }
