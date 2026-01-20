"""
Gesture Control Platform - FastAPI Backend
Main application entry point with pipeline architecture.

This is the entry point for the enterprise-grade gesture control platform.
It initializes the API gateway and all pipeline components.
"""

import uvicorn
import asyncio
import signal
import sys
from typing import Optional

from core.config import get_settings
from core.logging_config import configure_logging, get_logger

# Configure logging first
settings = get_settings()
configure_logging(
    level=settings.log_level,
    structured=not settings.debug
)

logger = get_logger(__name__)


def create_app():
    """
    Create and configure the FastAPI application.
    
    Returns:
        Configured FastAPI app instance
    """
    from api.gateway import create_api_gateway
    
    app = create_api_gateway()
    
    return app


# Create the app instance
app = create_app()


# Graceful shutdown handling
_shutdown_event: Optional[asyncio.Event] = None


async def shutdown_handler():
    """Handle graceful shutdown."""
    logger.info("Initiating graceful shutdown...")
    
    try:
        # Stop any running orchestrator
        from core.dependencies import get_pipeline_orchestrator, clear_pipeline_cache
        
        try:
            orchestrator = get_pipeline_orchestrator()
            if orchestrator.is_running:
                await orchestrator.stop()
        except:
            pass
        
        # Clear caches
        clear_pipeline_cache()
        
        logger.info("Shutdown complete")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


def signal_handler(sig, frame):
    """Handle system signals."""
    logger.info(f"Received signal {sig}")
    
    if _shutdown_event:
        _shutdown_event.set()
    else:
        sys.exit(0)


# Legacy endpoints for backward compatibility

@app.get("/health")
async def legacy_health_check():
    """Legacy health check endpoint (redirects to new API)."""
    from api.rest.health import health_check
    return await health_check()


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Gesture Control Platform API",
        "version": "2.0.0",
        "api_docs": "/api/docs" if settings.debug else None,
        "websocket_endpoint": "/ws/gestures",
        "api_prefix": "/api/v1",
        "status": "operational"
    }


if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    logger.info(f"Starting Gesture Control Platform v2.0.0")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Host: {settings.host}:{settings.port}")
    
    try:
        uvicorn.run(
            "main:app",
            host=settings.host,
            port=settings.port,
            reload=settings.debug,
            log_level=settings.log_level.lower(),
            access_log=settings.debug
        )
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    finally:
        # Run shutdown handler
        asyncio.run(shutdown_handler())