"""WebSocket room validation module.

This module provides functionality for validating room data and parameters.
"""

from typing import Any, Dict, Optional

from .constants import ErrorCodes, RoomTypes
from .log_config import logger
from .utils import format_error_response


class RoomValidation:
    """Room validation class."""

    def __init__(self):
        """Initialize RoomValidation."""
        self._validation_rules: Dict[str, Dict[str, Any]] = {
            RoomTypes.GAME: {
                "required_fields": ["game_type"],
                "optional_fields": ["time_limit", "score_limit", "team_size"],
                "field_types": {
                    "game_type": str,
                    "time_limit": int,
                    "score_limit": int,
                    "team_size": int,
                },
                "field_validators": {
                    "game_type": self._validate_game_type,
                    "time_limit": self._validate_time_limit,
                    "score_limit": self._validate_score_limit,
                    "team_size": self._validate_team_size,
                },
            },
            RoomTypes.TOURNAMENT: {
                "required_fields": ["tournament_type", "rounds"],
                "optional_fields": ["players_per_match", "elimination_type"],
                "field_types": {
                    "tournament_type": str,
                    "rounds": int,
                    "players_per_match": int,
                    "elimination_type": str,
                },
                "field_validators": {
                    "tournament_type": self._validate_tournament_type,
                    "rounds": self._validate_rounds,
                    "players_per_match": self._validate_players_per_match,
                    "elimination_type": self._validate_elimination_type,
                },
            },
            RoomTypes.CHAT: {
                "required_fields": [],
                "optional_fields": ["message_history", "user_limit", "moderation_level"],
                "field_types": {"message_history": int, "user_limit": int, "moderation_level": str},
                "field_validators": {
                    "message_history": self._validate_message_history,
                    "user_limit": self._validate_user_limit,
                    "moderation_level": self._validate_moderation_level,
                },
            },
        }

    def validate_room_creation(
        self, room_type: str, metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Validate room creation parameters.

        Args:
            room_type: Room type
            metadata: Optional room metadata

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        try:
            # Check room type
            if room_type not in self._validation_rules:
                return format_error_response(
                    ErrorCodes.INVALID_ROOM_TYPE, "Invalid room type", {"room_type": room_type}
                )

            # Get validation rules
            rules = self._validation_rules[room_type]

            # Check required fields
            if metadata:
                for field in rules["required_fields"]:
                    if field not in metadata:
                        return format_error_response(
                            ErrorCodes.MISSING_FIELD,
                            f"Missing required field: {field}",
                            {"field": field},
                        )

            # Validate fields
            if metadata:
                for field, value in metadata.items():
                    # Check if field is allowed
                    if field not in rules["required_fields"] + rules["optional_fields"]:
                        return format_error_response(
                            ErrorCodes.INVALID_FIELD, f"Invalid field: {field}", {"field": field}
                        )

                    # Check field type
                    expected_type = rules["field_types"].get(field)
                    if expected_type and not isinstance(value, expected_type):
                        return format_error_response(
                            ErrorCodes.INVALID_FIELD_TYPE,
                            f"Invalid type for field {field}",
                            {
                                "field": field,
                                "expected_type": expected_type.__name__,
                                "received_type": type(value).__name__,
                            },
                        )

                    # Validate field value
                    validator = rules["field_validators"].get(field)
                    if validator:
                        error = validator(value)
                        if error:
                            return error

            return None

        except Exception as e:
            logger.error(
                "Error validating room creation",
                exc_info=True,
                extra={"room_type": room_type, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error validating room creation",
                {"error": str(e)},
            )

    def validate_room_update(
        self, room_type: str, metadata: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Validate room update parameters.

        Args:
            room_type: Room type
            metadata: Room metadata

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        try:
            # Check room type
            if room_type not in self._validation_rules:
                return format_error_response(
                    ErrorCodes.INVALID_ROOM_TYPE, "Invalid room type", {"room_type": room_type}
                )

            # Get validation rules
            rules = self._validation_rules[room_type]

            # Validate fields
            for field, value in metadata.items():
                # Check if field is allowed
                if field not in rules["required_fields"] + rules["optional_fields"]:
                    return format_error_response(
                        ErrorCodes.INVALID_FIELD, f"Invalid field: {field}", {"field": field}
                    )

                # Check field type
                expected_type = rules["field_types"].get(field)
                if expected_type and not isinstance(value, expected_type):
                    return format_error_response(
                        ErrorCodes.INVALID_FIELD_TYPE,
                        f"Invalid type for field {field}",
                        {
                            "field": field,
                            "expected_type": expected_type.__name__,
                            "received_type": type(value).__name__,
                        },
                    )

                # Validate field value
                validator = rules["field_validators"].get(field)
                if validator:
                    error = validator(value)
                    if error:
                        return error

            return None

        except Exception as e:
            logger.error(
                "Error validating room update",
                exc_info=True,
                extra={"room_type": room_type, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error validating room update",
                {"error": str(e)},
            )

    def _validate_game_type(self, value: str) -> Optional[Dict[str, Any]]:
        """Validate game type.

        Args:
            value: Game type

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        valid_types = ["pool", "snooker", "carom"]
        if value not in valid_types:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid game type",
                {"field": "game_type", "value": value, "valid_values": valid_types},
            )
        return None

    def _validate_time_limit(self, value: int) -> Optional[Dict[str, Any]]:
        """Validate time limit.

        Args:
            value: Time limit in seconds

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        if value < 0 or value > 7200:  # Max 2 hours
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid time limit",
                {"field": "time_limit", "value": value, "min": 0, "max": 7200},
            )
        return None

    def _validate_score_limit(self, value: int) -> Optional[Dict[str, Any]]:
        """Validate score limit.

        Args:
            value: Score limit

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        if value < 1 or value > 1000:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid score limit",
                {"field": "score_limit", "value": value, "min": 1, "max": 1000},
            )
        return None

    def _validate_team_size(self, value: int) -> Optional[Dict[str, Any]]:
        """Validate team size.

        Args:
            value: Team size

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        if value < 1 or value > 4:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid team size",
                {"field": "team_size", "value": value, "min": 1, "max": 4},
            )
        return None

    def _validate_tournament_type(self, value: str) -> Optional[Dict[str, Any]]:
        """Validate tournament type.

        Args:
            value: Tournament type

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        valid_types = ["elimination", "round_robin", "swiss"]
        if value not in valid_types:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid tournament type",
                {"field": "tournament_type", "value": value, "valid_values": valid_types},
            )
        return None

    def _validate_rounds(self, value: int) -> Optional[Dict[str, Any]]:
        """Validate tournament rounds.

        Args:
            value: Number of rounds

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        if value < 1 or value > 10:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid number of rounds",
                {"field": "rounds", "value": value, "min": 1, "max": 10},
            )
        return None

    def _validate_players_per_match(self, value: int) -> Optional[Dict[str, Any]]:
        """Validate players per match.

        Args:
            value: Players per match

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        if value < 2 or value > 8:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid players per match",
                {"field": "players_per_match", "value": value, "min": 2, "max": 8},
            )
        return None

    def _validate_elimination_type(self, value: str) -> Optional[Dict[str, Any]]:
        """Validate elimination type.

        Args:
            value: Elimination type

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        valid_types = ["single", "double"]
        if value not in valid_types:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid elimination type",
                {"field": "elimination_type", "value": value, "valid_values": valid_types},
            )
        return None

    def _validate_message_history(self, value: int) -> Optional[Dict[str, Any]]:
        """Validate message history limit.

        Args:
            value: Message history limit

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        if value < 0 or value > 1000:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid message history limit",
                {"field": "message_history", "value": value, "min": 0, "max": 1000},
            )
        return None

    def _validate_user_limit(self, value: int) -> Optional[Dict[str, Any]]:
        """Validate user limit.

        Args:
            value: User limit

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        if value < 2 or value > 100:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid user limit",
                {"field": "user_limit", "value": value, "min": 2, "max": 100},
            )
        return None

    def _validate_moderation_level(self, value: str) -> Optional[Dict[str, Any]]:
        """Validate moderation level.

        Args:
            value: Moderation level

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        valid_levels = ["none", "low", "medium", "high"]
        if value not in valid_levels:
            return format_error_response(
                ErrorCodes.INVALID_VALUE,
                "Invalid moderation level",
                {"field": "moderation_level", "value": value, "valid_values": valid_levels},
            )
        return None


# Global room validation instance
room_validation = RoomValidation()
