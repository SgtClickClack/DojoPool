# Utility File Documentation: src\dojopool\core\logging\utils.py

Generated at: 2025-01-14T18:34:06.443787

## Overview

- Functions: 4
- Classes: 0
- Imports: 11

## Imports

- `flask.current_app`
- `flask.has_request_context`
- `flask.request`
- `functools`
- `logging`
- `time`
- `traceback`
- `typing.Any`
- `typing.Callable`
- `typing.Dict`
- `typing.Optional`

## Functions

### `log_function_call`

Decorator to log function calls with timing.

Args:
    func: Function to wrap
    
Returns:
    Wrapped function

**Details:**
- Parameters: func
- Returns: Callable
- Complexity: 7
- Lines: 59

### `log_error`

Log an error with context.

Args:
    error: Exception to log
    message: Optional message to include
    level: Logging level
    **kwargs: Additional context

**Details:**
- Parameters: error, message, level
- Returns: None
- Complexity: 3
- Lines: 38

### `setup_audit_log`

Set up audit logging.

**Details:**
- Parameters: 
- Returns: None
- Complexity: 2
- Lines: 15

### `audit_log`

Log an audit event.

Args:
    action: Action being performed
    resource: Resource being acted upon
    success: Whether the action was successful
    user_id: ID of user performing action
    **kwargs: Additional context

**Details:**
- Parameters: action, resource, success, user_id
- Returns: None
- Complexity: 2
- Lines: 39

## Recommendations

- Consider breaking down large function `log_function_call` (59 lines)