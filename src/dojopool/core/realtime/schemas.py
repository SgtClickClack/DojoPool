"""WebSocket schemas module.

This module provides data validation schemas for WebSocket events.
"""

import re
from datetime import datetime
from typing import Any, Dict, Optional

from .constants import EventTypes, MessageTypes
from .errors import ValidationError

# Base schemas
PLAYER_SCHEMA = {
    "type": "object",
    "required": ["id", "name"],
    "properties": {
        "id": {"type": "string"},
        "name": {"type": "string", "minLength": 1, "maxLength": 50},
        "avatar": {"type": "string", "optional": True},
        "rating": {"type": "number", "optional": True},
    },
}

GAME_SCHEMA = {
    "type": "object",
    "required": ["id", "status", "players"],
    "properties": {
        "id": {"type": "string"},
        "status": {"type": "string", "enum": ["waiting", "active", "completed", "cancelled"]},
        "players": {"type": "array", "items": PLAYER_SCHEMA, "maxItems": 2},
        "scores": {
            "type": "object",
            "optional": True,
            "properties": {"player1": {"type": "number"}, "player2": {"type": "number"}},
        },
        "created_at": {"type": "string", "format": "datetime"},
        "started_at": {"type": "string", "format": "datetime", "optional": True},
        "ended_at": {"type": "string", "format": "datetime", "optional": True},
    },
}

TOURNAMENT_SCHEMA = {
    "type": "object",
    "required": ["id", "name", "status", "participants"],
    "properties": {
        "id": {"type": "string"},
        "name": {"type": "string", "minLength": 1, "maxLength": 100},
        "status": {"type": "string", "enum": ["registration", "active", "completed", "cancelled"]},
        "participants": {"type": "array", "items": PLAYER_SCHEMA},
        "max_participants": {"type": "number", "minimum": 2, "maximum": 128},
        "rounds": {
            "type": "array",
            "optional": True,
            "items": {
                "type": "object",
                "properties": {
                    "round_number": {"type": "number"},
                    "matches": {"type": "array", "items": GAME_SCHEMA},
                },
            },
        },
        "created_at": {"type": "string", "format": "datetime"},
        "started_at": {"type": "string", "format": "datetime", "optional": True},
        "ended_at": {"type": "string", "format": "datetime", "optional": True},
    },
}

CHAT_MESSAGE_SCHEMA = {
    "type": "object",
    "required": ["room_id", "message", "sender_id"],
    "properties": {
        "room_id": {"type": "string"},
        "message": {"type": "string", "minLength": 1, "maxLength": 1000},
        "sender_id": {"type": "string"},
        "message_type": {"type": "string", "enum": list(MessageTypes), "default": "chat"},
        "timestamp": {"type": "string", "format": "datetime"},
        "mentions": {"type": "array", "items": {"type": "string"}, "optional": True},
        "attachments": {"type": "array", "items": {"type": "string"}, "optional": True},
    },
}

# Event schemas
EVENT_SCHEMAS = {
    EventTypes.JOIN_GAME: {
        "type": "object",
        "required": ["game_id"],
        "properties": {
            "game_id": {"type": "string"},
            "user_data": {
                "type": "object",
                "optional": True,
                "properties": {
                    "name": {"type": "string", "minLength": 1, "maxLength": 50},
                    "avatar": {"type": "string", "optional": True},
                },
            },
        },
    },
    EventTypes.UPDATE_SCORE: {
        "type": "object",
        "required": ["game_id", "player1_score", "player2_score"],
        "properties": {
            "game_id": {"type": "string"},
            "player1_score": {"type": "number", "minimum": 0},
            "player2_score": {"type": "number", "minimum": 0},
        },
    },
    EventTypes.JOIN_TOURNAMENT: {
        "type": "object",
        "required": ["tournament_id"],
        "properties": {
            "tournament_id": {"type": "string"},
            "user_data": {
                "type": "object",
                "optional": True,
                "properties": {
                    "name": {"type": "string", "minLength": 1, "maxLength": 50},
                    "avatar": {"type": "string", "optional": True},
                    "rating": {"type": "number", "optional": True},
                },
            },
        },
    },
    EventTypes.CHAT_MESSAGE: CHAT_MESSAGE_SCHEMA,
}


