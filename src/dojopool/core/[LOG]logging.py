"""Logging configuration module.

This module configures logging for the application.
It sets up different handlers and formatters based on the environment.
"""
import os
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional

from flask import Flask, has_request_context, request
from flask.logging import default_handler

class RequestFormatter(logging.Formatter):
    """Custom formatter that includes request information."""
    
    def format(self, record):
        """Format log record with request information.
        
        Args:
            record: Log record to format.
            
        Returns:
            str: Formatted log record.
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

def create_logs_dir(app: Flask) -> Path:
    """Create logs directory if it doesn't exist.
    
    Args:
        app: Flask application instance.
        
    Returns:
        Path: Path to logs directory.
    """
    logs_dir = Path(app.root_path).parent / 'logs'
    logs_dir.mkdir(exist_ok=True)
    return logs_dir

def configure_logging(app: Flask) -> None:
    """Configure logging for the application.
    
    Args:
        app: Flask application instance.
    """
    # Remove default handler
    app.logger.removeHandler(default_handler)
    
    # Set log level
    app.logger.setLevel(app.config.get('LOG_LEVEL', 'INFO'))
    
    # Create formatters
    console_formatter = RequestFormatter(
        '[%(asctime)s] %(remote_addr)s - %(method)s %(url)s\n'
        '%(levelname)s in %(module)s: %(message)s'
    )
    
    file_formatter = RequestFormatter(
        '%(asctime)s - %(remote_addr)s - %(method)s %(url)s - '
        '%(levelname)s - %(module)s - %(message)s'
    )
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.INFO)
    app.logger.addHandler(console_handler)
    
    # Create file handlers in production
    if not app.debug and not app.testing:
        logs_dir = create_logs_dir(app)
        
        # Error logs
        error_log = logs_dir / 'error.log'
        error_file_handler = RotatingFileHandler(
            error_log,
            maxBytes=10485760,  # 10MB
            backupCount=10
        )
        error_file_handler.setLevel(logging.ERROR)
        error_file_handler.setFormatter(file_formatter)
        app.logger.addHandler(error_file_handler)
        
        # Info logs
        info_log = logs_dir / 'info.log'
        info_file_handler = RotatingFileHandler(
            info_log,
            maxBytes=10485760,  # 10MB
            backupCount=10
        )
        info_file_handler.setLevel(logging.INFO)
        info_file_handler.setFormatter(file_formatter)
        app.logger.addHandler(info_file_handler)
        
        # Log startup
        app.logger.info('DojoPool startup')
    
    # Log application startup
    app.logger.info(f'DojoPool starting up in {app.config["ENV"]} mode') 