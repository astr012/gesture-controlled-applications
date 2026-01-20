"""Core package for the Gesture Control Platform."""

from .config import settings, get_settings
from .types import (
    GestureType, HandLabel, PipelineStage,
    CapturedFrame, PreprocessedFrame, ExtractionResult,
    InferenceResult, OutputEvent, PipelineMetrics
)
from .exceptions import GCPError, PipelineError
from .logging_config import get_logger, configure_logging

__all__ = [
    # Config
    "settings",
    "get_settings",
    
    # Types
    "GestureType",
    "HandLabel",
    "PipelineStage",
    "CapturedFrame",
    "PreprocessedFrame",
    "ExtractionResult",
    "InferenceResult",
    "OutputEvent",
    "PipelineMetrics",
    
    # Exceptions
    "GCPError",
    "PipelineError",
    
    # Logging
    "get_logger",
    "configure_logging"
]