"""Logging utilities for DojoPool."""

import logging
import functools
import time
import traceback
from typing import Any, Callable, Dict, Optional
from flask import request, current_app, has_request_context

def log_function_call(func: Callable) -> Callable:
    """Decorator to log function calls with timing.
    
    Args:
        func: Function to wrap
        
    Returns:
        Wrapped function
    """
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        logger = logging.getLogger(func.__module__)
        
        # Prepare log context
        context = {
            'function': func.__name__,
            'module': func.__module__
        }
        
        # Add request context if available
        if has_request_context():
            context.update({
                'method': request.method,
                'url': request.url,
                'ip': request.remote_addr
            })
        
        # Log function entry
        logger.debug(f"Entering {func.__name__}", extra=context)
        
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            # Log successful execution
            context['duration'] = duration
            logger.debug(
                f"Completed {func.__name__} in {duration:.3f}s",
                extra=context
            )
            return result
            
        except Exception as e:
            duration = time.time() - start_time
            
            # Log error with traceback
            context.update({
                'duration': duration,
                'error': str(e),
                'traceback': traceback.format_exc()
            })
            logger.error(
                f"Error in {func.__name__}: {str(e)}",
                extra=context
            )
            raise
    
    return wrapper

def log_error(
    error: Exception,
    message: Optional[str] = None,
    level: int = logging.ERROR,
    **kwargs: Any
) -> None:
    """Log an error with context.
    
    Args:
        error: Exception to log
        message: Optional message to include
        level: Logging level
        **kwargs: Additional context
    """
    logger = logging.getLogger('error')
    
    # Prepare error context
    context = {
        'error_type': type(error).__name__,
        'error_message': str(error),
        'traceback': traceback.format_exc(),
        **kwargs
    }
    
    # Add request context if available
    if has_request_context():
        context.update({
            'method': request.method,
            'url': request.url,
            'ip': request.remote_addr,
            'user_agent': request.user_agent.string
        })
    
    logger.log(
        level,
        message or str(error),
        extra=context
    )

def setup_audit_log() -> None:
    """Set up audit logging."""
    audit_logger = logging.getLogger('audit')
    
    # Add audit file handler
    if current_app.config.get('AUDIT_LOG_FILE'):
        handler = logging.handlers.RotatingFileHandler(
            current_app.config['AUDIT_LOG_FILE'],
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=10
        )
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        audit_logger.addHandler(handler)

def audit_log(
    action: str,
    resource: str,
    success: bool,
    user_id: Optional[int] = None,
    **kwargs: Any
) -> None:
    """Log an audit event.
    
    Args:
        action: Action being performed
        resource: Resource being acted upon
        success: Whether the action was successful
        user_id: ID of user performing action
        **kwargs: Additional context
    """
    logger = logging.getLogger('audit')
    
    # Prepare audit context
    context = {
        'action': action,
        'resource': resource,
        'success': success,
        'user_id': user_id,
        **kwargs
    }
    
    # Add request context if available
    if has_request_context():
        context.update({
            'method': request.method,
            'url': request.url,
            'ip': request.remote_addr
        })
    
    logger.info(
        f"{action} on {resource} {'succeeded' if success else 'failed'}",
        extra=context
    ) 