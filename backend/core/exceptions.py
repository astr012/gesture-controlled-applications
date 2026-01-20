"""
Custom exceptions for the Gesture Control Platform.
Provides hierarchical exception handling with severity levels.
"""

from enum import Enum
from typing import Optional, Dict, Any


class ErrorSeverity(str, Enum):
    """Error severity levels."""
    LOW = "low"          # Recoverable, continue processing
    MEDIUM = "medium"    # Degraded operation, log warning
    HIGH = "high"        # Critical, stop current operation
    FATAL = "fatal"      # System-wide failure, restart required


class GCPError(Exception):
    """Base exception for all Gesture Control Platform errors."""
    
    def __init__(
        self,
        message: str,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        cause: Optional[Exception] = None
    ):
        super().__init__(message)
        self.message = message
        self.severity = severity
        self.code = code or self.__class__.__name__
        self.details = details or {}
        self.cause = cause
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        result = {
            "code": self.code,
            "message": self.message,
            "severity": self.severity.value,
            "recoverable": self.severity in (ErrorSeverity.LOW, ErrorSeverity.MEDIUM)
        }
        if self.details:
            result["details"] = self.details
        return result
    
    def __str__(self) -> str:
        base = f"[{self.severity.value.upper()}] {self.code}: {self.message}"
        if self.cause:
            base += f" (caused by: {self.cause})"
        return base


# =============================================================================
# PIPELINE ERRORS
# =============================================================================

class PipelineError(GCPError):
    """Base exception for pipeline-related errors."""
    
    def __init__(
        self,
        message: str,
        stage: str,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        cause: Optional[Exception] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            severity=severity,
            code=f"PIPELINE_{stage.upper()}_ERROR",
            details={"stage": stage, **(details or {})},
            cause=cause
        )
        self.stage = stage


class IngestionError(PipelineError):
    """Error during data ingestion (camera/stream)."""
    
    def __init__(
        self,
        message: str,
        severity: ErrorSeverity = ErrorSeverity.HIGH,
        cause: Optional[Exception] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            stage="ingestion",
            severity=severity,
            cause=cause,
            details=details
        )


class CameraError(IngestionError):
    """Camera-specific error."""
    
    def __init__(
        self,
        message: str,
        camera_index: int = 0,
        cause: Optional[Exception] = None
    ):
        super().__init__(
            message=message,
            severity=ErrorSeverity.HIGH,
            cause=cause,
            details={"camera_index": camera_index}
        )


class PreprocessingError(PipelineError):
    """Error during preprocessing."""
    
    def __init__(
        self,
        message: str,
        severity: ErrorSeverity = ErrorSeverity.LOW,
        cause: Optional[Exception] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            stage="preprocessing",
            severity=severity,
            cause=cause,
            details=details
        )


class ExtractionError(PipelineError):
    """Error during feature extraction."""
    
    def __init__(
        self,
        message: str,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        cause: Optional[Exception] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            stage="extraction",
            severity=severity,
            cause=cause,
            details=details
        )


class ModelLoadError(ExtractionError):
    """Error loading ML model."""
    
    def __init__(
        self,
        message: str,
        model_name: str,
        cause: Optional[Exception] = None
    ):
        super().__init__(
            message=message,
            severity=ErrorSeverity.FATAL,
            cause=cause,
            details={"model_name": model_name}
        )


class InferenceError(PipelineError):
    """Error during inference."""
    
    def __init__(
        self,
        message: str,
        severity: ErrorSeverity = ErrorSeverity.LOW,
        cause: Optional[Exception] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            stage="inference",
            severity=severity,
            cause=cause,
            details=details
        )


class OutputError(PipelineError):
    """Error during output/action execution."""
    
    def __init__(
        self,
        message: str,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        cause: Optional[Exception] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            stage="output",
            severity=severity,
            cause=cause,
            details=details
        )


# =============================================================================
# PROJECT ERRORS
# =============================================================================

class ProjectError(GCPError):
    """Base exception for project-related errors."""
    
    def __init__(
        self,
        message: str,
        project_id: str,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        cause: Optional[Exception] = None
    ):
        super().__init__(
            message=message,
            severity=severity,
            code="PROJECT_ERROR",
            details={"project_id": project_id},
            cause=cause
        )
        self.project_id = project_id


class ProjectNotFoundError(ProjectError):
    """Project not found in registry."""
    
    def __init__(self, project_id: str):
        super().__init__(
            message=f"Project not found: {project_id}",
            project_id=project_id,
            severity=ErrorSeverity.HIGH
        )


class ProjectInitializationError(ProjectError):
    """Error initializing project."""
    
    def __init__(
        self,
        project_id: str,
        cause: Optional[Exception] = None
    ):
        super().__init__(
            message=f"Failed to initialize project: {project_id}",
            project_id=project_id,
            severity=ErrorSeverity.HIGH,
            cause=cause
        )


# =============================================================================
# API ERRORS
# =============================================================================

class APIError(GCPError):
    """Base exception for API-related errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            severity=severity,
            code="API_ERROR",
            details=details
        )
        self.status_code = status_code


class ValidationError(APIError):
    """Request validation error."""
    
    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=400,
            severity=ErrorSeverity.LOW,
            details={"field": field, **(details or {})}
        )


class WebSocketError(GCPError):
    """WebSocket-related error."""
    
    def __init__(
        self,
        message: str,
        connection_id: Optional[str] = None,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        cause: Optional[Exception] = None
    ):
        super().__init__(
            message=message,
            severity=severity,
            code="WEBSOCKET_ERROR",
            details={"connection_id": connection_id} if connection_id else {},
            cause=cause
        )


# =============================================================================
# CONFIGURATION ERRORS
# =============================================================================

class ConfigurationError(GCPError):
    """Configuration-related error."""
    
    def __init__(
        self,
        message: str,
        config_key: Optional[str] = None,
        cause: Optional[Exception] = None
    ):
        super().__init__(
            message=message,
            severity=ErrorSeverity.FATAL,
            code="CONFIGURATION_ERROR",
            details={"config_key": config_key} if config_key else {},
            cause=cause
        )
