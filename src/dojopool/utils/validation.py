"""Validation utilities for request data."""

from typing import Any, Dict, List, Optional
from datetime import datetime
import re


def validate_request_data(
    data: Optional[Dict[str, Any]], required_fields: List[str]
) -> Dict[str, Any]:
    """Validate request data against required fields.

    Args:
        data: Request data to validate
        required_fields: List of required field names

    Returns:
        Dict with validation result
    """
    if not data:
        return {"status": "error", "error": "No data provided", "code": "VALIDATION_ERROR"}

    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return {
            "status": "error",
            "error": f'Missing required fields: {", ".join(missing_fields)}',
            "code": "VALIDATION_ERROR",
        }

    return {"status": "success"}


def validate_match_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate match data
    """
    required_fields = ["opponent_id", "venue_id"]
    validation = validate_request_data(data, required_fields)
    if validation.get("error"):
        return validation

    # Additional match-specific validation
    if not isinstance(data["opponent_id"], str):
        return {"error": "Invalid opponent_id format"}
    if not isinstance(data["venue_id"], str):
        return {"error": "Invalid venue_id format"}

    return {"valid": True}


def validate_shot_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate shot data
    """
    required_fields = ["power", "angle", "spin", "english", "result"]
    validation = validate_request_data(data, required_fields)
    if validation.get("error"):
        return validation

    # Validate numeric ranges
    if not 0 <= data["power"] <= 100:
        return {"error": "Power must be between 0 and 100"}
    if not -180 <= data["angle"] <= 180:
        return {"error": "Angle must be between -180 and 180"}
    if not -100 <= data["spin"] <= 100:
        return {"error": "Spin must be between -100 and 100"}
    if not -100 <= data["english"] <= 100:
        return {"error": "English must be between -100 and 100"}
    if not isinstance(data["result"], bool):
        return {"error": "Result must be a boolean"}

    return {"valid": True}


def validate_profile_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate profile update data
    """
    allowed_fields = ["username", "avatar_url", "preferences"]
    update_fields = [field for field in data.keys() if field in allowed_fields]

    if not update_fields:
        return {"error": "No valid fields to update", "allowed_fields": allowed_fields}

    # Validate username if present
    if "username" in data:
        if not isinstance(data["username"], str):
            return {"error": "Username must be a string"}
        if len(data["username"]) < 3 or len(data["username"]) > 30:
            return {"error": "Username must be between 3 and 30 characters"}

    # Validate avatar_url if present
    if "avatar_url" in data:
        if not isinstance(data["avatar_url"], str):
            return {"error": "Avatar URL must be a string"}
        if not data["avatar_url"].startswith(("http://", "https://")):
            return {"error": "Invalid avatar URL format"}

    # Validate preferences if present
    if "preferences" in data:
        if not isinstance(data["preferences"], dict):
            return {"error": "Preferences must be an object"}

    return {"valid": True}


def validate_offline_sync_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate offline sync data
    """
    required_fields = ["matches", "shots", "checkins"]
    validation = validate_request_data(data, required_fields)
    if validation.get("error"):
        return validation

    # Validate data types
    if not isinstance(data["matches"], list):
        return {"error": "Matches must be an array"}
    if not isinstance(data["shots"], list):
        return {"error": "Shots must be an array"}
    if not isinstance(data["checkins"], list):
        return {"error": "Checkins must be an array"}

    # Validate individual items
    for match in data["matches"]:
        match_validation = validate_match_data(match)
        if match_validation.get("error"):
            return {
                "error": f"Invalid match data: {match_validation['error']}",
                "invalid_match": match,
            }

    for shot in data["shots"]:
        shot_validation = validate_shot_data(shot)
        if shot_validation.get("error"):
            return {"error": f"Invalid shot data: {shot_validation['error']}", "invalid_shot": shot}

    for checkin in data["checkins"]:
        if "venue_id" not in checkin:
            return {"error": "Missing venue_id in checkin data", "invalid_checkin": checkin}

    return {"valid": True}


