"""
Virtual Mouse Classifier
=========================

Maps hand gestures to cursor control commands.
"""

import time
import math
from typing import List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from core.types import GestureType, ExtractionResult, InferenceResult
from pipelines.inference.engine import GestureClassifier
from .config import VirtualMouseConfig
from .filters import OneEuroFilter2D


class MouseState(Enum):
    """Current mouse control state."""
    IDLE = "idle"
    MOVING = "moving"
    CLICKING = "clicking"
    DRAGGING = "dragging"


@dataclass
class CursorCommand:
    """Command for cursor control."""
    x: int
    y: int
    state: MouseState
    click: bool = False
    drag: bool = False
    release: bool = False


class VirtualMouseClassifier(GestureClassifier):
    """
    Classifier for virtual mouse control.
    
    Maps hand position to screen coordinates with:
    - One Euro Filter smoothing
    - Click and drag detection
    - Gesture zone mapping
    """
    
    # Landmark indices
    INDEX_TIP = 8
    THUMB_TIP = 4
    PALM_BASE = 0
    
    def __init__(self, config: VirtualMouseConfig = None):
        self.config = config or VirtualMouseConfig()
        
        # Get screen dimensions
        self._screen_width = config.screen_width or 1920
        self._screen_height = config.screen_height or 1080
        
        try:
            import pyautogui
            size = pyautogui.size()
            self._screen_width = size.width
            self._screen_height = size.height
        except:
            pass
        
        # Initialize filter
        self._filter = OneEuroFilter2D(
            freq=30.0,
            min_cutoff=self.config.smoothing_min_cutoff,
            beta=self.config.smoothing_beta,
            d_cutoff=self.config.smoothing_d_cutoff
        )
        
        # State
        self._state = MouseState.IDLE
        self._click_start_time: Optional[float] = None
        self._last_click_time: float = 0
        self._is_dragging = False
        self._last_position: Tuple[int, int] = (0, 0)
    
    @property
    def name(self) -> str:
        return "virtual_mouse"
    
    @property
    def supported_gestures(self) -> List[GestureType]:
        return [GestureType.POINTING, GestureType.PINCH]
    
    def classify(self, extraction: ExtractionResult) -> InferenceResult:
        """
        Classify hand gesture for mouse control.
        """
        start_time = time.perf_counter()
        current_time = time.time()
        
        # Get tracking hand
        hand = self._get_tracking_hand(extraction)
        
        if not hand or len(hand.landmarks) < 21:
            self._state = MouseState.IDLE
            return self._create_result(start_time, GestureType.NONE)
        
        landmarks = hand.landmarks
        
        # Get tracking point (index finger tip)
        tracking_point = landmarks[self.INDEX_TIP]
        
        # Check if pointing (index finger up, others down)
        is_pointing = self._check_pointing(landmarks, hand.hand_label)
        
        if self.config.require_pointing_gesture and not is_pointing:
            self._state = MouseState.IDLE
            return self._create_result(start_time, GestureType.NONE)
        
        # Map to screen coordinates
        screen_x, screen_y = self._map_to_screen(tracking_point.x, tracking_point.y)
        
        # Apply smoothing
        if self.config.smoothing_enabled:
            screen_x, screen_y = self._filter.filter(screen_x, screen_y, current_time)
        
        screen_x, screen_y = int(screen_x), int(screen_y)
        self._last_position = (screen_x, screen_y)
        
        # Check for pinch (click)
        thumb_tip = landmarks[self.THUMB_TIP]
        index_tip = landmarks[self.INDEX_TIP]
        
        pinch_distance = math.sqrt(
            (thumb_tip.x - index_tip.x) ** 2 +
            (thumb_tip.y - index_tip.y) ** 2
        )
        
        is_pinched = pinch_distance < self.config.click_threshold
        
        # Update state
        command = self._update_state(is_pinched, screen_x, screen_y, current_time)
        
        # Determine gesture type
        if command.drag:
            gesture = GestureType.PINCH  # Using PINCH for drag
        elif command.click:
            gesture = GestureType.PINCH
        elif is_pointing:
            gesture = GestureType.POINTING
        else:
            gesture = GestureType.NONE
        
        return self._create_result(
            start_time,
            gesture,
            confidence=hand.confidence,
            cursor_x=screen_x,
            cursor_y=screen_y,
            click=command.click,
            drag=command.drag,
            release=command.release,
            pinch_distance=pinch_distance
        )
    
    def _get_tracking_hand(self, extraction: ExtractionResult):
        """Get the hand used for tracking."""
        if extraction.hands_detected == 0:
            return None
        
        if self.config.preferred_hand == "Any":
            return extraction.hands[0]
        
        for hand in extraction.hands:
            label = hand.hand_label
            label_str = label.value if hasattr(label, 'value') else str(label)
            if label_str == self.config.preferred_hand:
                return hand
        
        return extraction.hands[0]
    
    def _check_pointing(self, landmarks, hand_label) -> bool:
        """Check if hand is in pointing gesture."""
        # Index finger up, others down
        index_up = landmarks[8].y < landmarks[6].y
        middle_down = landmarks[12].y > landmarks[10].y
        ring_down = landmarks[16].y > landmarks[14].y
        pinky_down = landmarks[20].y > landmarks[18].y
        
        return index_up and middle_down and ring_down and pinky_down
    
    def _map_to_screen(self, norm_x: float, norm_y: float) -> Tuple[float, float]:
        """Map normalized hand coordinates to screen coordinates."""
        # Apply gesture zone
        zone_x = self.config.gesture_zone_x
        zone_y = self.config.gesture_zone_y
        
        # Clamp to zone
        x = max(zone_x[0], min(norm_x, zone_x[1]))
        y = max(zone_y[0], min(norm_y, zone_y[1]))
        
        # Normalize within zone
        x = (x - zone_x[0]) / (zone_x[1] - zone_x[0])
        y = (y - zone_y[0]) / (zone_y[1] - zone_y[0])
        
        # Map to screen (with margin)
        margin = self.config.screen_margin
        screen_x = margin + x * (self._screen_width - 2 * margin)
        screen_y = margin + y * (self._screen_height - 2 * margin)
        
        return screen_x, screen_y
    
    def _update_state(
        self,
        is_pinched: bool,
        x: int,
        y: int,
        current_time: float
    ) -> CursorCommand:
        """Update mouse state based on pinch."""
        command = CursorCommand(x=x, y=y, state=self._state)
        
        if is_pinched:
            if self._click_start_time is None:
                self._click_start_time = current_time
            
            hold_duration = (current_time - self._click_start_time) * 1000
            
            if hold_duration >= self.config.drag_start_delay_ms and not self._is_dragging:
                # Start drag
                self._is_dragging = True
                self._state = MouseState.DRAGGING
                command.state = MouseState.DRAGGING
                command.drag = True
                
            elif self._is_dragging:
                command.state = MouseState.DRAGGING
                command.drag = True
        else:
            if self._click_start_time is not None:
                hold_duration = (current_time - self._click_start_time) * 1000
                
                if self._is_dragging:
                    # End drag
                    command.release = True
                    self._is_dragging = False
                elif hold_duration < self.config.drag_start_delay_ms:
                    # Register click
                    command.click = True
                    
                    # Check for double click
                    if (current_time - self._last_click_time) * 1000 < self.config.double_click_interval_ms:
                        command.click = True  # Will be interpreted as double click
                    
                    self._last_click_time = current_time
                
                self._click_start_time = None
            
            self._state = MouseState.MOVING
            command.state = MouseState.MOVING
        
        return command
    
    def _create_result(
        self,
        start_time: float,
        gesture: GestureType,
        confidence: float = 0.0,
        **kwargs
    ) -> InferenceResult:
        """Create inference result."""
        inference_latency = (time.perf_counter() - start_time) * 1000
        
        raw_output = {
            "cursor_x": kwargs.get("cursor_x", self._last_position[0]),
            "cursor_y": kwargs.get("cursor_y", self._last_position[1]),
            "state": self._state.value,
            "click": kwargs.get("click", False),
            "drag": kwargs.get("drag", False),
            "release": kwargs.get("release", False),
            "screen_width": self._screen_width,
            "screen_height": self._screen_height
        }
        
        if "pinch_distance" in kwargs:
            raw_output["pinch_distance"] = kwargs["pinch_distance"]
        
        return InferenceResult(
            gesture_type=gesture,
            confidence=confidence,
            raw_output=raw_output,
            inference_latency_ms=inference_latency,
            pinch_distance=kwargs.get("pinch_distance")
        )
    
    def reset(self):
        """Reset classifier state."""
        self._filter.reset()
        self._state = MouseState.IDLE
        self._click_start_time = None
        self._is_dragging = False
