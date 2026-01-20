"""
Health Check Endpoints
Provides system health and readiness checks.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime
import time

from core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/health")

# Track startup time
_startup_time = time.time()


class ComponentHealth(BaseModel):
    """Health status of a single component."""
    status: str
    latency_ms: Optional[float] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    """Complete health check response."""
    status: str
    version: str
    timestamp: datetime
    uptime_seconds: float
    components: Dict[str, ComponentHealth]


class ReadinessResponse(BaseModel):
    """Readiness check response."""
    ready: bool
    checks: Dict[str, bool]


@router.get("", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check for all system components.
    
    Returns:
        HealthResponse with overall status and component breakdown
    """
    components = {}
    overall_status = "healthy"
    
    # Check camera/ingestion
    try:
        from core.dependencies import get_ingestion_pipeline
        ingestion = get_ingestion_pipeline()
        components["ingestion"] = ComponentHealth(
            status="healthy" if ingestion.is_capturing else "idle",
            message=f"State: {ingestion.state.value}"
        )
    except Exception as e:
        components["ingestion"] = ComponentHealth(
            status="unhealthy",
            message=str(e)
        )
        overall_status = "degraded"
    
    # Check extraction (MediaPipe)
    try:
        from core.dependencies import get_extraction_pipeline
        extraction = get_extraction_pipeline()
        components["extraction"] = ComponentHealth(
            status="healthy" if extraction.is_initialized else "unhealthy",
            latency_ms=extraction.average_latency,
            message="MediaPipe Hands initialized" if extraction.is_initialized else "Not initialized"
        )
    except Exception as e:
        components["extraction"] = ComponentHealth(
            status="unhealthy",
            message=str(e)
        )
        overall_status = "degraded"
    
    # Check inference engine
    try:
        from core.dependencies import get_inference_engine
        engine = get_inference_engine()
        components["inference"] = ComponentHealth(
            status="healthy",
            latency_ms=engine.average_latency,
            message=f"Active: {engine.active_classifier_name}, Available: {engine.available_classifiers}"
        )
    except Exception as e:
        components["inference"] = ComponentHealth(
            status="unhealthy",
            message=str(e)
        )
        overall_status = "degraded"
    
    # Check WebSocket hub
    try:
        from core.dependencies import get_websocket_hub
        hub = get_websocket_hub()
        components["websocket"] = ComponentHealth(
            status="healthy",
            message=f"Active connections: {hub.connection_count}"
        )
    except Exception as e:
        components["websocket"] = ComponentHealth(
            status="unhealthy",
            message=str(e)
        )
        overall_status = "degraded"
    
    return HealthResponse(
        status=overall_status,
        version="2.0.0",
        timestamp=datetime.now(),
        uptime_seconds=round(time.time() - _startup_time, 1),
        components=components
    )


@router.get("/live")
async def liveness():
    """
    Kubernetes liveness probe.
    Returns 200 if the service is alive.
    """
    return {"status": "alive", "timestamp": datetime.now().isoformat()}


@router.get("/ready", response_model=ReadinessResponse)
async def readiness():
    """
    Kubernetes readiness probe.
    Checks if the service is ready to accept traffic.
    """
    checks = {}
    
    # Check if MediaPipe is loaded
    try:
        from core.dependencies import get_extraction_pipeline
        extraction = get_extraction_pipeline()
        checks["mediapipe_loaded"] = extraction.is_initialized
    except:
        checks["mediapipe_loaded"] = False
    
    # Check if at least one classifier is available
    try:
        from core.dependencies import get_inference_engine
        engine = get_inference_engine()
        checks["classifiers_available"] = len(engine.available_classifiers) > 0
    except:
        checks["classifiers_available"] = False
    
    # Overall readiness
    ready = all(checks.values())
    
    return ReadinessResponse(
        ready=ready,
        checks=checks
    )
