"""Error codes and handling utilities."""

from typing import Dict

ERROR_CODES: Dict[str, str] = {
    # Power-up related errors
    'INVALID_POWER_UP': 'PU001',
    'INSUFFICIENT_INVENTORY': 'PU002',
    'INSUFFICIENT_FUNDS': 'PU003',
    'USER_NOT_FOUND': 'PU004',
    'POWER_UP_ACTIVE': 'PU005',
    'POWER_UP_EXPIRED': 'PU006',
    'POWER_UP_COOLDOWN': 'PU007',
    
    # Validation errors
    'VALIDATION_ERROR': 'VAL001',
    'INVALID_REQUEST': 'VAL002',
    'MISSING_FIELDS': 'VAL003',
    
    # Authentication errors
    'UNAUTHORIZED': 'AUTH001',
    'INVALID_TOKEN': '',
    'TOKEN_EXPIRED': 'AUTH003',
    
    # Database errors
    'DB_ERROR': 'DB001',
    'RECORD_NOT_FOUND': 'DB002',
    'DUPLICATE_RECORD': 'DB003',
    
    # General errors
    'INTERNAL_ERROR': 'GEN001',
    'RATE_LIMIT': 'GEN002',
    'SERVICE_UNAVAILABLE': 'GEN003'
}

ERROR_MESSAGES: Dict[str, str] = {
    # Power-up related errors
    'PU001': 'Invalid power-up ID',
    'PU002': 'Insufficient power-ups in inventory',
    'PU003': 'Insufficient funds to purchase power-up',
    'PU004': 'User not found',
    'PU005': 'Power-up already active',
    'PU006': 'Power-up has expired',
    'PU007': 'Power-up is on cooldown',
    
    # Validation errors
    'VAL001': 'Validation error',
    'VAL002': 'Invalid request data',
    'VAL003': 'Missing required fields',
    
    # Authentication errors
    'AUTH001': 'Unauthorized access',
    'AUTH002': 'Invalid authentication token',
    'AUTH003': 'Authentication token has expired',
    
    # Database errors
    'DB001': 'Database error occurred',
    'DB002': 'Record not found',
    'DB003': 'Duplicate record found',
    
    # General errors
    'GEN001': 'Internal server error',
    'GEN002': 'Rate limit exceeded',
    'GEN003': 'Service temporarily unavailable'
}

def get_error_message(code: str) -> str:
    """Get error message for error code."""
    return ERROR_MESSAGES.get(code, 'Unknown error') 