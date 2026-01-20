"""
Virtual Mouse Configuration
============================

Configuration for the virtual mouse feature.
"""

from dataclasses import dataclass
from typing import Tuple, Optional


@dataclass
class VirtualMouseConfig:
    """Configuration for virtual mouse feature."""
    
    # Detection
    min_confidence: float = 0.8
    """Minimum hand detection confidence."""
    
    # Screen mapping
    screen_width: Optional[int] = None
    """Screen width (auto-detected if None)."""
    
    screen_height: Optional[int] = None
    """Screen height (auto-detected if None)."""
    
    screen_margin: int = 50
    """Margin from screen edge in pixels."""
    
    # Gesture zone (normalized 0-1)
    gesture_zone_x: Tuple[float, float] = (0.2, 0.8)
    """Horizontal gesture zone."""
    
    gesture_zone_y: Tuple[float, float] = (0.1, 0.9)
    """Vertical gesture zone."""
    
    # Smoothing
    smoothing_enabled: bool = True
    """Enable One Euro Filter smoothing."""
    
    smoothing_min_cutoff: float = 1.0
    """One Euro Filter min cutoff frequency."""
    
    smoothing_beta: float = 0.007
    """One Euro Filter beta (speed coefficient)."""
    
    smoothing_d_cutoff: float = 1.0
    """One Euro Filter derivative cutoff."""
    
    # Click detection
    click_threshold: float = 0.035
    """Pinch distance threshold for click."""
    
    click_hold_duration_ms: int = 100
    """Time to hold for click registration."""
    
    double_click_interval_ms: int = 400
    """Maximum interval for double click."""
    
    # Drag mode
    drag_start_delay_ms: int = 200
    """Delay before drag mode activates."""
    
    # Control
    preferred_hand: str = "Right"
    """Preferred hand: 'Left', 'Right', 'Any'."""
    
    use_index_finger: bool = True
    """Use index finger tip for tracking."""
    
    use_palm_for_stabilization: bool = False
    """Use palm center for stability."""
    
    # Safety
    movement_speed_limit: float = 2000.0
    """Maximum cursor speed (pixels/second)."""
    
    require_pointing_gesture: bool = True
    """Only move when pointing gesture detected."""
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "min_confidence": self.min_confidence,
            "screen_margin": self.screen_margin,
            "gesture_zone_x": self.gesture_zone_x,
            "gesture_zone_y": self.gesture_zone_y,
            "smoothing_enabled": self.smoothing_enabled,
            "smoothing_beta": self.smoothing_beta,
            "click_threshold": self.click_threshold,
            "double_click_interval_ms": self.double_click_interval_ms,
            "preferred_hand": self.preferred_hand
        }
