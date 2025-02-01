"""Logging package.

This package provides logging functionality.
"""

import json
import logging
import os
from logging.handlers import RotatingFileHandler

from flask import has_request_context, request


class RequestFormatter(logging.Formatter):
    """Custom formatter that includes request information."""

    def format(self, record):
        """Format log record with request information.

        Args:
            record: Log record

        Returns:
            str: Formatted log message
        """
        if has_request_context():
            record.url = request.url
            record.remote_addr = request.remote_addr
            record.method = request.method
            record.path = request.path
        else:
            record.url = None
            record.remote_addr = None
            record.method = None
            record.path = None

        return super().format(record)


def setup_logging(app):
    """Set up logging for the application.

    Args:
        app: Flask application instance
    """
    # Create logs directory if it doesn't exist
    if not os.path.exists("logs"):
        os.makedirs("logs")

    # Configure file handler
    file_handler = RotatingFileHandler("logs/dojopool.log", maxBytes=10240, backupCount=10)
    file_handler.setFormatter(
        RequestFormatter(
            "[%(asctime)s] %(remote_addr)s - %(method)s %(url)s\n"
            "%(levelname)s in %(module)s: %(message)s"
        )
    )
    file_handler.setLevel(logging.INFO)

    # Configure JSON handler for structured logging
    json_handler = RotatingFileHandler("logs/dojopool.json", maxBytes=10240, backupCount=10)
    json_handler.setFormatter(
        logging.Formatter(
            lambda x: json.dumps(
                {
                    "timestamp": x.asctime,
                    "level": x.levelname,
                    "module": x.module,
                    "message": x.message,
                    "url": getattr(x, "url", None),
                    "method": getattr(x, "method", None),
                    "remote_addr": getattr(x, "remote_addr", None),
                    "path": getattr(x, "path", None),
                }
            )
        )
    )
    json_handler.setLevel(logging.INFO)

    # Add handlers to app logger
    app.logger.addHandler(file_handler)
    app.logger.addHandler(json_handler)
    app.logger.setLevel(logging.INFO)

    # Configure Werkzeug logger
    logging.getLogger("werkzeug").addHandler(file_handler)

    # Log application startup
    app.logger.info("DojoPool startup")


# Create logger instance
logger = logging.getLogger("dojopool")

__all__ = ["logger", "setup_logging"]
