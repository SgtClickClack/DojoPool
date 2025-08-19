"""WebSocket logging configuration module.

This module provides logging configuration for WebSocket operations.
"""

import json
import logging
import logging.handlers
import os
from datetime import datetime
from typing import Any, Dict, Optional

# Create logs directory if it doesn't exist
logs_dir = os.path.join(os.path.dirname(__file__), "..", "..", "logs")
os.makedirs(logs_dir, exist_ok=True)


class WebSocketLogFormatter(logging.Formatter):
    """Custom formatter for WebSocket logs."""

    def __init__(self):
        """Initialize formatter."""
        super().__init__()
        self.default_msec_format = "%s.%03d"

    def format(self, record: logging.LogRecord) -> str:
        """Format log record.

        Args:
            record: Log record to format

        Returns:
            str: Formatted log message
        """
        # Create base log entry
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Add stack info if present
        if record.stack_info:
            log_entry["stack_info"] = self.formatStack(record.stack_info)

        # Add extra fields
        if hasattr(record, "extra"):
            log_entry["extra"] = record.extra

        return json.dumps(log_entry)


class WebSocketLogger(logging.Logger):
    """Custom logger for WebSocket operations."""

    def __init__(self, name: str):
        """Initialize logger.

        Args:
            name: Logger name
        """
        super().__init__(name)

    def log_event(
        self, event_type: str, data: Dict[str, Any], level: int = logging.INFO, **kwargs
    ) -> None:
        """Log WebSocket event.

        Args:
            event_type: Type of event
            data: Event data
            level: Log level
            **kwargs: Additional log data
        """
        extra = {"event_type": event_type, "event_data": data, **kwargs}

        self.log(level, f"WebSocket event: {event_type}", extra=extra)

    def log_error(
        self, error_code: int, message: str, details: Optional[Dict[str, Any]] = None, **kwargs
    ) -> None:
        """Log WebSocket error.

        Args:
            error_code: Error code
            message: Error message
            details: Optional error details
            **kwargs: Additional log data
        """
        extra = {"error_code": error_code, "error_details": details, **kwargs}

        self.error(message, extra=extra)

    def log_metric(
        self, metric_name: str, value: float, tags: Optional[Dict[str, str]] = None, **kwargs
    ) -> None:
        """Log WebSocket metric.

        Args:
            metric_name: Name of metric
            value: Metric value
            tags: Optional metric tags
            **kwargs: Additional log data
        """
        extra = {"metric_name": metric_name, "metric_value": value, "metric_tags": tags, **kwargs}

        self.info(f"WebSocket metric: {metric_name}", extra=extra)


def setup_logging(
    log_level: int = logging.INFO,
    log_file: Optional[str] = None,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
) -> WebSocketLogger:
    """Set up logging configuration.

    Args:
        log_level: Logging level
        log_file: Optional log file path
        max_bytes: Maximum log file size
        backup_count: Number of backup files

    Returns:
        WebSocketLogger: Configured logger
    """
    # Register custom logger class
    logging.setLoggerClass(WebSocketLogger)

    # Create logger
    logger = logging.getLogger("websocket")
    logger.setLevel(log_level)

    # Create formatter
    formatter = WebSocketLogFormatter()

    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Create file handler if log file specified
    if log_file:
        file_handler = logging.handlers.RotatingFileHandler(
            os.path.join(logs_dir, log_file), maxBytes=max_bytes, backupCount=backup_count
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


# Create default logger
logger = setup_logging(log_level=logging.INFO, log_file="websocket.log")


def get_logger(name: Optional[str] = None) -> WebSocketLogger:
    """Get logger instance.

    Args:
        name: Optional logger name

    Returns:
        WebSocketLogger: Logger instance
    """
    if name:
        return logging.getLogger(f"websocket.{name}")
    return logger
