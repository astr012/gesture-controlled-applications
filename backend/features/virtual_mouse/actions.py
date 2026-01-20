"""
Virtual Mouse Actions
======================

Cursor control actions using pyautogui.
"""

import asyncio
from typing import Optional

from core.types import InferenceResult, GestureType
from pipelines.output.dispatcher import OutputAction
from core.logging_config import get_logger

logger = get_logger(__name__)


class VirtualMouseActions(OutputAction):
    """
    Cursor control actions using pyautogui.
    """
    
    def __init__(self):
        self._pyautogui = None
        self._initialized = False
        self._is_mouse_down = False
        
        self._initialize()
    
    @property
    def name(self) -> str:
        return "virtual_mouse"
    
    def _initialize(self):
        """Initialize pyautogui."""
        try:
            import pyautogui
            
            # Configure pyautogui
            pyautogui.FAILSAFE = True  # Move to corner to abort
            pyautogui.PAUSE = 0  # No delay between actions
            
            self._pyautogui = pyautogui
            self._initialized = True
            logger.info("Virtual mouse initialized with pyautogui")
            
        except ImportError:
            logger.error("pyautogui not installed. Run: pip install pyautogui")
    
    async def execute(self, inference: InferenceResult) -> bool:
        """
        Execute cursor control action.
        """
        if not self._initialized:
            return False
        
        raw = inference.raw_output
        
        cursor_x = raw.get("cursor_x", 0)
        cursor_y = raw.get("cursor_y", 0)
        click = raw.get("click", False)
        drag = raw.get("drag", False)
        release = raw.get("release", False)
        
        try:
            # Move cursor
            self._pyautogui.moveTo(cursor_x, cursor_y, _pause=False)
            
            # Handle click
            if click and not self._is_mouse_down:
                self._pyautogui.click(_pause=False)
                logger.debug(f"Click at ({cursor_x}, {cursor_y})")
                return True
            
            # Handle drag start
            if drag and not self._is_mouse_down:
                self._pyautogui.mouseDown(_pause=False)
                self._is_mouse_down = True
                logger.debug("Mouse down (drag start)")
                return True
            
            # Handle drag release
            if release and self._is_mouse_down:
                self._pyautogui.mouseUp(_pause=False)
                self._is_mouse_down = False
                logger.debug("Mouse up (drag end)")
                return True
            
            return True
            
        except Exception as e:
            logger.error(f"Cursor control error: {e}")
            
            # Ensure mouse is released on error
            if self._is_mouse_down:
                try:
                    self._pyautogui.mouseUp()
                except:
                    pass
                self._is_mouse_down = False
            
            return False
    
    def click(self, x: int = None, y: int = None, button: str = "left"):
        """Perform a click."""
        if not self._initialized:
            return
        
        if x is not None and y is not None:
            self._pyautogui.click(x, y, button=button, _pause=False)
        else:
            self._pyautogui.click(button=button, _pause=False)
    
    def double_click(self, x: int = None, y: int = None):
        """Perform a double click."""
        if not self._initialized:
            return
        
        if x is not None and y is not None:
            self._pyautogui.doubleClick(x, y, _pause=False)
        else:
            self._pyautogui.doubleClick(_pause=False)
    
    def right_click(self, x: int = None, y: int = None):
        """Perform a right click."""
        self.click(x, y, button="right")
    
    def move_to(self, x: int, y: int, duration: float = 0):
        """Move cursor to position."""
        if not self._initialized:
            return
        
        self._pyautogui.moveTo(x, y, duration=duration, _pause=False)
    
    def get_position(self) -> tuple:
        """Get current cursor position."""
        if self._initialized:
            return self._pyautogui.position()
        return (0, 0)
    
    def reset(self):
        """Reset state (release mouse if held)."""
        if self._is_mouse_down and self._initialized:
            try:
                self._pyautogui.mouseUp()
            except:
                pass
            self._is_mouse_down = False
