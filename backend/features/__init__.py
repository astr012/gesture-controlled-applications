"""
Features Package
================

Each feature is a self-contained gesture control project with:
- classifier.py: Gesture classification logic
- actions.py: System actions to perform
- config.py: Feature-specific configuration
- README.md: Documentation

Available Features:
- finger_count: Smart finger counting with pose detection
- volume_control: Gesture-based volume control
- virtual_mouse: Air mouse control
- sign_language: ASL alphabet recognition
- presentation: Slideshow controller
"""

from typing import Dict, Type
from pipelines.inference.engine import GestureClassifier

# Feature registry - maps feature ID to classifier class
_feature_classifiers: Dict[str, Type[GestureClassifier]] = {}


def register_feature(feature_id: str, classifier_class: Type[GestureClassifier]):
    """Register a feature's classifier."""
    _feature_classifiers[feature_id] = classifier_class


def get_feature_classifier(feature_id: str) -> Type[GestureClassifier]:
    """Get a feature's classifier class."""
    return _feature_classifiers.get(feature_id)


def list_features() -> list:
    """List all registered feature IDs."""
    return list(_feature_classifiers.keys())


# Auto-register features on import
def _auto_register():
    """Auto-register all available features."""
    try:
        from .finger_count import FingerCountFeature
        register_feature("finger_count", FingerCountFeature.get_classifier())
    except ImportError:
        pass
    
    try:
        from .volume_control import VolumeControlFeature
        register_feature("volume_control", VolumeControlFeature.get_classifier())
    except ImportError:
        pass
    
    try:
        from .virtual_mouse import VirtualMouseFeature
        register_feature("virtual_mouse", VirtualMouseFeature.get_classifier())
    except ImportError:
        pass


# Run auto-registration
_auto_register()
