"""
Logging configuration for blockchain operations.
"""
import logging
import json
from typing import Any, Dict, Optional
from functools import wraps
from datetime import datetime
from logging.handlers import RotatingFileHandler
import os

# Create logs directory if it doesn't exist
os.makedirs('logs/blockchain', exist_ok=True)

# Configure blockchain logger
blockchain_logger = logging.getLogger('blockchain')
blockchain_logger.setLevel(logging.DEBUG)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
console_handler.setFormatter(console_formatter)
blockchain_logger.addHandler(console_handler)

# File handler for detailed logs
file_handler = RotatingFileHandler(
    'logs/blockchain/operations.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
file_handler.setFormatter(file_formatter)
blockchain_logger.addHandler(file_handler)

# File handler for errors
error_handler = RotatingFileHandler(
    'logs/blockchain/errors.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
error_handler.setLevel(logging.ERROR)
error_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s\n'
    'Exception: %(exc_info)s\n'
    'Stack trace:\n%(stack_info)s\n'
)
error_handler.setFormatter(error_formatter)
blockchain_logger.addHandler(error_handler)

def format_log_data(data: Any) -> str:
    """Format data for logging."""
    if isinstance(data, (dict, list)):
        return json.dumps(data, indent=2)
    return str(data)

def log_blockchain_operation(
    level: int = logging.INFO,
    include_args: bool = True,
    include_result: bool = True,
    mask_secrets: bool = True
) -> Any:
    """Decorator for logging blockchain operations.
    
    Args:
        level: Logging level
        include_args: Whether to include function arguments in log
        include_result: Whether to include function result in log
        mask_secrets: Whether to mask sensitive data
        
    Returns:
        Decorated function
    """
    def decorator(func: Any) -> Any:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            function_name = func.__name__
            start_time = datetime.utcnow()
            
            # Format arguments for logging
            log_args = {}
            if include_args:
                # Get non-self arguments
                if args and len(args) > 1:
                    log_args['args'] = args[1:]
                if kwargs:
                    log_args['kwargs'] = kwargs.copy()
                    
                # Mask sensitive data
                if mask_secrets:
                    if 'private_key' in log_args.get('kwargs', {}):
                        log_args['kwargs']['private_key'] = '***'
                    if 'password' in log_args.get('kwargs', {}):
                        log_args['kwargs']['password'] = '***'
            
            try:
                # Log operation start
                blockchain_logger.log(
                    level,
                    f"Starting blockchain operation: {function_name}",
                    extra={
                        'operation': function_name,
                        'arguments': format_log_data(log_args),
                        'timestamp': start_time.isoformat()
                    }
                )
                
                # Execute function
                result = await func(*args, **kwargs)
                
                # Calculate duration
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                # Format result for logging
                log_result = None
                if include_result:
                    if isinstance(result, dict) and mask_secrets:
                        log_result = result.copy()
                        if 'private_key' in log_result:
                            log_result['private_key'] = '***'
                        if 'password' in log_result:
                            log_result['password'] = '***'
                    else:
                        log_result = result
                
                # Log successful completion
                blockchain_logger.log(
                    level,
                    f"Completed blockchain operation: {function_name}",
                    extra={
                        'operation': function_name,
                        'duration': duration,
                        'result': format_log_data(log_result) if log_result is not None else None,
                        'timestamp': datetime.utcnow().isoformat()
                    }
                )
                
                return result
                
            except Exception as e:
                # Calculate duration
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                # Log error
                blockchain_logger.error(
                    f"Blockchain operation failed: {function_name}",
                    exc_info=True,
                    stack_info=True,
                    extra={
                        'operation': function_name,
                        'duration': duration,
                        'error': str(e),
                        'error_type': type(e).__name__,
                        'timestamp': datetime.utcnow().isoformat()
                    }
                )
                raise
                
        return wrapper
    return decorator

# Configure logging levels for different operations
LOGGING_CONFIG = {
    # Read operations
    'get_balance': {
        'level': logging.INFO,
        'include_args': True,
        'include_result': True,
        'mask_secrets': True
    },
    'get_transaction': {
        'level': logging.INFO,
        'include_args': True,
        'include_result': True,
        'mask_secrets': True
    },
    'get_transactions': {
        'level': logging.INFO,
        'include_args': True,
        'include_result': True,
        'mask_secrets': True
    },
    'get_network_info': {
        'level': logging.INFO,
        'include_args': False,
        'include_result': True,
        'mask_secrets': False
    },
    
    # Write operations
    'create_wallet': {
        'level': logging.INFO,
        'include_args': False,
        'include_result': False,
        'mask_secrets': True
    },
    'transfer': {
        'level': logging.INFO,
        'include_args': True,
        'include_result': True,
        'mask_secrets': True
    },
    'approve': {
        'level': logging.INFO,
        'include_args': True,
        'include_result': True,
        'mask_secrets': True
    },
    
    # Token operations
    'get_metadata': {
        'level': logging.INFO,
        'include_args': True,
        'include_result': True,
        'mask_secrets': False
    }
} 