def validate_location_data(
    lat: Optional[float], lng: Optional[float], radius: Optional[float] = None
) -> Dict[str, Any]:
    """
    Validate location data
    """
    if lat is None or lng is None:
        return {"error": "Latitude and longitude are required"}

    if not -90 <= lat <= 90:
        return {"error": "Invalid latitude value"}
    if not -180 <= lng <= 180:
        return {"error": "Invalid longitude value"}

    if radius is not None:
        if radius <= 0:
            return {"error": "Radius must be positive"}
        if radius > 100:  # Maximum 100km radius
            return {"error": "Radius too large (maximum 100km)"}

    return {"valid": True}


def validate_timestamp(timestamp: str) -> Dict[str, Any]:
    """
    Validate timestamp format
    """
    try:
        datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        return {"valid": True}
    except (ValueError, AttributeError):
        return {"error": "Invalid timestamp format"}


def validate_power_up_data(data: dict) -> tuple[bool, str]:
    """Validate power-up data.

    Args:
        data: Dictionary containing power-up data
            - type: Power-up type (str)
            - quantity: Quantity to purchase (int, optional)

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not data:
        return False, "No data provided"

    if "type" not in data:
        return False, "Power-up type is required"

    if not isinstance(data["type"], str):
        return False, "Power-up type must be a string"

    if "quantity" in data:
        if not isinstance(data["quantity"], int):
            return False, "Quantity must be an integer"
        if data["quantity"] <= 0:
            return False, "Quantity must be greater than 0"

    return True, ""


def validate_coordinates(lat: float, lng: float) -> bool:
    """Validate latitude and longitude coordinates.

    Args:
        lat: Latitude value
        lng: Longitude value

    Returns:
        bool: True if coordinates are valid, False otherwise
    """
    try:
        if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
            return False

        if not -90 <= lat <= 90:
            return False

        if not -180 <= lng <= 180:
            return False

        return True
    except (TypeError, ValueError):
        return False


def validate_phone(phone: str) -> bool:
    """
    Validate phone number format.

    Accepts formats:
    - +1-XXX-XXX-XXXX
    - (XXX) XXX-XXXX
    - XXX-XXX-XXXX
    - XXXXXXXXXX
    """
    # Remove all non-numeric characters
    digits = re.sub(r"\D", "", phone)

    # Check length (10 digits for US numbers, or 11 with country code)
    if len(digits) not in [10, 11]:
        return False

    # If 11 digits, first must be 1 (US country code)
    if len(digits) == 11 and digits[0] != "1":
        return False

    return True


def validate_address(address: str) -> bool:
    """
    Validate address format.

    Basic validation to ensure address has:
    - Street number and name
    - City
    - State
    - ZIP code
    """
    # Basic pattern for US addresses
    pattern = r"^(\d+)\s+([A-Za-z0-9\s\.-]+),\s*([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)"

    return bool(re.match(pattern, address))


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_url(url: str) -> bool:
    """Validate URL format."""
    pattern = r"^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$"
    return bool(re.match(pattern, url))


def validate_business_hours(hours: str) -> bool:
    """Validate business hours format (HH:MM-HH:MM)."""
    pattern = r"^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$"
    return bool(re.match(pattern, hours))


def validate_zip_code(zip_code: str) -> bool:
    """Validate US ZIP code format."""
    pattern = r"^\d{5}(-\d{4})?$"
    return bool(re.match(pattern, zip_code))


def validate_ein(ein: str) -> bool:
    """Validate US Employer Identification Number format."""
    pattern = r"^\d{2}-\d{7}$"
    return bool(re.match(pattern, ein))


def validate_license_number(license_number: str) -> bool:
    """
    Validate business license number format.
    Basic validation - actual format may vary by jurisdiction.
    """
    # Remove spaces and special characters
    cleaned = re.sub(r"[\s\-\.]", "", license_number)
    return len(cleaned) >= 5 and cleaned.isalnum()


def validate_insurance_policy(policy_number: str) -> bool:
    """
    Validate insurance policy number format.
    Basic validation - actual format may vary by provider.
    """
    # Remove spaces and special characters
    cleaned = re.sub(r"[\s\-\.]", "", policy_number)
    return len(cleaned) >= 6 and cleaned.isalnum()
