"""
Core type definitions for the Gesture Control Platform.
Provides shared data structures used across all pipeline stages.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
import numpy as np
from datetime import datetime


# =============================================================================
# ENUMS
# =============================================================================

class HandLabel(str, Enum):
    """Hand identification labels."""
    LEFT = "Left"
    RIGHT = "Right"


class GestureType(str, Enum):
    """Enumeration of recognized gesture types."""
    NONE = "none"
    FINGER_COUNT = "finger_count"
    PINCH = "pinch"
    SWIPE_LEFT = "swipe_left"
    SWIPE_RIGHT = "swipe_right"
    SWIPE_UP = "swipe_up"
    SWIPE_DOWN = "swipe_down"
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    FIST = "fist"
    OPEN_PALM = "open_palm"
    PEACE = "peace"
    OK_SIGN = "ok_sign"
    POINTING = "pointing"


class PipelineStage(str, Enum):
    """Pipeline processing stages."""
    INGESTION = "ingestion"
    PREPROCESSING = "preprocessing"
    EXTRACTION = "extraction"
    INFERENCE = "inference"
    OUTPUT = "output"


class ConnectionStatus(str, Enum):
    """WebSocket connection status."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    RECONNECTING = "reconnecting"
    ERROR = "error"


class ProjectStatus(str, Enum):
    """Project execution status."""
    IDLE = "idle"
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


# =============================================================================
# DATA CLASSES - PIPELINE CONTRACTS
# =============================================================================

@dataclass
class Landmark:
    """Single landmark point from hand tracking."""
    x: float  # Normalized [0, 1]
    y: float  # Normalized [0, 1]
    z: float  # Depth estimate
    pixel_x: int = 0
    pixel_y: int = 0
    visibility: float = 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "x": self.x,
            "y": self.y,
            "z": self.z,
            "pixel_x": self.pixel_x,
            "pixel_y": self.pixel_y,
            "visibility": self.visibility
        }


@dataclass
class HandLandmarks:
    """Complete hand landmark set (21 points per hand)."""
    hand_label: HandLabel
    landmarks: List[Landmark]
    confidence: float
    
    @property
    def wrist(self) -> Landmark:
        """Get wrist landmark (index 0)."""
        return self.landmarks[0] if self.landmarks else None
    
    @property
    def thumb_tip(self) -> Landmark:
        """Get thumb tip landmark (index 4)."""
        return self.landmarks[4] if len(self.landmarks) > 4 else None
    
    @property
    def index_tip(self) -> Landmark:
        """Get index fingertip landmark (index 8)."""
        return self.landmarks[8] if len(self.landmarks) > 8 else None
    
    @property
    def middle_tip(self) -> Landmark:
        """Get middle fingertip landmark (index 12)."""
        return self.landmarks[12] if len(self.landmarks) > 12 else None
    
    @property
    def ring_tip(self) -> Landmark:
        """Get ring fingertip landmark (index 16)."""
        return self.landmarks[16] if len(self.landmarks) > 16 else None
    
    @property
    def pinky_tip(self) -> Landmark:
        """Get pinky fingertip landmark (index 20)."""
        return self.landmarks[20] if len(self.landmarks) > 20 else None
    
    def get_palm_center(self) -> Landmark:
        """Calculate palm center from key landmarks."""
        if len(self.landmarks) < 21:
            return None
        
        palm_indices = [0, 5, 9, 13, 17]
        x = sum(self.landmarks[i].x for i in palm_indices) / len(palm_indices)
        y = sum(self.landmarks[i].y for i in palm_indices) / len(palm_indices)
        z = sum(self.landmarks[i].z for i in palm_indices) / len(palm_indices)
        
        return Landmark(
            x=x, y=y, z=z,
            pixel_x=int(x * 640),
            pixel_y=int(y * 480)
        )
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "label": self.hand_label.value if isinstance(self.hand_label, HandLabel) else self.hand_label,
            "confidence": self.confidence,
            "landmarks": [lm.to_dict() for lm in self.landmarks]
        }


