"""Logging configuration and initialization."""

import os
import logging
from logging.config import dictConfig
from pythonjsonlogger import jsonlogger

def init_logging(app):
    """Initialize logging for the application."""
    # Configure logging only if enabled
    if not app.config.get('LOGGING_ENABLED', True):
        return
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(app.root_path, 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Configure logging
    logging_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                '()': jsonlogger.JsonFormatter,
                'format': '%(asctime)s %(levelname)s %(name)s %(message)s'
            },
            'standard': {
                'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'standard',
                'level': 'INFO'
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': os.path.join(log_dir, 'app.log'),
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'formatter': 'json',
                'level': 'INFO'
            },
            'error_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': os.path.join(log_dir, 'error.log'),
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'formatter': 'json',
                'level': 'ERROR'
            }
        },
        'loggers': {
            'werkzeug': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False
            },
            'sqlalchemy.engine': {
                'handlers': ['console', 'file'],
                'level': 'WARNING',
                'propagate': False
            }
        },
        'root': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'INFO'
        }
    }
    
    # Apply configuration
    dictConfig(logging_config)
    
    # Set up request logging
    @app.before_request
    def log_request():
        """Log incoming requests."""
        app.logger.info('Request started')
    
    @app.after_request
    def log_response(response):
        """Log outgoing responses."""
        app.logger.info(
            'Request completed',
            extra={'status_code': response.status_code}
        )
        return response
    
    @app.teardown_request
    def log_exception(exc):
        """Log unhandled exceptions."""
        if exc:
            app.logger.error(
                'Unhandled exception',
                exc_info=exc
            )

__all__ = ['init_logging'] 