"""Logging configuration module.

This module configures logging for the application.
It sets up different handlers and formatters based on the environment.
"""

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Flask, has_request_context, request
from flask.logging import default_handler
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse


class RequestFormatter(logging.Formatter):
    """Custom formatter that includes request information."""

    def format(self, record: logging.LogRecord) -> str:
        """Format the log record with request information.

        Args:
            record: The log record to format

        Returns:
            The formatted log message
        """
        if has_request_context():
            record.url = request.url
            record.remote_addr = request.remote_addr
            record.method = request.method
        else:
            record.url = None
            record.remote_addr = None
            record.method = None

        return super().format(record)


def create_logs_dir(app: Flask):
    """Create logs directory if it doesn't exist.

    Args:
        app: The Flask application instance

    Returns:
        The path to the logs directory
    """
    logs_dir = Path(app.instance_path) / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    return logs_dir


def configure_logging(app: Flask):
    """Configure logging for the application.

    Args:
        app: The Flask application instance
    """
    # Remove default handler
    app.logger.removeHandler(default_handler)

    # Create logs directory
    logs_dir = create_logs_dir(app)

    # Create file handler
    file_handler = RotatingFileHandler(
        logs_dir / "dojopool.log", maxBytes=10485760, backupCount=10  # 10MB
    )

    # Create formatter
    formatter = RequestFormatter(
        "[%(asctime)s] %(remote_addr)s - %(method)s %(url)s\n"
        "%(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
    )

    # Set formatter
    file_handler.setFormatter(formatter)

    # Set level
    file_handler.setLevel(logging.INFO)

    # Add handler
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)

    # Log application startup
    app.logger.info("DojoPool startup")
