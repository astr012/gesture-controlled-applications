"""
Output Pipeline and Event Dispatcher
Handles dispatching gesture events and executing system actions.
"""

import asyncio
import time
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field

from core.types import InferenceResult, OutputEvent
from core.exceptions import OutputError
from core.logging_config import get_logger

logger = get_logger(__name__)


# Type alias for event listeners
EventListener = Callable[[OutputEvent], None]
AsyncEventListener = Callable[[OutputEvent], Any]


class OutputAction(ABC):
    """
    Abstract base class for output actions.
    
    Actions perform system-level operations based on gesture results,
    such as controlling volume, moving cursor, sending keystrokes, etc.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Unique action name."""
        pass
    
    @abstractmethod
    async def execute(self, inference: InferenceResult) -> bool:
        """
        Execute the action based on inference result.
        
        Args:
            inference: InferenceResult from inference pipeline
            
        Returns:
            True if action executed successfully
        """
        pass
    
    def initialize(self) -> bool:
        """Initialize the action (called once on registration)."""
        return True
    
    def cleanup(self):
        """Cleanup resources (called on unregistration)."""
        pass


@dataclass
class EventDispatcher:
    """
    Event dispatcher for routing gesture events to listeners.
    
    Supports both sync and async listeners, with topic-based filtering.
    """
    
    _listeners: Dict[str, List[EventListener]] = field(default_factory=dict)
    _async_listeners: Dict[str, List[AsyncEventListener]] = field(default_factory=dict)
    _global_listeners: List[EventListener] = field(default_factory=list)
    _async_global_listeners: List[AsyncEventListener] = field(default_factory=list)
    
    def add_listener(
        self,
        event_type: str,
        listener: EventListener
    ) -> Callable[[], None]:
        """
        Add a listener for a specific event type.
        
        Args:
            event_type: Event type to listen for
            listener: Callback function
            
        Returns:
            Unsubscribe function
        """
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        
        self._listeners[event_type].append(listener)
        
        def unsubscribe():
            if event_type in self._listeners:
                self._listeners[event_type].remove(listener)
        
        return unsubscribe
    
    def add_async_listener(
        self,
        event_type: str,
        listener: AsyncEventListener
    ) -> Callable[[], None]:
        """Add an async listener for a specific event type."""
        if event_type not in self._async_listeners:
            self._async_listeners[event_type] = []
        
        self._async_listeners[event_type].append(listener)
        
        def unsubscribe():
            if event_type in self._async_listeners:
                self._async_listeners[event_type].remove(listener)
        
        return unsubscribe
    
    def add_global_listener(self, listener: EventListener) -> Callable[[], None]:
        """Add a listener that receives all events."""
        self._global_listeners.append(listener)
        
        return lambda: self._global_listeners.remove(listener)
    
    def add_async_global_listener(
        self,
        listener: AsyncEventListener
    ) -> Callable[[], None]:
        """Add an async listener that receives all events."""
        self._async_global_listeners.append(listener)
        
        return lambda: self._async_global_listeners.remove(listener)
    
    async def dispatch(self, event: OutputEvent):
        """
        Dispatch an event to all relevant listeners.
        
        Args:
            event: OutputEvent to dispatch
        """
        # Call sync listeners for this event type
        if event.event_type in self._listeners:
            for listener in self._listeners[event.event_type]:
                try:
                    listener(event)
                except Exception as e:
                    logger.error(f"Listener error: {e}")
        
        # Call async listeners for this event type
        if event.event_type in self._async_listeners:
            tasks = []
            for listener in self._async_listeners[event.event_type]:
                tasks.append(listener(event))
            
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
        
        # Call global listeners
        for listener in self._global_listeners:
            try:
                listener(event)
            except Exception as e:
                logger.error(f"Global listener error: {e}")
        
        # Call async global listeners
        if self._async_global_listeners:
            tasks = [listener(event) for listener in self._async_global_listeners]
            await asyncio.gather(*tasks, return_exceptions=True)
    
    def clear(self):
        """Clear all listeners."""
        self._listeners.clear()
        self._async_listeners.clear()
        self._global_listeners.clear()
        self._async_global_listeners.clear()


class OutputPipeline:
    """
    Output pipeline stage.
    
    Converts inference results into output events and dispatches
    them to listeners. Also manages output actions for system control.
    
    Usage:
        output = OutputPipeline()
        
        # Add listener
        output.dispatcher.add_listener("gesture_detected", my_handler)
        
        # Process inference
        event = await output.process(inference_result, "finger_count")
    """
    
    _instance: Optional['OutputPipeline'] = None
    
    def __init__(self):
        self.dispatcher = EventDispatcher()
        self._actions: Dict[str, OutputAction] = {}
        self._output_times: list = []
        self._event_count: int = 0
    
    @classmethod
    def get_instance(cls) -> 'OutputPipeline':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    @property
    def average_latency(self) -> float:
        """Get average output latency in ms."""
        if not self._output_times:
            return 0.0
        return sum(self._output_times[-100:]) / len(self._output_times[-100:])
    
    @property
    def event_count(self) -> int:
        """Get total events dispatched."""
        return self._event_count
    
    def register_action(self, action: OutputAction) -> bool:
        """
        Register an output action.
        
        Args:
            action: OutputAction to register
            
        Returns:
            True if registered successfully
        """
        if not action.initialize():
            logger.error(f"Failed to initialize action: {action.name}")
            return False
        
        self._actions[action.name] = action
        logger.info(f"Registered action: {action.name}")
        return True
    
    def unregister_action(self, name: str) -> bool:
        """
        Unregister an action by name.
        
        Args:
            name: Action name to unregister
            
        Returns:
            True if removed, False if not found
        """
        if name in self._actions:
            self._actions[name].cleanup()
            del self._actions[name]
            logger.info(f"Unregistered action: {name}")
            return True
        
        return False
    
    async def process(
        self,
        inference: InferenceResult,
        project: str
    ) -> OutputEvent:
        """
        Process inference result into output event.
        
        Args:
            inference: InferenceResult from inference pipeline
            project: Project identifier
            
        Returns:
            OutputEvent that was created and dispatched
        """
        start_time = time.perf_counter()
        
        try:
            # Create output event
            event = OutputEvent(
                event_type="gesture_detected",
                project=project,
                timestamp=time.time(),
                data={
                    "gesture_type": inference.gesture_type.value,
                    "confidence": inference.confidence,
                    "inference_latency_ms": inference.inference_latency_ms,
                    **inference.raw_output
                }
            )
            
            # Execute registered actions for this project
            for action in self._actions.values():
                try:
                    await action.execute(inference)
                except Exception as e:
                    logger.error(f"Action {action.name} failed: {e}")
            
            # Dispatch event
            await self.dispatcher.dispatch(event)
            
            output_latency = (time.perf_counter() - start_time) * 1000
            self._output_times.append(output_latency)
            self._event_count += 1
            
            return event
            
        except Exception as e:
            raise OutputError(
                f"Output processing failed: {e}",
                cause=e
            )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get output pipeline statistics."""
        return {
            "event_count": self._event_count,
            "average_latency_ms": self.average_latency,
            "registered_actions": list(self._actions.keys()),
            "listener_counts": {
                event_type: len(listeners)
                for event_type, listeners in self.dispatcher._listeners.items()
            }
        }
    
    def cleanup(self):
        """Cleanup all resources."""
        for action in self._actions.values():
            action.cleanup()
        
        self._actions.clear()
        self.dispatcher.clear()
        logger.info("Output pipeline cleaned up")
