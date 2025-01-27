# Utility File Documentation: src\dojopool\core\realtime\room_logging.py

Generated at: 2025-01-14T18:34:06.435787

## Overview

- Functions: 0
- Classes: 1
- Imports: 12

## Imports

- `constants.EventTypes`
- `datetime.datetime`
- `json`
- `log_config.logger`
- `logging`
- `logging.handlers`
- `os`
- `pathlib.Path`
- `typing.Any`
- `typing.Dict`
- `typing.List`
- `typing.Optional`

## Classes

### `RoomLogger`

Room logger class.

**Methods:**

#### `__init__`

Initialize RoomLogger.

Args:
    log_dir: Directory for log files

**Details:**
- Parameters: self, log_dir
- Complexity: 1
- Lines: 49

#### `_setup_logger`

Set up logger instance.

Args:
    name: Logger name
    log_file: Log file path
    formatter: Log formatter
    
Returns:
    logging.Logger: Configured logger

**Details:**
- Parameters: self, name, log_file, formatter
- Complexity: 2
- Lines: 28

#### `log_room_event`

Log room event.

Args:
    event_type: Event type
    room_id: Room ID
    user_id: Optional user ID
    data: Optional event data

**Details:**
- Parameters: self, event_type, room_id, user_id, data
- Returns: None
- Complexity: 2
- Lines: 27

#### `log_room_access`

Log room access attempt.

Args:
    action: Access action
    room_id: Room ID
    user_id: Optional user ID
    success: Whether access was successful
    details: Optional access details

**Details:**
- Parameters: self, action, room_id, user_id, success, details
- Returns: None
- Complexity: 2
- Lines: 32

#### `log_room_error`

Log room error.

Args:
    error_type: Error type
    room_id: Room ID
    user_id: Optional user ID
    error: Error exception
    details: Optional error details

**Details:**
- Parameters: self, error_type, room_id, user_id, error, details
- Returns: None
- Complexity: 2
- Lines: 31

#### `log_room_audit`

Log room audit event.

Args:
    action: Audit action
    room_id: Room ID
    user_id: User ID
    details: Optional audit details

**Details:**
- Parameters: self, action, room_id, user_id, details
- Returns: None
- Complexity: 2
- Lines: 31

#### `get_room_events`

Get room events from log.

Args:
    room_id: Room ID
    event_type: Optional event type filter
    start_time: Optional start time filter
    end_time: Optional end time filter
    
Returns:
    List[Dict[str, Any]]: List of room events

**Details:**
- Parameters: self, room_id, event_type, start_time, end_time
- Complexity: 17
- Lines: 64

#### `get_room_access_logs`

Get room access logs.

Args:
    room_id: Room ID
    user_id: Optional user ID filter
    start_time: Optional start time filter
    end_time: Optional end time filter
    
Returns:
    List[Dict[str, Any]]: List of access logs

**Details:**
- Parameters: self, room_id, user_id, start_time, end_time
- Complexity: 17
- Lines: 64

#### `get_room_audit_logs`

Get room audit logs.

Args:
    room_id: Room ID
    user_id: Optional user ID filter
    action: Optional action filter
    start_time: Optional start time filter
    end_time: Optional end time filter
    
Returns:
    List[Dict[str, Any]]: List of audit logs

**Details:**
- Parameters: self, room_id, user_id, action, start_time, end_time
- Complexity: 19
- Lines: 68

## Recommendations

- Consider splitting complex method `RoomLogger.get_room_events` (complexity: 17)
- Consider breaking down large method `RoomLogger.get_room_events` (64 lines)
- Consider splitting complex method `RoomLogger.get_room_access_logs` (complexity: 17)
- Consider breaking down large method `RoomLogger.get_room_access_logs` (64 lines)
- Consider splitting complex method `RoomLogger.get_room_audit_logs` (complexity: 19)
- Consider breaking down large method `RoomLogger.get_room_audit_logs` (68 lines)