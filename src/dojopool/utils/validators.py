import re
from datetime import datetime
from functools import wraps
from typing import Any, Dict, List, Optional, Tuple, Union

from flask import jsonify, request
from marshmallow import Schema, ValidationError, fields


class BaseSchema(Schema):
    pass


class UserSchema(BaseSchema):
    username = fields.Str(required=True, validate=lambda x: len(x) >= 3)
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=lambda x: len(x) >= 8)


class GameSchema(BaseSchema):
    venue_id = fields.Int(required=True)
    player_ids = fields.List(fields.Int(), required=True)
    game_type = fields.Str(required=True)
    score = fields.Dict(keys=fields.Int(), values=fields.Int())


def validate_schema(schema_class):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            schema = schema_class()
            try:
                if request.is_json:
                    data = schema.load(request.get_json())
                else:
                    data = schema.load(request.form.to_dict())
                return f(*args, validated_data=data, **kwargs)
            except ValidationError as err:
                return jsonify({"errors": err.messages}), 400

        return decorated_function

    return decorator


def sanitize_input(data):
    """Basic input sanitization"""
    if isinstance(data, str):
        # Remove potential script tags
        data = data.replace("<script>", "").replace("</script>", "")
        # Escape HTML entities
        data = data.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        return data
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(x) for x in data]
    return data


def validate_tournament_data(data: Dict[str, Any], update: bool = False) -> List[str]:
    """Validate tournament data.

    Args:
        data: Tournament data to validate.
        update: Whether this is an update operation.

    Returns:
        List of error messages, empty if validation passes.
    """
    errors = []

    # Required fields for new tournaments
    if not update:
        required_fields = ["name", "start_date", "end_date"]
        for field in required_fields:
            if field not in data:
                errors.append(f"{field} is required")

    # Validate name if present
    if "name" in data:
        if not isinstance(data["name"], str):
            errors.append("name must be a string")
        elif len(data["name"]) < 3:
            errors.append("name must be at least 3 characters")
        elif len(data["name"]) > 100:
            errors.append("name must be at most 100 characters")

    # Validate dates if present
    if "start_date" in data and "end_date" in data:
        try:
            start = datetime.fromisoformat(data["start_date"])
            end = datetime.fromisoformat(data["end_date"])
            if start >= end:
                errors.append("end_date must be after start_date")
            if start < datetime.now():
                errors.append("start_date cannot be in the past")
        except ValueError:
            errors.append("Invalid date format. Use ISO format (YYYY-MM-DD)")

    # Validate numeric fields if present
    if "max_players" in data:
        try:
            max_players = int(data["max_players"])
            if max_players < 2:
                errors.append("max_players must be at least 2")
            elif max_players > 128:
                errors.append("max_players must be at most 128")
        except (ValueError, TypeError):
            errors.append("max_players must be a number")

    if "entry_fee" in data:
        try:
            entry_fee = float(data["entry_fee"])
            if entry_fee < 0:
                errors.append("entry_fee cannot be negative")
        except (ValueError, TypeError):
            errors.append("entry_fee must be a number")

    if "prize_pool" in data:
        try:
            prize_pool = float(data["prize_pool"])
            if prize_pool < 0:
                errors.append("prize_pool cannot be negative")
        except (ValueError, TypeError):
            errors.append("prize_pool must be a number")

    # Validate format if present
    if "format" in data:
        valid_formats = ["single_elimination", "double_elimination", "round_robin"]
        if data["format"] not in valid_formats:
            errors.append(f'format must be one of: {", ".join(valid_formats)}')

    # Validate rules if present
    if "rules" in data:
        if not isinstance(data["rules"], dict):
            errors.append("rules must be an object")
        else:
            # Validate specific rule fields
            rules = data["rules"]

            if "game_type" in rules:
                valid_types = ["8-ball", "9-ball", "straight"]
                if rules["game_type"] not in valid_types:
                    errors.append(f'game_type must be one of: {", ".join(valid_types)}')

            if "race_to" in rules:
                try:
                    race_to = int(rules["race_to"])
                    if race_to < 1:
                        errors.append("race_to must be at least 1")
                except (ValueError, TypeError):
                    errors.append("race_to must be a number")

            if "time_limit" in rules:
                try:
                    time_limit = int(rules["time_limit"])
                    if time_limit < 0:
                        errors.append("time_limit cannot be negative")
                except (ValueError, TypeError):
                    errors.append("time_limit must be a number")

    return errors