@dataclass
class FingerStates:
    """State of each finger (up/down)."""
    thumb: bool = False
    index: bool = False
    middle: bool = False
    ring: bool = False
    pinky: bool = False
    
    @property
    def count(self) -> int:
        """Count raised fingers."""
        return sum([self.thumb, self.index, self.middle, self.ring, self.pinky])
    
    def to_dict(self) -> Dict[str, bool]:
        return {
            "thumb": self.thumb,
            "index": self.index,
            "middle": self.middle,
            "ring": self.ring,
            "pinky": self.pinky
        }


@dataclass
class CapturedFrame:
    """Output from ingestion pipeline."""
    frame: np.ndarray
    timestamp: float
    frame_number: int
    capture_latency_ms: float
    width: int
    height: int
    channels: int = 3
    
    @property
    def shape(self) -> Tuple[int, int, int]:
        return (self.height, self.width, self.channels)


@dataclass
class PreprocessedFrame:
    """Output from preprocessing pipeline."""
    frame: np.ndarray
    original_size: Tuple[int, int]
    processed_size: Tuple[int, int]
    preprocessing_latency_ms: float
    scale_factor: Tuple[float, float] = (1.0, 1.0)
    is_normalized: bool = False


@dataclass
class ExtractionResult:
    """Output from extraction pipeline."""
    hands: List[HandLandmarks]
    extraction_latency_ms: float
    model_confidence: float
    frame_timestamp: float
    
    @property
    def hands_detected(self) -> int:
        return len(self.hands)
    
    def get_hand(self, label: HandLabel) -> Optional[HandLandmarks]:
        """Get hand by label (Left/Right)."""
        for hand in self.hands:
            hand_label = hand.hand_label
            if isinstance(hand_label, str):
                hand_label = HandLabel(hand_label)
            if hand_label == label:
                return hand
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "hands_detected": self.hands_detected,
            "hands": [h.to_dict() for h in self.hands],
            "extraction_latency_ms": self.extraction_latency_ms,
            "model_confidence": self.model_confidence
        }


@dataclass
class InferenceResult:
    """Output from inference pipeline."""
    gesture_type: GestureType
    confidence: float
    raw_output: Dict[str, Any]
    inference_latency_ms: float
    
    # Gesture-specific data (optional)
    finger_count: Optional[int] = None
    finger_states: Optional[FingerStates] = None
    pinch_distance: Optional[float] = None
    gesture_velocity: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        result = {
            "gesture_type": self.gesture_type.value,
            "confidence": self.confidence,
            "inference_latency_ms": self.inference_latency_ms,
            **self.raw_output
        }
        
        if self.finger_count is not None:
            result["finger_count"] = self.finger_count
        if self.finger_states is not None:
            result["finger_states"] = self.finger_states.to_dict()
        if self.pinch_distance is not None:
            result["pinch_distance"] = self.pinch_distance
        if self.gesture_velocity is not None:
            result["gesture_velocity"] = self.gesture_velocity
        
        return result


@dataclass
class OutputEvent:
    """Output event dispatched by output pipeline."""
    event_type: str
    project: str
    timestamp: float
    data: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.event_type,
            "project": self.project,
            "timestamp": self.timestamp,
            "data": self.data
        }


# =============================================================================
# METRICS
# =============================================================================

@dataclass
class PipelineMetrics:
    """Aggregated pipeline performance metrics."""
    total_latency_ms: float = 0.0
    ingestion_latency_ms: float = 0.0
    preprocessing_latency_ms: float = 0.0
    extraction_latency_ms: float = 0.0
    inference_latency_ms: float = 0.0
    output_latency_ms: float = 0.0
    frames_processed: int = 0
    frames_dropped: int = 0
    errors_count: int = 0
    fps: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_latency_ms": round(self.total_latency_ms, 2),
            "ingestion_latency_ms": round(self.ingestion_latency_ms, 2),
            "preprocessing_latency_ms": round(self.preprocessing_latency_ms, 2),
            "extraction_latency_ms": round(self.extraction_latency_ms, 2),
            "inference_latency_ms": round(self.inference_latency_ms, 2),
            "output_latency_ms": round(self.output_latency_ms, 2),
            "frames_processed": self.frames_processed,
            "frames_dropped": self.frames_dropped,
            "errors_count": self.errors_count,
            "fps": round(self.fps, 1)
        }


@dataclass
class SystemMetrics:
    """System resource metrics."""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    memory_mb: float = 0.0
    gpu_percent: Optional[float] = None
    gpu_memory_mb: Optional[float] = None
