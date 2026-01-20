"""
API Gateway
Creates and configures the FastAPI application with all routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from core.logging_config import get_logger

logger = get_logger(__name__)


def create_api_gateway() -> FastAPI:
    """
    Create and configure the API Gateway.
    
    Returns:
        Configured FastAPI application
    """
    settings = get_settings()
    
    app = FastAPI(
        title="Gesture Control Platform API",
        description="Enterprise-grade gesture recognition platform with real-time processing",
        version="2.0.0",
        docs_url="/api/docs" if settings.debug else None,
        redoc_url="/api/redoc" if settings.debug else None,
        openapi_url="/api/openapi.json" if settings.debug else None
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register REST routes
    from api.rest import health, projects
    
    app.include_router(health.router, prefix="/api/v1", tags=["Health"])
    app.include_router(projects.router, prefix="/api/v1", tags=["Projects"])
    
    # Register WebSocket routes
    from api.websocket import hub
    
    app.include_router(hub.router, tags=["WebSocket"])
    
    # Startup/shutdown events
    @app.on_event("startup")
    async def startup():
        logger.info("API Gateway starting up")
        # Additional startup logic can go here
    
    @app.on_event("shutdown")
    async def shutdown():
        logger.info("API Gateway shutting down")
        # Cleanup logic
        from core.dependencies import get_websocket_hub
        hub = get_websocket_hub()
        await hub.shutdown()
    
    logger.info("API Gateway created")
    return app
