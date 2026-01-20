"""
Dependency injection container for the Gesture Control Platform.
Provides factory functions for creating pipeline components.
"""

from typing import Optional
from functools import lru_cache

from core.config import get_settings, Settings
from core.logging_config import get_logger

logger = get_logger(__name__)


# =============================================================================
# PIPELINE COMPONENT FACTORIES
# =============================================================================

@lru_cache()
def get_ingestion_pipeline(
    camera_index: Optional[int] = None,
    target_fps: Optional[int] = None
):
    """
    Get or create the ingestion pipeline.
    
    Args:
        camera_index: Camera device index (defaults to settings)
        target_fps: Target frame rate (defaults to settings)
    """
    from pipelines.ingestion.camera import CameraIngestion
    
    settings = get_settings()
    
    return CameraIngestion(
        camera_index=camera_index or settings.camera_index,
        target_fps=target_fps or settings.target_fps,
        width=settings.camera_width,
        height=settings.camera_height
    )


@lru_cache()
def get_preprocessing_pipeline(
    target_width: Optional[int] = None,
    target_height: Optional[int] = None
):
    """
    Get or create the preprocessing pipeline.
    """
    from pipelines.preprocessing.normalizer import PreprocessingPipeline
    
    settings = get_settings()
    
    return PreprocessingPipeline(
        target_width=target_width or settings.camera_width,
        target_height=target_height or settings.camera_height,
        normalize=True,
        color_convert=True
    )


@lru_cache()
def get_extraction_pipeline(
    max_hands: Optional[int] = None,
    min_detection_confidence: Optional[float] = None,
    min_tracking_confidence: Optional[float] = None
):
    """
    Get or create the extraction pipeline.
    """
    from pipelines.extraction.hand_tracker import HandExtractionPipeline
    
    settings = get_settings()
    
    return HandExtractionPipeline(
        max_hands=max_hands or settings.max_hands,
        min_detection_confidence=min_detection_confidence or settings.min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence or settings.min_tracking_confidence
    )


@lru_cache()
def get_inference_engine():
    """
    Get or create the inference engine with registered classifiers.
    """
    from pipelines.inference.engine import InferenceEngine
    from pipelines.inference.classifiers.finger_count import FingerCountClassifier
    
    engine = InferenceEngine()
    
    # Register default classifiers
    engine.register_classifier(FingerCountClassifier())
    
    # Set default active classifier
    engine.set_active_classifier("finger_count")
    
    logger.info(f"Inference engine initialized with classifiers: {list(engine._classifiers.keys())}")
    
    return engine


@lru_cache()
def get_output_pipeline():
    """
    Get or create the output pipeline.
    """
    from pipelines.output.dispatcher import OutputPipeline
    
    return OutputPipeline()


def get_pipeline_orchestrator(
    ingestion=None,
    preprocessing=None,
    extraction=None,
    inference=None,
    output=None
):
    """
    Create a fully configured pipeline orchestrator.
    
    Args:
        ingestion: Optional custom ingestion pipeline
        preprocessing: Optional custom preprocessing pipeline
        extraction: Optional custom extraction pipeline
        inference: Optional custom inference engine
        output: Optional custom output pipeline
        
    Returns:
        Configured PipelineOrchestrator instance
    """
    from pipelines.orchestrator import PipelineOrchestrator
    
    orchestrator = PipelineOrchestrator(
        ingestion=ingestion or get_ingestion_pipeline(),
        preprocessing=preprocessing or get_preprocessing_pipeline(),
        extraction=extraction or get_extraction_pipeline(),
        inference=inference or get_inference_engine(),
        output=output or get_output_pipeline()
    )
    
    logger.info("Pipeline orchestrator created and configured")
    
    return orchestrator


def clear_pipeline_cache():
    """
    Clear all cached pipeline instances.
    Useful for testing or when settings change.
    """
    get_ingestion_pipeline.cache_clear()
    get_preprocessing_pipeline.cache_clear()
    get_extraction_pipeline.cache_clear()
    get_inference_engine.cache_clear()
    get_output_pipeline.cache_clear()
    
    logger.info("Pipeline cache cleared")


# =============================================================================
# WEBSOCKET HUB
# =============================================================================

_websocket_hub = None


def get_websocket_hub():
    """
    Get the singleton WebSocket hub instance.
    """
    global _websocket_hub
    
    if _websocket_hub is None:
        from api.websocket.hub import WebSocketHub
        _websocket_hub = WebSocketHub()
        logger.info("WebSocket hub initialized")
    
    return _websocket_hub


# =============================================================================
# PROJECT REGISTRY
# =============================================================================

_project_registry = None


def get_project_registry():
    """
    Get the singleton project registry instance.
    """
    global _project_registry
    
    if _project_registry is None:
        from projects.registry import ProjectRegistry
        _project_registry = ProjectRegistry()
        logger.info(f"Project registry initialized with {_project_registry.project_count} projects")
    
    return _project_registry
