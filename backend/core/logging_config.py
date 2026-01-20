"""
Structured logging configuration for the Gesture Control Platform.
Provides consistent logging across all modules with structured output.
"""

import logging
import sys
from typing import Optional
from datetime import datetime
import json


class StructuredFormatter(logging.Formatter):
    """
    Structured log formatter that outputs JSON-like structured logs.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        # Build structured log entry
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add location info for errors
        if record.levelno >= logging.WARNING:
            log_entry["location"] = f"{record.filename}:{record.funcName}:{record.lineno}"
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add any extra fields
        extra_fields = {
            k: v for k, v in record.__dict__.items()
            if k not in {
                'name', 'msg', 'args', 'created', 'filename', 'funcName',
                'levelname', 'levelno', 'lineno', 'module', 'msecs',
                'pathname', 'process', 'processName', 'relativeCreated',
                'stack_info', 'exc_info', 'exc_text', 'message', 'thread',
                'threadName', 'taskName'
            }
        }
        if extra_fields:
            log_entry["extra"] = extra_fields
        
        return json.dumps(log_entry)


class ColoredFormatter(logging.Formatter):
    """
    Human-readable colored formatter for development.
    """
    
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime('%H:%M:%S.%f')[:-3]
        
        # Build message
        message = f"{color}{timestamp} | {record.levelname:8} | {record.name}:{record.funcName}:{record.lineno} | {record.getMessage()}{self.RESET}"
        
        # Add exception if present
        if record.exc_info:
            message += f"\n{self.formatException(record.exc_info)}"
        
        return message


def configure_logging(
    level: str = "INFO",
    structured: bool = False,
    log_file: Optional[str] = None
) -> None:
    """
    Configure application logging.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        structured: Use JSON structured logging (for production)
        log_file: Optional file path for log output
    """
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper()))
    
    # Set formatter based on mode
    if structured:
        formatter = StructuredFormatter()
    else:
        formatter = ColoredFormatter()
    
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Add file handler if specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(StructuredFormatter())
        root_logger.addHandler(file_handler)
    
    # Reduce noise from third-party libraries
    logging.getLogger("mediapipe").setLevel(logging.WARNING)
    logging.getLogger("cv2").setLevel(logging.WARNING)
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("websockets").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


class LogContext:
    """
    Context manager for adding context to log messages.
    
    Usage:
        with LogContext(request_id="abc123"):
            logger.info("Processing request")
    """
    
    _context: dict = {}
    
    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self._old_context = {}
    
    def __enter__(self):
        self._old_context = LogContext._context.copy()
        LogContext._context.update(self.kwargs)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        LogContext._context = self._old_context
    
    @classmethod
    def get_context(cls) -> dict:
        return cls._context.copy()
