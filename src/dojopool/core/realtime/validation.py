"""WebSocket validation module.

This module provides validation functionality for WebSocket events and data.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Type, Union

from .constants import ErrorCodes, EventTypes
from .utils import format_error_response

# Event validation schemas
EVENT_SCHEMAS = {
    EventTypes.JOIN_GAME: {
        "required": ["game_id"],
        "optional": ["user_data"],
        "types": {"game_id": str, "user_data": dict},
        "max_size": 1024,  # 1KB
    },
    EventTypes.LEAVE_GAME: {
        "required": ["game_id"],
        "types": {"game_id": str},
        "max_size": 1024,  # 1KB
    },
    EventTypes.UPDATE_SCORE: {
        "required": ["game_id", "player1_score", "player2_score"],
        "types": {"game_id": str, "player1_score": int, "player2_score": int},
        "max_size": 1024,  # 1KB
    },
    EventTypes.END_GAME: {
        "required": ["game_id"],
        "optional": ["reason"],
        "types": {"game_id": str, "reason": str},
        "max_size": 1024,  # 1KB
    },
    EventTypes.JOIN_TOURNAMENT: {
        "required": ["tournament_id"],
        "optional": ["user_data"],
        "types": {"tournament_id": str, "user_data": dict},
        "max_size": 1024,  # 1KB
    },
    EventTypes.LEAVE_TOURNAMENT: {
        "required": ["tournament_id"],
        "types": {"tournament_id": str},
        "max_size": 1024,  # 1KB
    },
    EventTypes.START_TOURNAMENT: {
        "required": ["tournament_id"],
        "optional": ["settings"],
        "types": {"tournament_id": str, "settings": dict},
        "max_size": 2048,  # 2KB
    },
    EventTypes.END_TOURNAMENT: {
        "required": ["tournament_id"],
        "optional": ["reason"],
        "types": {"tournament_id": str, "reason": str},
        "max_size": 1024,  # 1KB
    },
    EventTypes.CHAT_MESSAGE: {
        "required": ["room_id", "message"],
        "optional": ["type"],
        "types": {"room_id": str, "message": str, "type": str},
        "max_size": 10240,  # 10KB
        "constraints": {"message": {"max_length": 1000}},
    },
}


def validate_event_data(event_type: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate event data against schema.

    Args:
        event_type: Type of event
        data: Event data

    Returns:
        Optional[Dict[str, Any]]: Error details if validation fails, None if successful
    """
    # Check if event type exists
    if event_type not in EVENT_SCHEMAS:
        return format_error_response(ErrorCodes.INVALID_EVENT, f"Invalid event type: {event_type}")

    schema = EVENT_SCHEMAS[event_type]

    # Check required fields
    for field in schema.get("required", []):
        if field not in data:
            return format_error_response(
                ErrorCodes.MISSING_PARAMETERS, f"Missing required field: {field}", {"field": field}
            )

    # Check field types
    for field, value in data.items():
        expected_type = schema.get("types", {}).get(field)
        if expected_type and not isinstance(value, expected_type):
            return format_error_response(
                ErrorCodes.INVALID_PARAMETERS,
                f"Invalid type for field {field}. Expected {expected_type.__name__}",
                {
                    "field": field,
                    "expected_type": expected_type.__name__,
                    "actual_type": type(value).__name__,
                },
            )

    # Check payload size
    max_size = schema.get("max_size")
    if max_size:
        payload_size = len(str(data).encode("utf-8"))
        if payload_size > max_size:
            return format_error_response(
                ErrorCodes.MESSAGE_TOO_BIG,
                f"Payload size ({payload_size} bytes) exceeds maximum ({max_size} bytes)",
                {"payload_size": payload_size, "max_size": max_size},
            )

    # Check field constraints
    constraints = schema.get("constraints", {})
    for field, field_constraints in constraints.items():
        if field in data:
            value = data[field]

            # Check max length
            max_length = field_constraints.get("max_length")
            if max_length and len(str(value)) > max_length:
                return format_error_response(
                    ErrorCodes.INVALID_PARAMETERS,
                    f"Field {field} exceeds maximum length of {max_length}",
                    {"field": field, "max_length": max_length, "actual_length": len(str(value))},
                )

    return None


