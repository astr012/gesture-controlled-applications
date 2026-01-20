"""
Pipeline Orchestrator
Coordinates all pipeline stages and manages the processing loop.
"""

import asyncio
import time
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

from core.types import PipelineMetrics, CapturedFrame
from core.exceptions import PipelineError, ErrorSeverity
from core.logging_config import get_logger

from pipelines.ingestion.camera import CameraIngestion
from pipelines.preprocessing.normalizer import PreprocessingPipeline
from pipelines.extraction.hand_tracker import HandExtractionPipeline
from pipelines.inference.engine import InferenceEngine
from pipelines.output.dispatcher import OutputPipeline

logger = get_logger(__name__)


class OrchestratorState(str, Enum):
    """Orchestrator states."""
    IDLE = "idle"
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class OrchestratorConfig:
    """Orchestrator configuration."""
    target_fps: int = 30
    max_consecutive_errors: int = 10
    error_cooldown_seconds: float = 1.0
    enable_profiling: bool = False


class PipelineOrchestrator:
    """
    Pipeline orchestrator that coordinates all pipeline stages.
    
    Manages the flow:
    INGESTION → PREPROCESSING → EXTRACTION → INFERENCE → OUTPUT
    
    Features:
    - Async processing loop
    - Error handling with recovery
    - Performance metrics collection
    - Project switching
    - Pause/resume support
    
    Usage:
        orchestrator = PipelineOrchestrator(
            ingestion=CameraIngestion(),
            preprocessing=PreprocessingPipeline(),
            extraction=HandExtractionPipeline(),
            inference=InferenceEngine(),
            output=OutputPipeline()
        )
        
        await orchestrator.start("finger_count")
        
        # Later...
        await orchestrator.stop()
    """
    
    def __init__(
        self,
        ingestion: CameraIngestion,
        preprocessing: PreprocessingPipeline,
        extraction: HandExtractionPipeline,
        inference: InferenceEngine,
        output: OutputPipeline,
        config: Optional[OrchestratorConfig] = None
    ):
        # Pipeline stages
        self.ingestion = ingestion
        self.preprocessing = preprocessing
        self.extraction = extraction
        self.inference = inference
        self.output = output
        
        # Configuration
        self.config = config or OrchestratorConfig()
        
        # State
        self._state = OrchestratorState.IDLE
        self._current_project: Optional[str] = None
        self._running = False
        self._paused = False
        self._processing_task: Optional[asyncio.Task] = None
        
        # Metrics
        self._metrics = PipelineMetrics()
        self._consecutive_errors = 0
        self._last_error_time = 0.0
        self._loop_start_time = 0.0
        
        # FPS tracking
        self._frame_times: list = []
    
    @property
    def state(self) -> OrchestratorState:
        """Get current orchestrator state."""
        return self._state
    
    @property
    def is_running(self) -> bool:
        """Check if orchestrator is running."""
        return self._running and not self._paused
    
    @property
    def current_project(self) -> Optional[str]:
        """Get current active project."""
        return self._current_project
    
    @property
    def metrics(self) -> PipelineMetrics:
        """Get current pipeline metrics."""
        return self._metrics
    
    async def start(self, project: str) -> bool:
        """
        Start the pipeline for a specific project.
        
        Args:
            project: Project identifier to run
            
        Returns:
            True if started successfully
        """
        if self._state == OrchestratorState.RUNNING:
            logger.warning("Orchestrator already running")
            return True
        
        self._state = OrchestratorState.INITIALIZING
        self._current_project = project
        
        logger.info(f"Starting pipeline orchestrator for project: {project}")
        
        try:
            # Start ingestion
            if not await self.ingestion.start():
                raise PipelineError(
                    "Failed to start ingestion pipeline",
                    stage="ingestion",
                    severity=ErrorSeverity.HIGH
                )
            
            # Set active classifier
            if not self.inference.set_active_classifier(project):
                logger.warning(f"Classifier not found for project: {project}")
            
            # Start processing loop
            self._running = True
            self._paused = False
            self._loop_start_time = time.time()
            self._metrics = PipelineMetrics()
            
            self._processing_task = asyncio.create_task(
                self._processing_loop(),
                name="PipelineProcessing"
            )
            
            self._state = OrchestratorState.RUNNING
            logger.info("Pipeline orchestrator started")
            return True
            
        except Exception as e:
            self._state = OrchestratorState.ERROR
            logger.error(f"Failed to start orchestrator: {e}")
            raise
    
    async def stop(self):
        """Stop the pipeline."""
        if self._state == OrchestratorState.STOPPED:
            return
        
        self._state = OrchestratorState.STOPPING
        logger.info("Stopping pipeline orchestrator")
        
        self._running = False
        
        # Wait for processing task to finish
        if self._processing_task:
            self._processing_task.cancel()
            try:
                await self._processing_task
            except asyncio.CancelledError:
                pass
        
        # Stop ingestion
        await self.ingestion.stop()
        
        # Cleanup output
        self.output.cleanup()
        
        self._state = OrchestratorState.STOPPED
        self._current_project = None
        
        logger.info(
            f"Pipeline stopped. Frames processed: {self._metrics.frames_processed}, "
            f"Dropped: {self._metrics.frames_dropped}, "
            f"Errors: {self._metrics.errors_count}"
        )
    
    async def pause(self):
        """Pause processing (keeps camera running)."""
        if self._state == OrchestratorState.RUNNING:
            self._paused = True
            self._state = OrchestratorState.PAUSED
            logger.info("Pipeline paused")
    
    async def resume(self):
        """Resume processing."""
        if self._state == OrchestratorState.PAUSED:
            self._paused = False
            self._state = OrchestratorState.RUNNING
            logger.info("Pipeline resumed")
    
    async def switch_project(self, project: str) -> bool:
        """
        Switch to a different project.
        
        Args:
            project: New project identifier
            
        Returns:
            True if switch was successful
        """
        if not self._running:
            logger.warning("Cannot switch project - orchestrator not running")
            return False
        
        # Update classifier
        if self.inference.set_active_classifier(project):
            old_project = self._current_project
            self._current_project = project
            logger.info(f"Switched project: {old_project} -> {project}")
            return True
        
        logger.warning(f"Failed to switch to project: {project}")
        return False
    
    async def _processing_loop(self):
        """Main processing loop."""
        logger.info("Processing loop started")
        
        frame_interval = 1.0 / self.config.target_fps
        
        while self._running:
            try:
                # Skip if paused
                if self._paused:
                    await asyncio.sleep(0.1)
                    continue
                
                loop_start = time.perf_counter()
                
                # Get frame from ingestion
                captured = await self.ingestion.get_frame()
                
                if captured is None:
                    await asyncio.sleep(0.001)
                    continue
                
                # Process through pipeline
                await self._process_frame(captured)
                
                # Rate limiting
                elapsed = time.perf_counter() - loop_start
                sleep_time = max(0, frame_interval - elapsed)
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)
                
                # Track FPS
                self._update_fps()
                
                # Reset error counter on successful frame
                self._consecutive_errors = 0
                
            except asyncio.CancelledError:
                break
                
            except Exception as e:
                await self._handle_error(e)
        
        logger.info("Processing loop ended")
    
    async def _process_frame(self, captured: CapturedFrame):
        """Process a single frame through all pipeline stages."""
        total_start = time.perf_counter()
        
        try:
            # Stage 1: Preprocessing
            preprocessed = self.preprocessing.process(captured)
            self._metrics.preprocessing_latency_ms = preprocessed.preprocessing_latency_ms
            
            # Stage 2: Extraction
            extraction = self.extraction.extract(
                preprocessed,
                frame_width=captured.width,
                frame_height=captured.height
            )
            self._metrics.extraction_latency_ms = extraction.extraction_latency_ms
            
            # Stage 3: Inference
            inference = self.inference.infer(extraction)
            
            if inference:
                self._metrics.inference_latency_ms = inference.inference_latency_ms
                
                # Stage 4: Output
                await self.output.process(inference, self._current_project)
            
            # Update metrics
            self._metrics.ingestion_latency_ms = captured.capture_latency_ms
            self._metrics.total_latency_ms = (time.perf_counter() - total_start) * 1000
            self._metrics.frames_processed += 1
            
        except Exception as e:
            logger.error(f"Frame processing error: {e}")
            self._metrics.errors_count += 1
            raise
    
    async def _handle_error(self, error: Exception):
        """Handle processing errors with recovery logic."""
        self._consecutive_errors += 1
        self._metrics.errors_count += 1
        
        logger.error(f"Processing error ({self._consecutive_errors}): {error}")
        
        # Check if we should stop due to too many errors
        if self._consecutive_errors >= self.config.max_consecutive_errors:
            logger.critical("Too many consecutive errors, stopping pipeline")
            self._running = False
            self._state = OrchestratorState.ERROR
            return
        
        # Cooldown before next attempt
        await asyncio.sleep(self.config.error_cooldown_seconds)
    
    def _update_fps(self):
        """Update FPS calculation."""
        now = time.time()
        self._frame_times.append(now)
        
        # Keep only last second of frame times
        cutoff = now - 1.0
        self._frame_times = [t for t in self._frame_times if t > cutoff]
        
        # Calculate FPS
        if len(self._frame_times) >= 2:
            self._metrics.fps = len(self._frame_times)
    
    def get_detailed_metrics(self) -> Dict[str, Any]:
        """Get detailed pipeline metrics."""
        uptime = time.time() - self._loop_start_time if self._loop_start_time else 0
        
        return {
            "state": self._state.value,
            "project": self._current_project,
            "uptime_seconds": round(uptime, 1),
            "metrics": self._metrics.to_dict(),
            "ingestion": {
                "frame_count": self.ingestion.frame_count,
                "dropped_frames": self.ingestion.dropped_frames,
                "avg_latency_ms": round(self.ingestion.average_capture_latency, 2)
            },
            "preprocessing": {
                "avg_latency_ms": round(self.preprocessing.average_latency, 2)
            },
            "extraction": {
                "avg_latency_ms": round(self.extraction.average_latency, 2)
            },
            "inference": {
                "active_classifier": self.inference.active_classifier_name,
                "avg_latency_ms": round(self.inference.average_latency, 2)
            },
            "output": {
                "event_count": self.output.event_count,
                "avg_latency_ms": round(self.output.average_latency, 2)
            }
        }
