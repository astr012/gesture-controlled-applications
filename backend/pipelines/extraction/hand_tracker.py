"""
Hand Extraction Pipeline
Uses MediaPipe for hand landmark detection and tracking.
"""

import time
from typing import Optional, List
from dataclasses import dataclass
import mediapipe as mp
import numpy as np

from core.types import (
    PreprocessedFrame, ExtractionResult, 
    HandLandmarks, Landmark, HandLabel
)
from core.exceptions import ExtractionError, ModelLoadError
from core.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class ExtractionConfig:
    """Hand extraction configuration."""
    max_hands: int = 2
    min_detection_confidence: float = 0.7
    min_tracking_confidence: float = 0.5
    model_complexity: int = 1
    static_image_mode: bool = False


class HandExtractionPipeline:
    """
    Hand extraction pipeline stage.
    
    Uses MediaPipe Hands to detect and track hand landmarks.
    Outputs 21 landmarks per detected hand with confidence scores.
    
    Usage:
        extraction = HandExtractionPipeline()
        result = extraction.extract(preprocessed_frame)
    """
    
    # MediaPipe landmark indices
    WRIST = 0
    THUMB_CMC = 1
    THUMB_MCP = 2
    THUMB_IP = 3
    THUMB_TIP = 4
    INDEX_MCP = 5
    INDEX_PIP = 6
    INDEX_DIP = 7
    INDEX_TIP = 8
    MIDDLE_MCP = 9
    MIDDLE_PIP = 10
    MIDDLE_DIP = 11
    MIDDLE_TIP = 12
    RING_MCP = 13
    RING_PIP = 14
    RING_DIP = 15
    RING_TIP = 16
    PINKY_MCP = 17
    PINKY_PIP = 18
    PINKY_DIP = 19
    PINKY_TIP = 20
    
    def __init__(
        self,
        max_hands: int = 2,
        min_detection_confidence: float = 0.7,
        min_tracking_confidence: float = 0.5,
        model_complexity: int = 1,
        static_image_mode: bool = False
    ):
        self.config = ExtractionConfig(
            max_hands=max_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            model_complexity=model_complexity,
            static_image_mode=static_image_mode
        )
        
        self._hands = None
        self._initialized = False
        self._extraction_times: list = []
        
        # Initialize MediaPipe
        self._initialize()
    
    @property
    def average_latency(self) -> float:
        """Get average extraction latency in ms."""
        if not self._extraction_times:
            return 0.0
        return sum(self._extraction_times[-100:]) / len(self._extraction_times[-100:])
    
    @property
    def is_initialized(self) -> bool:
        """Check if MediaPipe is initialized."""
        return self._initialized
    
    def _initialize(self):
        """Initialize MediaPipe Hands."""
        try:
            mp_hands = mp.solutions.hands
            
            self._hands = mp_hands.Hands(
                static_image_mode=self.config.static_image_mode,
                max_num_hands=self.config.max_hands,
                model_complexity=self.config.model_complexity,
                min_detection_confidence=self.config.min_detection_confidence,
                min_tracking_confidence=self.config.min_tracking_confidence
            )
            
            self._initialized = True
            logger.info(
                f"MediaPipe Hands initialized: max_hands={self.config.max_hands}, "
                f"detection={self.config.min_detection_confidence}, "
                f"tracking={self.config.min_tracking_confidence}"
            )
            
        except Exception as e:
            raise ModelLoadError(
                f"Failed to initialize MediaPipe Hands: {e}",
                model_name="MediaPipe Hands",
                cause=e
            )
    
    def extract(
        self,
        preprocessed: PreprocessedFrame,
        frame_width: int = 640,
        frame_height: int = 480
    ) -> ExtractionResult:
        """
        Extract hand landmarks from preprocessed frame.
        
        Args:
            preprocessed: PreprocessedFrame from preprocessing pipeline
            frame_width: Frame width for pixel coordinate conversion
            frame_height: Frame height for pixel coordinate conversion
            
        Returns:
            ExtractionResult with detected hands and landmarks
            
        Raises:
            ExtractionError: If extraction fails
        """
        if not self._initialized:
            raise ExtractionError("MediaPipe Hands not initialized")
        
        start_time = time.perf_counter()
        
        try:
            # Get frame (convert back to uint8 if normalized)
            frame = preprocessed.frame
            if preprocessed.is_normalized:
                frame = (frame * 255).astype(np.uint8)
            
            # Process frame
            results = self._hands.process(frame)
            
            extraction_latency = (time.perf_counter() - start_time) * 1000
            self._extraction_times.append(extraction_latency)
            
            # Parse results
            hands = self._parse_results(
                results,
                frame_width,
                frame_height
            )
            
            return ExtractionResult(
                hands=hands,
                extraction_latency_ms=extraction_latency,
                model_confidence=self.config.min_detection_confidence,
                frame_timestamp=time.time()
            )
            
        except Exception as e:
            raise ExtractionError(
                f"Hand extraction failed: {e}",
                cause=e
            )
    
    def _parse_results(
        self,
        results,
        frame_width: int,
        frame_height: int
    ) -> List[HandLandmarks]:
        """Parse MediaPipe results into HandLandmarks objects."""
        hands = []
        
        if not results.multi_hand_landmarks:
            return hands
        
        for hand_index, (hand_landmarks, handedness) in enumerate(
            zip(results.multi_hand_landmarks, results.multi_handedness)
        ):
            # Get hand label (Left/Right)
            hand_label = handedness.classification[0].label
            confidence = handedness.classification[0].score
            
            # Convert to HandLabel enum
            try:
                label = HandLabel(hand_label)
            except ValueError:
                label = HandLabel.RIGHT  # Default
            
            # Extract landmarks
            landmarks = []
            for lm in hand_landmarks.landmark:
                landmark = Landmark(
                    x=lm.x,
                    y=lm.y,
                    z=lm.z,
                    pixel_x=int(lm.x * frame_width),
                    pixel_y=int(lm.y * frame_height),
                    visibility=getattr(lm, 'visibility', 1.0)
                )
                landmarks.append(landmark)
            
            hands.append(HandLandmarks(
                hand_label=label,
                landmarks=landmarks,
                confidence=confidence
            ))
        
        return hands
    
    def draw_landmarks(
        self,
        frame: np.ndarray,
        hands: List[HandLandmarks],
        draw_connections: bool = True
    ) -> np.ndarray:
        """
        Draw landmarks on frame for visualization.
        
        Args:
            frame: Frame to draw on (will be modified in place)
            hands: List of HandLandmarks to draw
            draw_connections: Whether to draw connections between landmarks
            
        Returns:
            Frame with landmarks drawn
        """
        mp_drawing = mp.solutions.drawing_utils
        mp_hands = mp.solutions.hands
        
        # Define drawing specs
        landmark_spec = mp_drawing.DrawingSpec(
            color=(0, 255, 0),
            thickness=2,
            circle_radius=3
        )
        connection_spec = mp_drawing.DrawingSpec(
            color=(255, 255, 255),
            thickness=2
        )
        
        for hand in hands:
            # Convert back to MediaPipe format for drawing
            points = []
            for lm in hand.landmarks:
                points.append((lm.pixel_x, lm.pixel_y))
            
            # Draw landmarks
            for i, (x, y) in enumerate(points):
                color = (0, 255, 255) if i in [4, 8, 12, 16, 20] else (0, 255, 0)
                cv2.circle(frame, (x, y), 5, color, -1)
            
            # Draw connections
            if draw_connections:
                connections = [
                    (0, 1), (1, 2), (2, 3), (3, 4),      # Thumb
                    (0, 5), (5, 6), (6, 7), (7, 8),      # Index
                    (0, 9), (9, 10), (10, 11), (11, 12), # Middle
                    (0, 13), (13, 14), (14, 15), (15, 16), # Ring
                    (0, 17), (17, 18), (18, 19), (19, 20), # Pinky
                    (5, 9), (9, 13), (13, 17),           # Palm
                ]
                
                for start_idx, end_idx in connections:
                    start = points[start_idx]
                    end = points[end_idx]
                    cv2.line(frame, start, end, (255, 255, 255), 2)
        
        return frame
    
    def close(self):
        """Release MediaPipe resources."""
        if self._hands:
            self._hands.close()
            self._initialized = False
            logger.info("MediaPipe Hands released")
    
    def __del__(self):
        """Cleanup on destruction."""
        self.close()


# Need to import cv2 for drawing
import cv2
