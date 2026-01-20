"""
One Euro Filter Implementation
===============================

High-quality smoothing filter for real-time signal processing.
Provides adaptive jitter reduction without adding latency.

Reference: "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems"
http://cristal.univ-lille.fr/~casiez/1euro/
"""

import math
import time


class LowPassFilter:
    """Simple first-order low-pass filter."""
    
    def __init__(self, alpha: float = 1.0):
        self._alpha = alpha
        self._y: float = None
        self._s: float = None
    
    def filter(self, value: float, alpha: float = None) -> float:
        """Apply filter to value."""
        if alpha is not None:
            self._alpha = alpha
        
        if self._y is None:
            self._s = value
        else:
            self._s = self._alpha * value + (1 - self._alpha) * self._s
        
        self._y = value
        return self._s
    
    def has_last_value(self) -> bool:
        return self._y is not None
    
    def last_value(self) -> float:
        return self._y
    
    def reset(self):
        self._y = None
        self._s = None


class OneEuroFilter:
    """
    One Euro Filter for smoothing noisy input.
    
    Features:
    - Adaptive cutoff based on signal velocity
    - Low latency at slow speeds
    - Good jitter reduction at high speeds
    
    Args:
        freq: Sampling frequency (Hz)
        min_cutoff: Minimum cutoff frequency (Hz)
        beta: Speed coefficient (higher = more responsive)
        d_cutoff: Derivative cutoff frequency (Hz)
    """
    
    def __init__(
        self,
        freq: float = 30.0,
        min_cutoff: float = 1.0,
        beta: float = 0.007,
        d_cutoff: float = 1.0
    ):
        self._freq = freq
        self._min_cutoff = min_cutoff
        self._beta = beta
        self._d_cutoff = d_cutoff
        
        self._x = LowPassFilter()
        self._dx = LowPassFilter()
        
        self._last_time: float = None
    
    @staticmethod
    def _alpha(cutoff: float, freq: float) -> float:
        """Calculate filter alpha from cutoff frequency."""
        tau = 1.0 / (2 * math.pi * cutoff)
        te = 1.0 / freq
        return 1.0 / (1.0 + tau / te)
    
    def filter(self, x: float, timestamp: float = None) -> float:
        """
        Filter the input value.
        
        Args:
            x: Input value
            timestamp: Current timestamp (seconds)
            
        Returns:
            Filtered value
        """
        # Update frequency based on timestamp
        if timestamp is not None and self._last_time is not None:
            dt = timestamp - self._last_time
            if dt > 0:
                self._freq = 1.0 / dt
        
        self._last_time = timestamp or time.time()
        
        # Calculate derivative
        prev_x = self._x.last_value() if self._x.has_last_value() else x
        dx = (x - prev_x) * self._freq
        
        # Filter derivative
        ed_alpha = self._alpha(self._d_cutoff, self._freq)
        edx = self._dx.filter(dx, ed_alpha)
        
        # Calculate cutoff
        cutoff = self._min_cutoff + self._beta * abs(edx)
        
        # Filter signal
        alpha = self._alpha(cutoff, self._freq)
        return self._x.filter(x, alpha)
    
    def reset(self):
        """Reset filter state."""
        self._x.reset()
        self._dx.reset()
        self._last_time = None


class OneEuroFilter2D:
    """
    One Euro Filter for 2D coordinates (x, y).
    """
    
    def __init__(
        self,
        freq: float = 30.0,
        min_cutoff: float = 1.0,
        beta: float = 0.007,
        d_cutoff: float = 1.0
    ):
        self._filter_x = OneEuroFilter(freq, min_cutoff, beta, d_cutoff)
        self._filter_y = OneEuroFilter(freq, min_cutoff, beta, d_cutoff)
    
    def filter(
        self,
        x: float,
        y: float,
        timestamp: float = None
    ) -> tuple:
        """
        Filter 2D coordinates.
        
        Args:
            x: X coordinate
            y: Y coordinate
            timestamp: Current timestamp
            
        Returns:
            (filtered_x, filtered_y)
        """
        return (
            self._filter_x.filter(x, timestamp),
            self._filter_y.filter(y, timestamp)
        )
    
    def reset(self):
        """Reset both filters."""
        self._filter_x.reset()
        self._filter_y.reset()
