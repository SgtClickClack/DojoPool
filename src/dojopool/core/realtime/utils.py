"""WebSocket utilities module.

This module provides utility functions for WebSocket operations.
"""
from typing import Dict, Any, Optional, List, Union
from datetime import datetime
import json
import uuid
import base64
import hashlib
import hmac
import secrets
from urllib.parse import urlparse

from .constants import ErrorCodes

def get_room_config(room_type: str) -> Dict[str, Any]:
    """Get room configuration.
    
    Args:
        room_type: Type of room
        
    Returns:
        Dict[str, Any]: Room configuration
    """
    # TODO: Load from configuration file
    default_config = {
        'max_members': 100,
        'requires_auth': True,
        'idle_timeout': 3600,  # 1 hour
        'message_rate_limit': 10,  # messages per second
        'history_size': 100  # number of messages to keep
    }
    
    configs = {
        'game': {
            'max_members': 2,
            'requires_auth': True,
            'idle_timeout': 1800,  # 30 minutes
            'message_rate_limit': 20,
            'history_size': 50
        },
        'tournament': {
            'max_members': 32,
            'requires_auth': True,
            'idle_timeout': 7200,  # 2 hours
            'message_rate_limit': 5,
            'history_size': 200
        },
        'chat': {
            'max_members': 50,
            'requires_auth': True,
            'idle_timeout': 3600,  # 1 hour
            'message_rate_limit': 2,
            'history_size': 100
        }
    }
    
    return configs.get(room_type, default_config)

def validate_event_data(event_type: str, data: Dict[str, Any]) -> bool:
    """Validate event data against schema.
    
    Args:
        event_type: Type of event
        data: Event data to validate
        
    Returns:
        bool: Whether data is valid
    """
    # TODO: Implement proper schema validation
    return True

