"""Validation utilities for DojoPool."""

import re
from typing import Any, Dict, List, Optional, Pattern, Union
from marshmallow import ValidationError
from flask import current_app, request
from datetime import datetime, time
from . import BaseValidator, ValidationResult

def validate_request_args(schema_cls: Any) -> Dict[str, Any]:
    """Validate request query parameters.
    
    Args:
        schema_cls: Marshmallow schema class
        
    Returns:
        Validated data
        
    Raises:
        ValidationError: If validation fails
    """
    validator = BaseValidator(schema_cls)
    return validator.validate_or_fail(request.args)

def validate_request_json(schema_cls: Any) -> Dict[str, Any]:
    """Validate request JSON data.
    
    Args:
        schema_cls: Marshmallow schema class
        
    Returns:
        Validated data
        
    Raises:
        ValidationError: If validation fails
    """
    if not request.is_json:
        raise ValidationError("Request must be JSON")
    
    validator = BaseValidator(schema_cls)
    return validator.validate_or_fail(request.get_json())

def validate_request_form(schema_cls: Any) -> Dict[str, Any]:
    """Validate request form data.
    
    Args:
        schema_cls: Marshmallow schema class
        
    Returns:
        Validated data
        
    Raises:
        ValidationError: If validation fails
    """
    validator = BaseValidator(schema_cls)
    return validator.validate_or_fail(request.form)

def validate_request_files(allowed_extensions: Optional[List[str]] = None) -> None:
    """Validate uploaded files.
    
    Args:
        allowed_extensions: List of allowed file extensions
        
    Raises:
        ValidationError: If validation fails
    """
    if not request.files:
        raise ValidationError("No files uploaded")
    
    if allowed_extensions:
        for file in request.files.values():
            if not file.filename:
                continue
            
            ext = file.filename.rsplit('.', 1)[1].lower()
            if ext not in allowed_extensions:
                raise ValidationError(
                    f"File extension '{ext}' not allowed. "
                    f"Allowed extensions: {', '.join(allowed_extensions)}"
                )

def validate_password_strength(
    password: str,
    min_length: int = 8,
    require_uppercase: bool = True,
    require_lowercase: bool = True,
    require_numbers: bool = True,
    require_special: bool = True
) -> ValidationResult:
    """Validate password strength.
    
    Args:
        password: Password to validate
        min_length: Minimum password length
        require_uppercase: Require uppercase letters
        require_lowercase: Require lowercase letters
        require_numbers: Require numbers
        require_special: Require special characters
        
    Returns:
        Validation result
    """
    errors = {}
    
    if len(password) < min_length:
        errors['length'] = f"Password must be at least {min_length} characters"
    
    if require_uppercase and not re.search(r'[A-Z]', password):
        errors['uppercase'] = "Password must contain uppercase letters"
    
    if require_lowercase and not re.search(r'[a-z]', password):
        errors['lowercase'] = "Password must contain lowercase letters"
    
    if require_numbers and not re.search(r'\d', password):
        errors['numbers'] = "Password must contain numbers"
    
    if require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors['special'] = "Password must contain special characters"
    
    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )

def validate_email_domain(email: str, allowed_domains: Optional[List[str]] = None) -> ValidationResult:
    """Validate email domain.
    
    Args:
        email: Email to validate
        allowed_domains: List of allowed domains
        
    Returns:
        Validation result
    """
    if not allowed_domains:
        allowed_domains = current_app.config.get('ALLOWED_EMAIL_DOMAINS', [])
    
    if not allowed_domains:
        return ValidationResult(is_valid=True)
    
    domain = email.split('@')[1].lower()
    if domain not in allowed_domains:
        return ValidationResult(
            is_valid=False,
            errors={'email': f"Email domain '{domain}' not allowed"}
        )
    
    return ValidationResult(is_valid=True)

def validate_phone_number(
    phone: str,
    country_code: str = 'US',
    pattern: Optional[Pattern] = None
) -> ValidationResult:
    """Validate phone number.
    
    Args:
        phone: Phone number to validate
        country_code: Country code for validation
        pattern: Custom regex pattern
        
    Returns:
        Validation result
    """
    if pattern is None:
        # Default US phone pattern
        pattern = re.compile(r'^\+?1?\d{9,15}$')
    
    if not pattern.match(phone):
        return ValidationResult(
            is_valid=False,
            errors={'phone': "Invalid phone number format"}
        )
    
    return ValidationResult(is_valid=True)

def validate_username(
    username: str,
    min_length: int = 3,
    max_length: int = 30,
    pattern: Optional[Pattern] = None
) -> ValidationResult:
    """Validate username.
    
    Args:
        username: Username to validate
        min_length: Minimum username length
        max_length: Maximum username length
        pattern: Custom regex pattern
        
    Returns:
        Validation result
    """
    errors = {}
    
    if len(username) < min_length:
        errors['length'] = f"Username must be at least {min_length} characters"
    
    if len(username) > max_length:
        errors['length'] = f"Username must be at most {max_length} characters"
    
    if pattern and not pattern.match(username):
        errors['format'] = "Invalid username format"
    
    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )

