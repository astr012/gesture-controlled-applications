"""
Virtual Mouse Feature
=====================

Precision cursor control using hand gestures.

This feature provides:
- High-precision cursor tracking
- Click and drag gestures
- One Euro Filter smoothing
- Multi-gesture support
"""

from .classifier import VirtualMouseClassifier
from .config import VirtualMouseConfig
from .actions import VirtualMouseActions

__all__ = [
    "VirtualMouseFeature",
    "VirtualMouseClassifier",
    "VirtualMouseConfig",
    "VirtualMouseActions"
]


class VirtualMouseFeature:
    """
    Virtual Mouse Feature facade.
    """
    
    # Feature metadata
    ID = "virtual_mouse"
    NAME = "Precision Virtual Mouse"
    DESCRIPTION = "Control cursor with hand gestures"
    ICON = "🖱️"
    CATEGORY = "advanced"
    VERSION = "2.0.0"
    
    @classmethod
    def get_classifier(cls, config: VirtualMouseConfig = None):
        """Get configured classifier instance."""
        config = config or VirtualMouseConfig()
        return VirtualMouseClassifier(config)
    
    @classmethod
    def get_actions(cls):
        """Get actions handler instance."""
        return VirtualMouseActions()
    
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
                "pointing",
                "pinch",
                "drag"
            ],
            "features": [
                "High-precision cursor tracking",
                "One Euro Filter smoothing",
                "Click and drag gestures",
                "Calibration workflow"
            ],
            "requirements": [
                "Camera",
                "MediaPipe Hands",
                "pyautogui"
            ]
        }