def format_error_response(
    code: ErrorCodes,
    message: str,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Format error response.
    
    Args:
        code: Error code
        message: Error message
        details: Optional error details
        
    Returns:
        Dict[str, Any]: Formatted error response
    """
    response = {
        'error': {
            'code': code.value,
            'message': message
        }
    }
    
    if details:
        response['error']['details'] = details
    
    return response

def generate_room_id(prefix: str = '') -> str:
    """Generate unique room ID.
    
    Args:
        prefix: Optional prefix for the room ID
        
    Returns:
        str: Generated room ID
    """
    random_id = str(uuid.uuid4())
    return f"{prefix}_{random_id}" if prefix else random_id

def generate_token(
    user_id: str,
    secret_key: str,
    expiry: Optional[datetime] = None
) -> str:
    """Generate authentication token.
    
    Args:
        user_id: User ID
        secret_key: Secret key for signing
        expiry: Optional token expiry time
        
    Returns:
        str: Generated token
    """
    # Create token payload
    payload = {
        'user_id': user_id,
        'created_at': datetime.utcnow().isoformat(),
        'nonce': secrets.token_hex(8)
    }
    
    if expiry:
        payload['expires_at'] = expiry.isoformat()
    
    # Encode payload
    payload_str = json.dumps(payload)
    payload_b64 = base64.b64encode(payload_str.encode()).decode()
    
    # Generate signature
    signature = hmac.new(
        secret_key.encode(),
        payload_b64.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Combine payload and signature
    return f"{payload_b64}.{signature}"

def verify_token(token: str, secret_key: str) -> Optional[Dict[str, Any]]:
    """Verify authentication token.
    
    Args:
        token: Token to verify
        secret_key: Secret key for verification
        
    Returns:
        Optional[Dict[str, Any]]: Token payload if valid, None if invalid
    """
    try:
        # Split token into payload and signature
        payload_b64, signature = token.split('.')
        
        # Verify signature
        expected_signature = hmac.new(
            secret_key.encode(),
            payload_b64.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            return None
        
        # Decode payload
        payload_str = base64.b64decode(payload_b64).decode()
        payload = json.loads(payload_str)
        
        # Check expiry
        if 'expires_at' in payload:
            expiry = datetime.fromisoformat(payload['expires_at'])
            if datetime.utcnow() > expiry:
                return None
        
        return payload
        
    except Exception:
        return None

def parse_query_string(query_string: str) -> Dict[str, str]:
    """Parse query string into dictionary.
    
    Args:
        query_string: Query string to parse
        
    Returns:
        Dict[str, str]: Parsed parameters
    """
    if not query_string:
        return {}
    
    params = {}
    for param in query_string.split('&'):
        if '=' in param:
            key, value = param.split('=', 1)
            params[key] = value
    
    return params

def validate_origin(
    origin: str,
    allowed_origins: Union[str, List[str]]
) -> bool:
    """Validate request origin.
    
    Args:
        origin: Origin to validate
        allowed_origins: Allowed origins
        
    Returns:
        bool: Whether origin is allowed
    """
    if allowed_origins == '*':
        return True
    
    if isinstance(allowed_origins, str):
        allowed_origins = [allowed_origins]
    
    try:
        origin_parts = urlparse(origin)
        origin = f"{origin_parts.scheme}://{origin_parts.netloc}"
        
        return origin in allowed_origins
        
    except Exception:
        return False

def format_timestamp(dt: Optional[datetime] = None) -> str:
    """Format timestamp in ISO format.
    
    Args:
        dt: Optional datetime to format
        
    Returns:
        str: Formatted timestamp
    """
    if dt is None:
        dt = datetime.utcnow()
    
    return dt.isoformat()

def calculate_rate(
    events: List[datetime],
    window: int,
    current_time: Optional[datetime] = None
) -> float:
    """Calculate event rate within time window.
    
    Args:
        events: List of event timestamps
        window: Time window in seconds
        current_time: Optional current time
        
    Returns:
        float: Events per second
    """
    if not events:
        return 0.0
    
    if current_time is None:
        current_time = datetime.utcnow()
    
    # Filter events within window
    window_start = current_time.timestamp() - window
    recent_events = [
        e for e in events
        if e.timestamp() > window_start
    ]
    
    if not recent_events:
        return 0.0
    
    # Calculate rate
    time_span = current_time.timestamp() - min(e.timestamp() for e in recent_events)
    if time_span <= 0:
        return 0.0
    
    return len(recent_events) / time_span

def format_bytes(size: int) -> str:
    """Format byte size with units.
    
    Args:
        size: Size in bytes
        
    Returns:
        str: Formatted size string
    """
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    unit_index = 0
    
    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024
        unit_index += 1
    
    return f"{size:.2f} {units[unit_index]}"

def mask_sensitive_data(
    data: Dict[str, Any],
    sensitive_fields: List[str]
) -> Dict[str, Any]:
    """Mask sensitive data in dictionary.
    
    Args:
        data: Data to mask
        sensitive_fields: Fields to mask
        
    Returns:
        Dict[str, Any]: Masked data
    """
    masked = data.copy()
    
    for field in sensitive_fields:
        if field in masked:
            if isinstance(masked[field], str):
                if len(masked[field]) > 6:
                    masked[field] = f"{masked[field][:3]}...{masked[field][-3:]}"
                else:
                    masked[field] = "***"
            else:
                masked[field] = "***"
    
    return masked

def merge_dicts(
    dict1: Dict[str, Any],
    dict2: Dict[str, Any],
    overwrite: bool = True
) -> Dict[str, Any]:
    """Merge two dictionaries recursively.
    
    Args:
        dict1: First dictionary
        dict2: Second dictionary
        overwrite: Whether to overwrite existing values
        
    Returns:
        Dict[str, Any]: Merged dictionary
    """
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value, overwrite)
        elif key not in result or overwrite:
            result[key] = value
    
    return result

def validate_json(data: str) -> Optional[Dict[str, Any]]:
    """Validate and parse JSON string.
    
    Args:
        data: JSON string to validate
        
    Returns:
        Optional[Dict[str, Any]]: Parsed JSON if valid, None if invalid
    """
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        return None

def generate_nonce(length: int = 16) -> str:
    """Generate random nonce.
    
    Args:
        length: Nonce length in bytes
        
    Returns:
        str: Generated nonce
    """
    return secrets.token_hex(length) 