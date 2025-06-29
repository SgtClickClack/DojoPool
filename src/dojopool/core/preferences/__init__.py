"""Preferences module."""

from datetime import datetime
from typing import Any, Dict, Optional

from dojopool.core.exceptions import PreferencesError
from dojopool.models.user import User
from dojopool.extensions import db


class PreferencesService:
    """Preferences service."""

    def __init__(self):
        """Initialize preferences service."""
        self.default_preferences = {
            "notifications": {
                "email": True,
                "push": True,
                "game_invites": True,
                "tournament_invites": True,
                "friend_requests": True,
                "game_updates": True,
                "tournament_updates": True,
            },
            "privacy": {
                "show_online_status": True,
                "show_game_history": True,
                "show_stats": True,
                "show_achievements": True,
                "allow_friend_requests": True,
                "allow_game_invites": True,
                "allow_tournament_invites": True,
            },
            "display": {
                "theme": "light",
                "language": "en",
                "timezone": "UTC",
                "date_format": "YYYY-MM-DD",
                "time_format": "24h",
            },
            "game": {
                "auto_accept_rematch": False,
                "show_timer": True,
                "show_shot_clock": True,
                "show_hints": True,
                "show_stats_during_game": True,
                "auto_record_shots": True,
            },
        }

    def get_preferences(self, user_id: int) -> Dict[str, Any]:
        """Get user preferences.

        Args:
            user_id: User ID

        Returns:
            User preferences

        Raises:
            PreferencesError: If preferences cannot be retrieved
        """
        user = User.query.get(user_id)
        if not user:
            raise PreferencesError("User not found")

        # Merge user preferences with defaults
        preferences = self.default_preferences.copy()
        if user.preferences:
            self._deep_update(preferences, user.preferences)

        return preferences

    def update_preferences(self, user_id: int, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Update user preferences.

        Args:
            user_id: User ID
            preferences: New preferences

        Returns:
            Updated preferences

        Raises:
            PreferencesError: If preferences cannot be updated
        """
        user = User.query.get(user_id)
        if not user:
            raise PreferencesError("User not found")

        # Validate preferences
        if not self._validate_preferences(preferences):
            raise PreferencesError("Invalid preferences")

        # Merge with existing preferences
        current_preferences = self.get_preferences(user_id)
        self._deep_update(current_preferences, preferences)

        # Update user preferences
        user.preferences = current_preferences
        user.preferences_updated_at = datetime.utcnow()
        db.session.commit()

        return current_preferences

    def reset_preferences(self, user_id: int) -> Dict[str, Any]:
        """Reset user preferences to defaults.

        Args:
            user_id: User ID

        Returns:
            Default preferences

        Raises:
            PreferencesError: If preferences cannot be reset
        """
        user = User.query.get(user_id)
        if not user:
            raise PreferencesError("User not found")

        user.preferences = self.default_preferences.copy()
        user.preferences_updated_at = datetime.utcnow()
        db.session.commit()

        return user.preferences

    def get_preference(self, user_id: int, path: str, default: Any = None) -> Any:
        """Get specific preference value.

        Args:
            user_id: User ID
            path: Preference path (e.g. 'notifications.email')
            default: Default value if not found

        Returns:
            Preference value

        Raises:
            PreferencesError: If preference cannot be retrieved
        """
        preferences = self.get_preferences(user_id)

        # Navigate preference path
        value = preferences
        for key in path.split("."):
            if not isinstance(value, dict) or key not in value:
                return default
            value = value[key]

        return value

    def set_preference(self, user_id: int, path: str, value: Any) -> Dict[str, Any]:
        """Set specific preference value.

        Args:
            user_id: User ID
            path: Preference path (e.g. 'notifications.email')
            value: New value

        Returns:
            Updated preferences

        Raises:
            PreferencesError: If preference cannot be set
        """
        preferences = self.get_preferences(user_id)

        # Navigate and update preference path
        current = preferences
        keys = path.split(".")
        for key in keys[:-1]:
            if not isinstance(current, dict) or key not in current:
                current[key] = {}
            current = current[key]

        current[keys[-1]] = value

        return self.update_preferences(user_id, preferences)

    def _deep_update(self, target: Dict, source: Dict) -> None:
        """Deep update dictionary.

        Args:
            target: Target dictionary
            source: Source dictionary
        """
        for key, value in source.items():
            if key in target and isinstance(target[key], dict):
                if isinstance(value, dict):
                    self._deep_update(target[key], value)
                    continue
            target[key] = value

    def _validate_preferences(self, preferences: Dict[str, Any]) -> bool:
        """Validate preferences structure.

        Args:
            preferences: Preferences to validate

        Returns:
            True if valid
        """
        # TODO: Implement proper validation
        return True


preferences_service = PreferencesService()

__all__ = ["preferences_service", "PreferencesService"]