def validate_game_score(
    score: Union[int, str],
    min_score: int = 0,
    max_score: int = 100,
    game_type: Optional[str] = None
) -> ValidationResult:
    """Validate game score.
    
    Args:
        score: Score to validate
        min_score: Minimum allowed score
        max_score: Maximum allowed score
        game_type: Optional game type for specific validation rules
        
    Returns:
        Validation result
    """
    errors = {}
    
    try:
        score_int = int(score)
        
        if score_int < min_score:
            errors['range'] = f"Score must be at least {min_score}"
        
        if score_int > max_score:
            errors['range'] = f"Score must be at most {max_score}"
        
        if game_type:
            if game_type == '8-ball' and score_int not in [0, 1]:
                errors['game_type'] = "8-ball score must be 0 (loss) or 1 (win)"
            elif game_type == '9-ball' and score_int not in range(10):
                errors['game_type'] = "9-ball score must be between 0 and 9"
            elif game_type == 'straight' and score_int not in range(15):
                errors['game_type'] = "Straight pool score must be between 0 and 14"
    except (TypeError, ValueError):
        errors['type'] = "Score must be a valid integer"
    
    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )

def validate_game_type(game_type: str) -> ValidationResult:
    """Validate game type.
    
    Args:
        game_type: Game type to validate
        
    Returns:
        Validation result
    """
    valid_types = {'8-ball', '9-ball', 'straight', 'rotation', 'one-pocket', 'bank-pool'}
    
    if game_type not in valid_types:
        return ValidationResult(
            is_valid=False,
            errors={'game_type': f"Invalid game type. Must be one of: {', '.join(sorted(valid_types))}"}
        )
    
    return ValidationResult(is_valid=True)

def validate_time_slot(
    start_time: Union[str, time],
    end_time: Union[str, time],
    min_duration: int = 30,  # minutes
    max_duration: int = 240  # minutes
) -> ValidationResult:
    """Validate time slot for game scheduling.
    
    Args:
        start_time: Start time
        end_time: End time
        min_duration: Minimum duration in minutes
        max_duration: Maximum duration in minutes
        
    Returns:
        Validation result
    """
    errors = {}
    
    try:
        if isinstance(start_time, str):
            start = datetime.strptime(start_time, '%H:%M').time()
        else:
            start = start_time
        
        if isinstance(end_time, str):
            end = datetime.strptime(end_time, '%H:%M').time()
        else:
            end = end_time
        
        # Convert times to minutes for easier comparison
        start_minutes = start.hour * 60 + start.minute
        end_minutes = end.hour * 60 + end.minute
        
        # Handle case where end time is on the next day
        if end_minutes < start_minutes:
            end_minutes += 24 * 60
        
        duration = end_minutes - start_minutes
        
        if duration < min_duration:
            errors['duration'] = f"Time slot must be at least {min_duration} minutes"
        
        if duration > max_duration:
            errors['duration'] = f"Time slot must be at most {max_duration} minutes"
            
    except ValueError:
        errors['format'] = "Invalid time format. Use HH:MM"
    
    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )

def validate_player_handicap(
    handicap: Union[int, float, str],
    min_handicap: float = 0.0,
    max_handicap: float = 10.0
) -> ValidationResult:
    """Validate player handicap.
    
    Args:
        handicap: Handicap to validate
        min_handicap: Minimum allowed handicap
        max_handicap: Maximum allowed handicap
        
    Returns:
        Validation result
    """
    errors = {}
    
    try:
        handicap_float = float(handicap)
        
        if handicap_float < min_handicap:
            errors['range'] = f"Handicap must be at least {min_handicap}"
        
        if handicap_float > max_handicap:
            errors['range'] = f"Handicap must be at most {max_handicap}"
            
    except (TypeError, ValueError):
        errors['type'] = "Handicap must be a valid number"
    
    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )

def validate_tournament_bracket_size(size: int) -> ValidationResult:
    """Validate tournament bracket size.
    
    Args:
        size: Number of players in the bracket
        
    Returns:
        Validation result
    """
    valid_sizes = {2, 4, 8, 16, 32, 64}
    
    if size not in valid_sizes:
        return ValidationResult(
            is_valid=False,
            errors={'size': f"Invalid bracket size. Must be one of: {', '.join(map(str, sorted(valid_sizes)))}"}
        )
    
    return ValidationResult(is_valid=True)

def validate_race_to(
    race_to: int,
    game_type: Optional[str] = None,
    min_races: int = 1,
    max_races: int = 25
) -> ValidationResult:
    """Validate race length for matches.
    
    Args:
        race_to: Number of games to win
        game_type: Optional game type for specific validation rules
        min_races: Minimum number of races
        max_races: Maximum number of races
        
    Returns:
        Validation result
    """
    errors = {}
    
    try:
        if race_to < min_races:
            errors['range'] = f"Race must be at least {min_races}"
        
        if race_to > max_races:
            errors['range'] = f"Race must be at most {max_races}"
        
        if game_type == 'one-pocket' and race_to > 10:
            errors['game_type'] = "One-pocket races should not exceed 10"
            
    except (TypeError, ValueError):
        errors['type'] = "Race length must be a valid integer"
    
    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    ) 