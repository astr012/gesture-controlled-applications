"""
Finger Count Actions
=====================

System actions triggered by finger count gestures.
"""

from typing import Optional
import asyncio

from core.types import InferenceResult, GestureType
from pipelines.output.dispatcher import OutputAction
from core.logging_config import get_logger

logger = get_logger(__name__)


class FingerCountActions(OutputAction):
    """
    Actions for finger count feature.
    
    This feature is primarily for display/demo purposes,
    but can trigger callbacks on specific counts.
    """
    
    def __init__(self):
        self._last_count: int = 0
        self._callbacks: dict = {}
    
    @property
    def name(self) -> str:
        return "finger_count_action"
    
    def register_count_callback(
        self,
        count: int,
        callback,
        cooldown_ms: int = 500
    ):
        """
        Register a callback for a specific finger count.
        
        Args:
            count: Finger count to trigger on (0-10)
            callback: Function to call (sync or async)
            cooldown_ms: Minimum time between triggers
        """
        self._callbacks[count] = {
            "fn": callback,
            "cooldown_ms": cooldown_ms,
            "last_triggered": 0
        }
    
    async def execute(self, inference: InferenceResult) -> bool:
        """
        Execute action based on finger count.
        
        Args:
            inference: Inference result with finger count
            
        Returns:
            True if action was executed
        """
        import time
        
        count = inference.finger_count or 0
        
        # Check if count changed significantly
        if count == self._last_count:
            return False
        
        self._last_count = count
        
        # Check for registered callback
        if count in self._callbacks:
            callback_info = self._callbacks[count]
            current_time = time.time() * 1000
            
            # Check cooldown
            if current_time - callback_info["last_triggered"] < callback_info["cooldown_ms"]:
                return False
            
            # Execute callback
            try:
                callback = callback_info["fn"]
                
                if asyncio.iscoroutinefunction(callback):
                    await callback(inference)
                else:
                    callback(inference)
                
                callback_info["last_triggered"] = current_time
                logger.debug(f"Executed callback for count {count}")
                return True
                
            except Exception as e:
                logger.error(f"Error executing callback: {e}")
                return False
        
        return False


class FingerCountDisplayAction(OutputAction):
    """
    Display action for finger count.
    
    Updates a display callback with current finger data.
    """
    
    def __init__(self, display_callback=None):
        self._display_callback = display_callback
    
    @property
    def name(self) -> str:
        return "finger_count_display"
    
    def set_display_callback(self, callback):
        """Set the display callback."""
        self._display_callback = callback
    
    async def execute(self, inference: InferenceResult) -> bool:
        """Update display with finger count data."""
        if not self._display_callback:
            return False
        
        data = {
            "finger_count": inference.finger_count,
            "gesture_type": inference.gesture_type.value,
            "confidence": inference.confidence,
            "finger_states": inference.finger_states.to_dict() if inference.finger_states else None
        }
        
        try:
            if asyncio.iscoroutinefunction(self._display_callback):
                await self._display_callback(data)
            else:
                self._display_callback(data)
            return True
        except Exception as e:
            logger.error(f"Display callback error: {e}")
            return False