def validate_coordinates(latitude: Optional[float], longitude: Optional[float]) -> bool:
    """
    Validate geographic coordinates.

    Args:
        latitude: Latitude value between -90 and 90
        longitude: Longitude value between -180 and 180

    Returns:
        bool: True if coordinates are valid, False otherwise
    """
    if latitude is None or longitude is None:
        return False

    try:
        lat = float(latitude)
        lng = float(longitude)
        return -90 <= lat <= 90 and -180 <= lng <= 180
    except (ValueError, TypeError):
        return False


def validate_email(email: str) -> bool:
    """
    Validate email address format.

    Args:
        email: Email address to validate

    Returns:
        bool: True if email is valid, False otherwise
    """
    if not email:
        return False

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """
    Validate phone number format.

    Args:
        phone: Phone number to validate

    Returns:
        bool: True if phone number is valid, False otherwise
    """
    if not phone:
        return False

    # Remove any non-digit characters
    digits = re.sub(r"\D", "", phone)
    # Check if we have 10-15 digits
    return 10 <= len(digits) <= 15


def validate_url(url: str) -> bool:
    """
    Validate URL format.

    Args:
        url: URL to validate

    Returns:
        bool: True if URL is valid, False otherwise
    """
    if not url:
        return False

    pattern = r"^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$"
    return bool(re.match(pattern, url))


def validate_postal_code(postal_code: str, country: str = "US") -> bool:
    """
    Validate postal code format for different countries.

    Args:
        postal_code: Postal code to validate
        country: Country code (default: 'US')

    Returns:
        bool: True if postal code is valid, False otherwise
    """
    if not postal_code:
        return False

    patterns = {
        "US": r"^\d{5}(-\d{4})?$",  # US ZIP code
        "CA": r"^[A-Z]\d[A-Z] \d[A-Z]\d$",  # Canadian postal code
        "GB": r"^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$",  # UK postcode
        "default": r"^[0-9A-Z]{3,10}$",  # Generic alphanumeric
    }

    pattern = patterns.get(country.upper(), patterns["default"])
    return bool(re.match(pattern, postal_code.upper()))


def validate_date_range(
    start_date: Union[str, datetime], end_date: Union[str, datetime]
) -> Tuple[bool, Optional[str]]:
    """
    Validate a date range.

    Args:
        start_date: Start date (string or datetime)
        end_date: End date (string or datetime)

    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    try:
        if isinstance(start_date, str):
            start = datetime.fromisoformat(start_date)
        else:
            start = start_date

        if isinstance(end_date, str):
            end = datetime.fromisoformat(end_date)
        else:
            end = end_date

        if start > end:
            return False, "Start date must be before end date"

        return True, None
    except ValueError:
        return False, "Invalid date format"


def validate_rating(rating: Union[int, float]) -> bool:
    """
    Validate rating value.

    Args:
        rating: Rating value to validate

    Returns:
        bool: True if rating is valid, False otherwise
    """
    try:
        value = float(rating)
        return 0 <= value <= 5
    except (ValueError, TypeError):
        return False


def validate_hours_format(hours: dict) -> Tuple[bool, Optional[str]]:
    """
    Validate venue hours format.

    Args:
        hours: Dictionary of operating hours

    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    time_pattern = r"^([01]\d|2[0-3]):([0-5]\d)$"

    if not isinstance(hours, dict):
        return False, "Hours must be a dictionary"

    for day in days:
        if day not in hours:
            return False, f"Missing hours for {day}"

        day_hours = hours[day]
        if not isinstance(day_hours, dict) or "open" not in day_hours or "close" not in day_hours:
            return False, f"Invalid format for {day}"

        if not re.match(time_pattern, day_hours["open"]) or not re.match(
            time_pattern, day_hours["close"]
        ):
            return False, f"Invalid time format for {day}"

        # Validate that open time is before close time
        open_time = datetime.strptime(day_hours["open"], "%H:%M")
        close_time = datetime.strptime(day_hours["close"], "%H:%M")
        if open_time >= close_time:
            return False, f"Open time must be before close time for {day}"

    return True, None


def validate_features(features: list) -> Tuple[bool, Optional[str]]:
    """
    Validate venue features list.

    Args:
        features: List of venue features

    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    valid_features = {
        "parking",
        "food_service",
        "bar",
        "tournaments",
        "lessons",
        "equipment_rental",
        "wifi",
        "air_conditioning",
        "pro_shop",
        "billiards_supplies",
        "snooker_tables",
        "pool_tables",
        "dart_boards",
        "arcade_games",
        "smoking_area",
        "outdoor_seating",
        "private_rooms",
        "event_space",
        "live_music",
        "tv_screens",
    }

    if not isinstance(features, list):
        return False, "Features must be a list"

    invalid_features = [f for f in features if f not in valid_features]
    if invalid_features:
        return False, f"Invalid features: {', '.join(invalid_features)}"

    return True, None
