"""
Camera Ingestion Pipeline
Handles camera capture with buffering and async frame delivery.
"""

import asyncio
import time
from typing import Optional, AsyncIterator
from enum import Enum
from dataclasses import dataclass, field
import threading
import cv2
import numpy as np

from core.types import CapturedFrame
from core.exceptions import CameraError, IngestionError
from core.logging_config import get_logger

logger = get_logger(__name__)


class CaptureState(str, Enum):
    """Camera capture states."""
    IDLE = "idle"
    INITIALIZING = "initializing"
    CAPTURING = "capturing"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class CameraConfig:
    """Camera configuration."""
    camera_index: int = 0
    width: int = 640
    height: int = 480
    target_fps: int = 30
    buffer_size: int = 5
    auto_reconnect: bool = True
    reconnect_delay: float = 1.0


class CameraIngestion:
    """
    Camera ingestion pipeline stage.
    
    Captures frames from camera and provides async stream of CapturedFrame objects.
    Handles buffering, backpressure, and automatic reconnection.
    
    Usage:
        ingestion = CameraIngestion(camera_index=0)
        await ingestion.start()
        
        async for frame in ingestion.stream():
            # Process frame
            ...
        
        await ingestion.stop()
    """
    
    def __init__(
        self,
        camera_index: int = 0,
        target_fps: int = 30,
        width: int = 640,
        height: int = 480,
        buffer_size: int = 5,
        auto_reconnect: bool = True
    ):
        self.config = CameraConfig(
            camera_index=camera_index,
            width=width,
            height=height,
            target_fps=target_fps,
            buffer_size=buffer_size,
            auto_reconnect=auto_reconnect
        )
        
        self._state = CaptureState.IDLE
        self._capture: Optional[cv2.VideoCapture] = None
        self._frame_buffer: asyncio.Queue = None
        self._capture_thread: Optional[threading.Thread] = None
        self._frame_count: int = 0
        self._dropped_frames: int = 0
        self._last_frame_time: float = 0
        self._should_stop = threading.Event()
        
        # Performance tracking
        self._capture_times: list = []
    
    @property
    def state(self) -> CaptureState:
        """Get current capture state."""
        return self._state
    
    @property
    def is_capturing(self) -> bool:
        """Check if camera is actively capturing."""
        return self._state == CaptureState.CAPTURING
    
    @property
    def frame_count(self) -> int:
        """Get total frames captured."""
        return self._frame_count
    
    @property
    def dropped_frames(self) -> int:
        """Get count of dropped frames."""
        return self._dropped_frames
    
    @property
    def average_capture_latency(self) -> float:
        """Get average capture latency in ms."""
        if not self._capture_times:
            return 0.0
        return sum(self._capture_times[-100:]) / len(self._capture_times[-100:])
    
    async def start(self) -> bool:
        """
        Start camera capture.
        
        Returns:
            True if started successfully, False otherwise.
            
        Raises:
            CameraError: If camera initialization fails.
        """
        if self._state == CaptureState.CAPTURING:
            logger.warning("Camera already capturing")
            return True
        
        self._state = CaptureState.INITIALIZING
        logger.info(f"Starting camera {self.config.camera_index}")
        
        try:
            # Initialize camera
            self._capture = cv2.VideoCapture(self.config.camera_index)
            
            if not self._capture.isOpened():
                raise CameraError(
                    f"Failed to open camera {self.config.camera_index}",
                    camera_index=self.config.camera_index
                )
            
            # Configure camera properties
            self._capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.width)
            self._capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.height)
            self._capture.set(cv2.CAP_PROP_FPS, self.config.target_fps)
            
            # Get actual properties
            actual_width = int(self._capture.get(cv2.CAP_PROP_FRAME_WIDTH))
            actual_height = int(self._capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
            actual_fps = int(self._capture.get(cv2.CAP_PROP_FPS))
            
            logger.info(
                f"Camera initialized: {actual_width}x{actual_height} @ {actual_fps} FPS"
            )
            
            # Initialize buffer
            self._frame_buffer = asyncio.Queue(maxsize=self.config.buffer_size)
            self._should_stop.clear()
            
            # Start capture thread
            self._capture_thread = threading.Thread(
                target=self._capture_loop,
                daemon=True,
                name="CameraCapture"
            )
            self._capture_thread.start()
            
            self._state = CaptureState.CAPTURING
            return True
            
        except CameraError:
            self._state = CaptureState.ERROR
            raise
        except Exception as e:
            self._state = CaptureState.ERROR
            raise CameraError(
                f"Camera initialization failed: {e}",
                camera_index=self.config.camera_index,
                cause=e
            )
    
    async def stop(self):
        """Stop camera capture and release resources."""
        if self._state == CaptureState.STOPPED:
            return
        
        self._state = CaptureState.STOPPING
        logger.info("Stopping camera capture")
        
        # Signal thread to stop
        self._should_stop.set()
        
        # Wait for thread to finish
        if self._capture_thread and self._capture_thread.is_alive():
            self._capture_thread.join(timeout=2.0)
        
        # Release camera
        if self._capture:
            self._capture.release()
            self._capture = None
        
        self._state = CaptureState.STOPPED
        logger.info(
            f"Camera stopped. Captured: {self._frame_count}, Dropped: {self._dropped_frames}"
        )
    
    async def get_frame(self) -> Optional[CapturedFrame]:
        """
        Get next frame from buffer.
        
        Returns:
            CapturedFrame if available, None if buffer empty or not capturing.
        """
        if not self.is_capturing or self._frame_buffer is None:
            return None
        
        try:
            return await asyncio.wait_for(
                self._frame_buffer.get(),
                timeout=0.1
            )
        except asyncio.TimeoutError:
            return None
    
    async def stream(self) -> AsyncIterator[CapturedFrame]:
        """
        Async generator for streaming frames.
        
        Yields:
            CapturedFrame objects as they become available.
        """
        while self._state == CaptureState.CAPTURING:
            frame = await self.get_frame()
            if frame:
                yield frame
            else:
                # Small sleep to prevent busy loop
                await asyncio.sleep(0.001)
    
    def _capture_loop(self):
        """
        Internal capture loop running in background thread.
        Reads frames from camera and puts them in buffer.
        """
        frame_interval = 1.0 / self.config.target_fps
        
        while not self._should_stop.is_set():
            try:
                start_time = time.perf_counter()
                
                # Read frame
                ret, frame = self._capture.read()
                
                if not ret or frame is None:
                    logger.warning("Failed to read frame from camera")
                    if self.config.auto_reconnect:
                        self._attempt_reconnect()
                    continue
                
                capture_latency = (time.perf_counter() - start_time) * 1000
                self._capture_times.append(capture_latency)
                
                # Create frame object
                captured = CapturedFrame(
                    frame=frame,
                    timestamp=time.time(),
                    frame_number=self._frame_count,
                    capture_latency_ms=capture_latency,
                    width=frame.shape[1],
                    height=frame.shape[0],
                    channels=frame.shape[2] if len(frame.shape) > 2 else 1
                )
                
                # Try to put in buffer
                try:
                    self._frame_buffer.put_nowait(captured)
                    self._frame_count += 1
                except asyncio.QueueFull:
                    # Drop oldest frame if buffer is full
                    try:
                        self._frame_buffer.get_nowait()
                        self._frame_buffer.put_nowait(captured)
                        self._dropped_frames += 1
                    except:
                        pass
                
                # Rate limiting
                elapsed = time.perf_counter() - start_time
                sleep_time = max(0, frame_interval - elapsed)
                if sleep_time > 0:
                    time.sleep(sleep_time)
                
            except Exception as e:
                logger.error(f"Error in capture loop: {e}")
                if not self.config.auto_reconnect:
                    break
    
    def _attempt_reconnect(self):
        """Attempt to reconnect to camera."""
        logger.info("Attempting camera reconnect...")
        
        if self._capture:
            self._capture.release()
        
        time.sleep(self.config.reconnect_delay)
        
        self._capture = cv2.VideoCapture(self.config.camera_index)
        
        if self._capture.isOpened():
            self._capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.width)
            self._capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.height)
            self._capture.set(cv2.CAP_PROP_FPS, self.config.target_fps)
            logger.info("Camera reconnected successfully")
        else:
            logger.error("Camera reconnection failed")
    
    def __del__(self):
        """Cleanup on destruction."""
        if self._capture:
            self._capture.release()
