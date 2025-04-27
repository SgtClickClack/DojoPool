"""Validation utilities.

This module provides validation helper functions.
"""

from datetime import time
from typing import List, Optional

from .base import ValidationResult


def validate_password_strength(password: str) -> ValidationResult:
    """Validate password strength.

    Args:
        password: Password to validate.

    Returns:
        ValidationResult: Result of validation.
    """
    errors = {}

    if len(password) < 8:
        errors["length"] = "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        errors["uppercase"] = "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        errors["lowercase"] = "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        errors["numbers"] = "Password must contain at least one number"
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        errors["special"] = "Password must contain at least one special character"

    return ValidationResult(
        is_valid=len(errors) == 0,
        data={"password": password} if len(errors) == 0 else None,
        errors=errors if errors else None,
    )


def validate_email_domain(
    email: str, allowed_domains: Optional[List[str]] = None
) -> ValidationResult:
    """Validate email domain.

    Args:
        email: Email to validate.
        allowed_domains: List of allowed domains.

    Returns:
        ValidationResult: Result of validation.
    """
    if not allowed_domains:
        return ValidationResult(is_valid=True, data={"email": email})

    try:
        domain = email.split("@")[1]
        if domain not in allowed_domains:
            return ValidationResult(
                is_valid=False, errors={"email": f"Domain {domain} is not allowed"}
            )
        return ValidationResult(is_valid=True, data={"email": email})
    except IndexError:
        return ValidationResult(is_valid=False, errors={"email": "Invalid email format"})


def validate_phone_number(phone: str) -> ValidationResult:
    """Validate phone number format.

    Args:
        phone: Phone number to validate.

    Returns:
        ValidationResult: Result of validation.
    """
    pattern = r"^\+?1?\d{9,15}$"
    if not re.match(pattern, phone):
        return ValidationResult(is_valid=False, errors={"phone": "Invalid phone number format"})
    return ValidationResult(is_valid=True, data={"phone": phone})


def validate_username(username: str) -> ValidationResult:
    """Validate username format.

    Args:
        username: Username to validate.

    Returns:
        ValidationResult: Result of validation.
    """
    errors = {}

    if len(username) < 3:
        errors["length"] = "Username must be at least 3 characters long"
    elif len(username) > 30:
        errors["length"] = "Username must be at most 30 characters long"

    if not username.isalnum():
        errors["format"] = "Username must contain only letters and numbers"

    return ValidationResult(
        is_valid=len(errors) == 0,
        data={"username": username} if len(errors) == 0 else None,
        errors=errors if errors else None,
    )


def validate_game_score(score: int, min_score: int = 0, max_score: int = 100) -> ValidationResult:
    """Validate game score.

    Args:
        score: Score to validate.
        min_score: Minimum allowed score.
        max_score: Maximum allowed score.

    Returns:
        ValidationResult: Result of validation.
    """
    if not isinstance(score, int):
        return ValidationResult(is_valid=False, errors={"score": "Score must be an integer"})

    if score < min_score or score > max_score:
        return ValidationResult(
            is_valid=False,
            errors={"score": f"Score must be between {min_score} and {max_score}"},
        )

    return ValidationResult(is_valid=True, data={"score": score})


def validate_game_type(game_type: str) -> ValidationResult:
    """Validate game type.

    Args:
        game_type: Game type to validate.

    Returns:
        ValidationResult: Result of validation.
    """
    valid_types = ["8ball", "9ball", "straight", "rotation"]
    if game_type not in valid_types:
        return ValidationResult(
            is_valid=False,
            errors={"game_type": f"Game type must be one of: {valid_types}"},
        )
    return ValidationResult(is_valid=True, data={"game_type": game_type})


def validate_time_slot(start_time: time, end_time: time) -> ValidationResult:
    """Validate time slot.

    Args:
        start_time: Start time.
        end_time: End time.

    Returns:
        ValidationResult: Result of validation.
    """
    if not isinstance(start_time, time) or not isinstance(end_time, time):
        return ValidationResult(
            is_valid=False, errors={"time": "Start and end times must be time objects"}
        )

    if start_time >= end_time:
        return ValidationResult(
            is_valid=False, errors={"time": "Start time must be before end time"}
        )

    return ValidationResult(is_valid=True, data={"start_time": start_time, "end_time": end_time})


def validate_player_handicap(handicap: float) -> ValidationResult:
    """Validate player handicap.

    Args:
        handicap: Handicap to validate.

    Returns:
        ValidationResult: Result of validation.
    """
    if not isinstance(handicap, (int, float)):
        return ValidationResult(is_valid=False, errors={"handicap": "Handicap must be a number"})

    if handicap < 0 or handicap > 10:
        return ValidationResult(
            is_valid=False, errors={"handicap": "Handicap must be between 0 and 10"}
        )

    return ValidationResult(is_valid=True, data={"handicap": handicap})


def validate_tournament_bracket_size(size: int) -> ValidationResult:
    """Validate tournament bracket size.

    Args:
        size: Bracket size to validate.

    Returns:
        ValidationResult: Result of validation.
    """
    valid_sizes = [2, 4, 8, 16, 32, 64]
    if size not in valid_sizes:
        return ValidationResult(
            is_valid=False,
            errors={"size": f"Bracket size must be one of: {valid_sizes}"},
        )
    return ValidationResult(is_valid=True, data={"size": size})


def validate_race_to(race_to: int, min_games: int = 1, max_games: int = 25) -> ValidationResult:
    """Validate race to games.

    Args:
        race_to: Number of games to race to.
        min_games: Minimum number of games.
        max_games: Maximum number of games.

    Returns:
        ValidationResult: Result of validation.
    """
    if not isinstance(race_to, int):
        return ValidationResult(
            is_valid=False, errors={"race_to": "Race to value must be an integer"}
        )

    if race_to < min_games or race_to > max_games:
        return ValidationResult(
            is_valid=False,
            errors={"race_to": f"Race to value must be between {min_games} and {max_games}"},
        )

    return ValidationResult(is_valid=True, data={"race_to": race_to})
