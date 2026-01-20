"""
Configuration settings for the Gesture Control Platform backend.
Provides centralized configuration with environment variable support.
"""

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    
    All settings can be overridden via environment variables or .env file.
    Environment variables should be prefixed (e.g., GCP_HOST).
    """
    
    # ==========================================================================
    # SERVER CONFIGURATION
    # ==========================================================================
    host: str = Field(default="0.0.0.0", description="Server host address")
    port: int = Field(default=8000, ge=1, le=65535, description="Server port")
    debug: bool = Field(default=True, description="Enable debug mode")
    log_level: str = Field(default="INFO", description="Logging level")
    
    # ==========================================================================
    # CORS CONFIGURATION
    # ==========================================================================
    allowed_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173"
        ],
        description="Allowed CORS origins"
    )
    
    # ==========================================================================
    # CAMERA CONFIGURATION
    # ==========================================================================
    camera_index: int = Field(default=0, ge=0, description="Camera device index")
    camera_width: int = Field(default=640, ge=320, le=1920, description="Camera width")
    camera_height: int = Field(default=480, ge=240, le=1080, description="Camera height")
    target_fps: int = Field(default=30, ge=1, le=120, description="Target frame rate")
    
    # ==========================================================================
    # MEDIAPIPE CONFIGURATION
    # ==========================================================================
    max_hands: int = Field(default=2, ge=1, le=4, description="Maximum hands to track")
    min_detection_confidence: float = Field(
        default=0.7, ge=0.0, le=1.0,
        description="Minimum detection confidence"
    )
    min_tracking_confidence: float = Field(
        default=0.5, ge=0.0, le=1.0,
        description="Minimum tracking confidence"
    )
    
    # ==========================================================================
    # PIPELINE CONFIGURATION
    # ==========================================================================
    pipeline_buffer_size: int = Field(
        default=5, ge=1, le=30,
        description="Frame buffer size for ingestion"
    )
    pipeline_drop_frames: bool = Field(
        default=True,
        description="Drop frames when buffer is full"
    )
    enable_profiling: bool = Field(
        default=False,
        description="Enable pipeline performance profiling"
    )
    
    # ==========================================================================
    # WEBSOCKET CONFIGURATION
    # ==========================================================================
    max_websocket_connections: int = Field(
        default=10, ge=1, le=100,
        description="Maximum concurrent WebSocket connections"
    )
    websocket_heartbeat_interval: float = Field(
        default=30.0, ge=5.0, le=300.0,
        description="WebSocket heartbeat interval in seconds"
    )
    gesture_update_interval: float = Field(
        default=0.033, ge=0.016, le=0.5,
        description="Minimum interval between gesture updates"
    )
    
    # ==========================================================================
    # PROJECT CONFIGURATION
    # ==========================================================================
    default_project: str = Field(
        default="finger_count",
        description="Default project to load on startup"
    )
    enable_all_projects: bool = Field(
        default=True,
        description="Enable all available projects"
    )
    
    @field_validator('log_level')
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        v = v.upper()
        if v not in valid_levels:
            raise ValueError(f"log_level must be one of {valid_levels}")
        return v
    
    model_config = {
        "env_file": ".env",
        "env_prefix": "",
        "case_sensitive": False,
        "extra": "ignore"
    }
    
    # Legacy property aliases for backward compatibility
    @property
    def HOST(self) -> str:
        return self.host
    
    @property
    def PORT(self) -> int:
        return self.port
    
    @property
    def DEBUG(self) -> bool:
        return self.debug
    
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return self.allowed_origins
    
    @property
    def CAMERA_INDEX(self) -> int:
        return self.camera_index
    
    @property
    def CAMERA_WIDTH(self) -> int:
        return self.camera_width
    
    @property
    def CAMERA_HEIGHT(self) -> int:
        return self.camera_height
    
    @property
    def CAMERA_FPS(self) -> int:
        return self.target_fps
    
    @property
    def MEDIAPIPE_CONFIDENCE(self) -> float:
        return self.min_detection_confidence
    
    @property
    def MEDIAPIPE_TRACKING_CONFIDENCE(self) -> float:
        return self.min_tracking_confidence
    
    @property
    def MAX_WEBSOCKET_CONNECTIONS(self) -> int:
        return self.max_websocket_connections
    
    @property
    def GESTURE_UPDATE_INTERVAL(self) -> float:
        return self.gesture_update_interval


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Uses lru_cache to ensure settings are only loaded once.
    """
    return Settings()


# Global settings instance (for backward compatibility)
settings = get_settings()