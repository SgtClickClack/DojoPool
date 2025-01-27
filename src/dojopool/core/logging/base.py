"""Base logging module providing unified logging interface."""

import json
import logging
import os
import sys
from datetime import datetime
from enum import Enum
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, Optional, Union

class LogLevel(Enum):
    """Log level enumeration."""
    DEBUG = logging.DEBUG
    INFO = logging.INFO
    WARNING = logging.WARNING
    ERROR = logging.ERROR
    CRITICAL = logging.CRITICAL

class LogFormat(Enum):
    """Log format enumeration."""
    JSON = 'json'
    TEXT = 'text'

class BaseLogger:
    """Base logger class providing unified logging interface."""

    def __init__(
        self,
        name: str,
        log_dir: Union[str, Path],
        log_format: LogFormat = LogFormat.JSON,
        max_bytes: int = 10*1024*1024,  # 10MB
        backup_count: int = 5,
        level: LogLevel = LogLevel.INFO
    ):
        """Initialize base logger.
        
        Args:
            name: Logger name
            log_dir: Directory for log files
            log_format: Log format (JSON or text)
            max_bytes: Maximum log file size
            backup_count: Number of backup files to keep
            level: Logging level
        """
        self.name = name
        self.log_dir = Path(log_dir)
        self.log_format = log_format
        self.max_bytes = max_bytes
        self.backup_count = backup_count
        self.level = level

        # Create log directory
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # Set up logger
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """Set up logger instance.
        
        Returns:
            logging.Logger: Configured logger
        """
        logger = logging.getLogger(self.name)
        logger.setLevel(self.level.value)

        # Remove existing handlers
        for handler in logger.handlers[:]:
            logger.removeHandler(handler)

        # Create formatter based on format type
        if self.log_format == LogFormat.JSON:
            formatter = logging.Formatter(
                '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", %(message)s}',
                datefmt='%Y-%m-%dT%H:%M:%S'
            )
        else:
            formatter = logging.Formatter(
                '%(asctime)s - %(levelname)s - %(name)s - %(message)s',
                datefmt='%Y-%m-%dT%H:%M:%S'
            )

        # Add file handler
        file_handler = RotatingFileHandler(
            self.log_dir / f"{self.name}.log",
            maxBytes=self.max_bytes,
            backupCount=self.backup_count
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        # Add console handler in development
        if os.getenv('FLASK_ENV') == 'development':
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)

        return logger

    def _format_message(self, message: str, **kwargs) -> str:
        """Format log message with additional context.
        
        Args:
            message: Log message
            **kwargs: Additional context
            
        Returns:
            str: Formatted message
        """
        if self.log_format == LogFormat.JSON:
            context = {
                'message': message,
                **kwargs
            }
            return f'"data": {json.dumps(context)}'
        else:
            context_str = ', '.join(f"{k}={v}" for k, v in kwargs.items())
            return f"{message} - {context_str}" if context_str else message

    def debug(self, message: str, **kwargs) -> None:
        """Log debug message.
        
        Args:
            message: Log message
            **kwargs: Additional context
        """
        self.logger.debug(self._format_message(message, **kwargs))

    def info(self, message: str, **kwargs) -> None:
        """Log info message.
        
        Args:
            message: Log message
            **kwargs: Additional context
        """
        self.logger.info(self._format_message(message, **kwargs))

    def warning(self, message: str, **kwargs) -> None:
        """Log warning message.
        
        Args:
            message: Log message
            **kwargs: Additional context
        """
        self.logger.warning(self._format_message(message, **kwargs))

    def error(
        self,
        message: str,
        error: Optional[Exception] = None,
        **kwargs
    ) -> None:
        """Log error message.
        
        Args:
            message: Log message
            error: Optional exception
            **kwargs: Additional context
        """
        if error:
            kwargs['error_type'] = type(error).__name__
            kwargs['error_message'] = str(error)
        self.logger.error(self._format_message(message, **kwargs))

    def critical(
        self,
        message: str,
        error: Optional[Exception] = None,
        **kwargs
    ) -> None:
        """Log critical message.
        
        Args:
            message: Log message
            error: Optional exception
            **kwargs: Additional context
        """
        if error:
            kwargs['error_type'] = type(error).__name__
            kwargs['error_message'] = str(error)
        self.logger.critical(self._format_message(message, **kwargs))

    def set_level(self, level: LogLevel) -> None:
        """Set logging level.
        
        Args:
            level: New logging level
        """
        self.level = level
        self.logger.setLevel(level.value)

    def add_context(self, **kwargs) -> None:
        """Add persistent context to all log messages.
        
        Args:
            **kwargs: Context key-value pairs
        """
        # TODO: Implement context injection using filter or adapter
        pass 