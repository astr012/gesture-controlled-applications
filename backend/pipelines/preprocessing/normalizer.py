"""
Preprocessing Pipeline
Handles frame normalization, color conversion, and resizing.
"""

import time
from typing import Optional, Tuple
from dataclasses import dataclass
import cv2
import numpy as np

from core.types import CapturedFrame, PreprocessedFrame
from core.exceptions import PreprocessingError
from core.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class PreprocessingConfig:
    """Preprocessing configuration."""
    target_width: int = 640
    target_height: int = 480
    normalize: bool = True
    color_convert: bool = True
    flip_horizontal: bool = True
    maintain_aspect_ratio: bool = True


class PreprocessingPipeline:
    """
    Preprocessing pipeline stage.
    
    Performs frame preprocessing operations:
    - Color space conversion (BGR to RGB for MediaPipe)
    - Horizontal flipping (mirror effect)
    - Resizing with optional aspect ratio preservation
    - Normalization for model input
    
    Usage:
        preprocessing = PreprocessingPipeline()
        preprocessed = preprocessing.process(captured_frame)
    """
    
    def __init__(
        self,
        target_width: int = 640,
        target_height: int = 480,
        normalize: bool = True,
        color_convert: bool = True,
        flip_horizontal: bool = True,
        maintain_aspect_ratio: bool = True
    ):
        self.config = PreprocessingConfig(
            target_width=target_width,
            target_height=target_height,
            normalize=normalize,
            color_convert=color_convert,
            flip_horizontal=flip_horizontal,
            maintain_aspect_ratio=maintain_aspect_ratio
        )
        
        self._processing_times: list = []
    
    @property
    def average_latency(self) -> float:
        """Get average preprocessing latency in ms."""
        if not self._processing_times:
            return 0.0
        return sum(self._processing_times[-100:]) / len(self._processing_times[-100:])
    
    def process(self, captured: CapturedFrame) -> PreprocessedFrame:
        """
        Process a captured frame.
        
        Args:
            captured: CapturedFrame from ingestion pipeline
            
        Returns:
            PreprocessedFrame ready for extraction
            
        Raises:
            PreprocessingError: If processing fails
        """
        start_time = time.perf_counter()
        
        try:
            frame = captured.frame.copy()
            original_size = (captured.width, captured.height)
            
            # Step 1: Horizontal flip (mirror effect for natural interaction)
            if self.config.flip_horizontal:
                frame = cv2.flip(frame, 1)
            
            # Step 2: Color conversion (BGR to RGB for MediaPipe)
            if self.config.color_convert:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Step 3: Resize if needed
            scale_factor = (1.0, 1.0)
            if (captured.width != self.config.target_width or 
                captured.height != self.config.target_height):
                
                if self.config.maintain_aspect_ratio:
                    frame, scale_factor = self._resize_with_aspect(frame)
                else:
                    frame = cv2.resize(
                        frame,
                        (self.config.target_width, self.config.target_height),
                        interpolation=cv2.INTER_LINEAR
                    )
                    scale_factor = (
                        self.config.target_width / captured.width,
                        self.config.target_height / captured.height
                    )
            
            # Step 4: Normalize if requested
            is_normalized = False
            if self.config.normalize:
                frame = frame.astype(np.float32) / 255.0
                is_normalized = True
            
            processing_latency = (time.perf_counter() - start_time) * 1000
            self._processing_times.append(processing_latency)
            
            return PreprocessedFrame(
                frame=frame,
                original_size=original_size,
                processed_size=(frame.shape[1], frame.shape[0]),
                preprocessing_latency_ms=processing_latency,
                scale_factor=scale_factor,
                is_normalized=is_normalized
            )
            
        except Exception as e:
            raise PreprocessingError(
                f"Frame preprocessing failed: {e}",
                cause=e
            )
    
    def _resize_with_aspect(
        self,
        frame: np.ndarray
    ) -> Tuple[np.ndarray, Tuple[float, float]]:
        """
        Resize frame while maintaining aspect ratio.
        Uses letterboxing/pillarboxing as needed.
        """
        h, w = frame.shape[:2]
        
        # Calculate scale to fit target dimensions
        scale = min(
            self.config.target_width / w,
            self.config.target_height / h
        )
        
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # Resize
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        
        # Create canvas with target dimensions
        canvas = np.zeros(
            (self.config.target_height, self.config.target_width, frame.shape[2]),
            dtype=frame.dtype
        )
        
        # Calculate offset for centering
        x_offset = (self.config.target_width - new_w) // 2
        y_offset = (self.config.target_height - new_h) // 2
        
        # Place resized frame on canvas
        canvas[y_offset:y_offset + new_h, x_offset:x_offset + new_w] = resized
        
        return canvas, (scale, scale)
    
    def process_batch(
        self,
        frames: list
    ) -> list:
        """
        Process multiple frames in batch.
        
        Args:
            frames: List of CapturedFrame objects
            
        Returns:
            List of PreprocessedFrame objects
        """
        return [self.process(frame) for frame in frames]
