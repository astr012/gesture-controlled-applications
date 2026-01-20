"""
Volume Control Configuration
=============================

Configuration for the volume control feature.
"""

from dataclasses import dataclass


@dataclass
class VolumeControlConfig:
    """Configuration for volume control feature."""
    
    # Detection settings
    min_confidence: float = 0.75
    """Minimum hand detection confidence."""
    
    # Pinch detection
    pinch_threshold_min: float = 0.03
    """Distance below which is considered pinched."""
    
    pinch_threshold_max: float = 0.15
    """Distance above which is considered fully open."""
    
    # Volume mapping
    volume_min: float = 0.0
    """Minimum volume level (0.0 = 0%)."""
    
    volume_max: float = 1.0
    """Maximum volume level (1.0 = 100%)."""
    
    # Smoothing
    smoothing_factor: float = 0.3
    """Exponential smoothing factor (0-1)."""
    
    smoothing_enabled: bool = True
    """Enable volume smoothing."""
    
    # Gesture cooldown
    action_cooldown_ms: int = 100
    """Minimum time between volume changes."""
    
    # Mute gesture
    mute_enabled: bool = True
    """Enable fist-to-mute gesture."""
    
    mute_hold_duration_ms: int = 1000
    """Time to hold fist for mute toggle."""
    
    # Which hand to use
    preferred_hand: str = "Right"
    """Preferred hand for control: 'Left', 'Right', 'Any'."""
    
    # Display
    show_volume_level: bool = True
    """Show current volume in output."""
    
    show_pinch_distance: bool = False
    """Show raw pinch distance (debug)."""
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "min_confidence": self.min_confidence,
            "pinch_threshold_min": self.pinch_threshold_min,
            "pinch_threshold_max": self.pinch_threshold_max,
            "volume_min": self.volume_min,
            "volume_max": self.volume_max,
            "smoothing_factor": self.smoothing_factor,
            "smoothing_enabled": self.smoothing_enabled,
            "action_cooldown_ms": self.action_cooldown_ms,
            "mute_enabled": self.mute_enabled,
            "preferred_hand": self.preferred_hand
        }