def validate_event(event_type: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate event data against schema.

    Args:
        event_type: Type of event
        data: Event data to validate

    Returns:
        Optional[Dict[str, Any]]: Validated data if successful, None if validation fails

    Raises:
        ValidationError: If validation fails
    """
    schema = EVENT_SCHEMAS.get(event_type)
    if not schema:
        return data

    try:
        return validate_schema(data, schema)
    except ValidationError as e:
        raise ValidationError(f"Event validation failed: {str(e)}")


def validate_schema(data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
    """Validate data against schema.

    Args:
        data: Data to validate
        schema: Schema to validate against

    Returns:
        Dict[str, Any]: Validated data

    Raises:
        ValidationError: If validation fails
    """
    # Check type
    if schema["type"] == "object":
        if not isinstance(data, dict):
            raise ValidationError("Expected object")

        # Check required fields
        required = schema.get("required", [])
        for field in required:
            if field not in data:
                raise ValidationError(f"Missing required field: {field}")

        # Validate properties
        properties = schema.get("properties", {})
        validated = {}

        for field, value in data.items():
            if field not in properties:
                if not schema.get("additionalProperties", False):
                    raise ValidationError(f"Unknown field: {field}")
                validated[field] = value
                continue

            field_schema = properties[field]
            try:
                validated[field] = validate_schema(value, field_schema)
            except ValidationError as e:
                raise ValidationError(f"Invalid field {field}: {str(e)}")

        return validated

    elif schema["type"] == "array":
        if not isinstance(data, list):
            raise ValidationError("Expected array")

        # Check array length
        max_items = schema.get("maxItems")
        if max_items and len(data) > max_items:
            raise ValidationError(f"Array exceeds maximum length of {max_items}")

        # Validate items
        item_schema = schema.get("items", {})
        return [validate_schema(item, item_schema) for item in data]

    elif schema["type"] == "string":
        if not isinstance(data, str):
            raise ValidationError("Expected string")

        # Check string length
        min_length = schema.get("minLength")
        if min_length and len(data) < min_length:
            raise ValidationError(f"String length below minimum of {min_length}")

        max_length = schema.get("maxLength")
        if max_length and len(data) > max_length:
            raise ValidationError(f"String length exceeds maximum of {max_length}")

        # Check enum values
        enum = schema.get("enum")
        if enum and data not in enum:
            raise ValidationError(f"Value must be one of: {enum}")

        # Check format
        format_type = schema.get("format")
        if format_type == "datetime":
            try:
                datetime.fromisoformat(data.replace("Z", "+00:00"))
            except ValueError:
                raise ValidationError("Invalid datetime format")

        return data

    elif schema["type"] == "number":
        if not isinstance(data, (int, float)):
            raise ValidationError("Expected number")

        # Check range
        minimum = schema.get("minimum")
        if minimum is not None and data < minimum:
            raise ValidationError(f"Number below minimum of {minimum}")

        maximum = schema.get("maximum")
        if maximum is not None and data > maximum:
            raise ValidationError(f"Number exceeds maximum of {maximum}")

        return data

    elif schema["type"] == "boolean":
        if not isinstance(data, bool):
            raise ValidationError("Expected boolean")
        return data

    return data


def sanitize_event(event_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize event data.

    Args:
        event_type: Type of event
        data: Event data to sanitize

    Returns:
        Dict[str, Any]: Sanitized data
    """
    if event_type == EventTypes.CHAT_MESSAGE:
        # Sanitize chat message
        if "message" in data:
            # Remove control characters
            data["message"] = "".join(char for char in data["message"] if ord(char) >= 32)

            # Remove potentially dangerous Unicode characters
            data["message"] = re.sub(
                r"[\u202A-\u202E]", "", data["message"]
            )  # Bidirectional formatting
            data["message"] = re.sub(
                r"[\u200B-\u200F]", "", data["message"]
            )  # Zero-width characters

            # Trim whitespace
            data["message"] = data["message"].strip()

    return data
