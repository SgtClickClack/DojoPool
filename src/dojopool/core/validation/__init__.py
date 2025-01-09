"""Validation module.

This module provides validation utilities and schemas for the application.
"""

from .base import BaseValidator, ValidationResult
from .validators import (
    UserValidator,
    VenueValidator,
    GameValidator,
    AchievementValidator,
    UserAchievementValidator,
)
from .decorators import validate_with
from .schemas import (
    UserSchema,
    LoginSchema,
    GameSettingsSchema,
    PaginationSchema,
    DateRangeSchema,
    GameScoreSchema,
    TimeSlotSchema,
    PlayerHandicapSchema,
    TournamentSchema,
    MatchSchema,
)
from .utils import (
    validate_password_strength,
    validate_email_domain,
    validate_phone_number,
    validate_username,
    validate_game_score,
    validate_game_type,
    validate_time_slot,
    validate_player_handicap,
    validate_tournament_bracket_size,
    validate_race_to,
)

__all__ = [
    "BaseValidator",
    "ValidationResult",
    "validate_with",
    "UserValidator",
    "VenueValidator",
    "GameValidator",
    "AchievementValidator",
    "UserAchievementValidator",
    "UserSchema",
    "LoginSchema",
    "GameSettingsSchema",
    "PaginationSchema",
    "DateRangeSchema",
    "GameScoreSchema",
    "TimeSlotSchema",
    "PlayerHandicapSchema",
    "TournamentSchema",
    "MatchSchema",
    "validate_password_strength",
    "validate_email_domain",
    "validate_phone_number",
    "validate_username",
    "validate_game_score",
    "validate_game_type",
    "validate_time_slot",
    "validate_player_handicap",
    "validate_tournament_bracket_size",
    "validate_race_to",
]
