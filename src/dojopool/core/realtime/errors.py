"""WebSocket error handling module.

This module provides custom exceptions and error handlers for WebSocket events.
"""
from typing import Dict, Any, Optional

class WebSocketError(Exception):
    """Base exception for WebSocket errors."""
    def __init__(self, message: str, code: int = 1000, data: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.data = data or {}

class AuthenticationError(WebSocketError):
    """Raised when authentication fails."""
    def __init__(self, message: str = "Authentication required", data: Optional[Dict[str, Any]] = None):
        super().__init__(message, code=4001, data=data)

class RateLimitError(WebSocketError):
    """Raised when rate limit is exceeded."""
    def __init__(self, message: str = "Rate limit exceeded", data: Optional[Dict[str, Any]] = None):
        super().__init__(message, code=4002, data=data)

class RoomAccessError(WebSocketError):
    """Raised when room access is denied."""
    def __init__(self, message: str = "Room access denied", data: Optional[Dict[str, Any]] = None):
        super().__init__(message, code=4003, data=data)

class ValidationError(WebSocketError):
    """Raised when event data validation fails."""
    def __init__(self, message: str = "Invalid event data", data: Optional[Dict[str, Any]] = None):
        super().__init__(message, code=4004, data=data)

class GameError(WebSocketError):
    """Raised when game-related operations fail."""
    def __init__(self, message: str = "Game operation failed", data: Optional[Dict[str, Any]] = None):
        super().__init__(message, code=4005, data=data)

class TournamentError(WebSocketError):
    """Raised when tournament-related operations fail."""
    def __init__(self, message: str = "Tournament operation failed", data: Optional[Dict[str, Any]] = None):
        super().__init__(message, code=4006, data=data)

def format_error_response(error: WebSocketError) -> Dict[str, Any]:
    """Format error response for client.
    
    Args:
        error: WebSocket error instance.
        
    Returns:
        Dict[str, Any]: Formatted error response.
    """
    return {
        'error': {
            'code': error.code,
            'message': error.message,
            'data': error.data
        }
    }

def handle_websocket_error(error: WebSocketError) -> Dict[str, Any]:
    """Handle WebSocket error and return formatted response.
    
    Args:
        error: WebSocket error instance.
        
    Returns:
        Dict[str, Any]: Formatted error response.
    """
    # Log error details here if needed
    return format_error_response(error)

def validate_event_data(event_name: str, data: Dict[str, Any]) -> None:
    """Validate event data against schema.
    
    Args:
        event_name: Name of the event.
        data: Event data to validate.
        
    Raises:
        ValidationError: If validation fails.
    """
    from .docs import get_event_parameters
    
    required_params = get_event_parameters(event_name)
    
    if not required_params:
        return
        
    for param_name, param_info in required_params.items():
        if param_info.get('required', False):
            if param_name not in data:
                raise ValidationError(
                    f"Missing required parameter: {param_name}",
                    data={'parameter': param_name}
                )
            
            # Type validation
            param_type = param_info.get('type')
            if param_type == 'integer' and not isinstance(data[param_name], int):
                raise ValidationError(
                    f"Invalid type for parameter {param_name}. Expected integer.",
                    data={'parameter': param_name, 'expected_type': 'integer'}
                )
            elif param_type == 'string' and not isinstance(data[param_name], str):
                raise ValidationError(
                    f"Invalid type for parameter {param_name}. Expected string.",
                    data={'parameter': param_name, 'expected_type': 'string'}
                )
            
            # Enum validation
            if 'enum' in param_info and data[param_name] not in param_info['enum']:
                raise ValidationError(
                    f"Invalid value for parameter {param_name}. Must be one of: {param_info['enum']}",
                    data={'parameter': param_name, 'allowed_values': param_info['enum']}
                ) 