def validate_type(
    value: Any, expected_type: Union[Type, List[Type]], field_name: str
) -> Optional[Dict[str, Any]]:
    """Validate value type.

    Args:
        value: Value to validate
        expected_type: Expected type or list of types
        field_name: Field name for error messages

    Returns:
        Optional[Dict[str, Any]]: Error details if validation fails, None if successful
    """
    if isinstance(expected_type, list):
        if not any(isinstance(value, t) for t in expected_type):
            return format_error_response(
                ErrorCodes.INVALID_PARAMETERS,
                f"Invalid type for {field_name}. Expected one of: {[t.__name__ for t in expected_type]}",
                {
                    "field": field_name,
                    "expected_types": [t.__name__ for t in expected_type],
                    "actual_type": type(value).__name__,
                },
            )
    elif not isinstance(value, expected_type):
        return format_error_response(
            ErrorCodes.INVALID_PARAMETERS,
            f"Invalid type for {field_name}. Expected {expected_type.__name__}",
            {
                "field": field_name,
                "expected_type": expected_type.__name__,
                "actual_type": type(value).__name__,
            },
        )

    return None


def validate_range(
    value: Union[int, float],
    min_value: Optional[Union[int, float]] = None,
    max_value: Optional[Union[int, float]] = None,
    field_name: str = "",
) -> Optional[Dict[str, Any]]:
    """Validate numeric range.

    Args:
        value: Value to validate
        min_value: Minimum allowed value
        max_value: Maximum allowed value
        field_name: Field name for error messages

    Returns:
        Optional[Dict[str, Any]]: Error details if validation fails, None if successful
    """
    if min_value is not None and value < min_value:
        return format_error_response(
            ErrorCodes.INVALID_PARAMETERS,
            f"{field_name} must be greater than or equal to {min_value}",
            {"field": field_name, "min_value": min_value, "actual_value": value},
        )

    if max_value is not None and value > max_value:
        return format_error_response(
            ErrorCodes.INVALID_PARAMETERS,
            f"{field_name} must be less than or equal to {max_value}",
            {"field": field_name, "max_value": max_value, "actual_value": value},
        )

    return None


def validate_length(
    value: Union[str, List, Dict],
    min_length: Optional[int] = None,
    max_length: Optional[int] = None,
    field_name: str = "",
) -> Optional[Dict[str, Any]]:
    """Validate string or collection length.

    Args:
        value: Value to validate
        min_length: Minimum allowed length
        max_length: Maximum allowed length
        field_name: Field name for error messages

    Returns:
        Optional[Dict[str, Any]]: Error details if validation fails, None if successful
    """
    length = len(value)

    if min_length is not None and length < min_length:
        return format_error_response(
            ErrorCodes.INVALID_PARAMETERS,
            f"{field_name} must have length greater than or equal to {min_length}",
            {"field": field_name, "min_length": min_length, "actual_length": length},
        )

    if max_length is not None and length > max_length:
        return format_error_response(
            ErrorCodes.INVALID_PARAMETERS,
            f"{field_name} must have length less than or equal to {max_length}",
            {"field": field_name, "max_length": max_length, "actual_length": length},
        )

    return None


def validate_datetime(
    value: Union[str, datetime], field_name: str = ""
) -> Optional[Dict[str, Any]]:
    """Validate datetime value.

    Args:
        value: Value to validate
        field_name: Field name for error messages

    Returns:
        Optional[Dict[str, Any]]: Error details if validation fails, None if successful
    """
    if isinstance(value, str):
        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return format_error_response(
                ErrorCodes.INVALID_PARAMETERS,
                f"Invalid datetime format for {field_name}",
                {"field": field_name, "value": value},
            )
    elif not isinstance(value, datetime):
        return format_error_response(
            ErrorCodes.INVALID_PARAMETERS,
            f"Invalid type for {field_name}. Expected datetime or ISO format string",
            {"field": field_name, "actual_type": type(value).__name__},
        )

    return None
