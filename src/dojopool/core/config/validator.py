"""
Configuration validation module.

This module provides basic validation for configuration settings.
"""


class ConfigError(Exception):
    """Configuration validation error."""

    pass


def validate_config(config):
    """Validate configuration settings.

    Args:
        config: Configuration object to validate

    Raises:
        ConfigError: If validation fails
    """
    # Check required settings
    required_settings = [
        "SECRET_KEY",
        "SQLALCHEMY_DATABASE_URI",
        "MAX_PLAYERS_PER_GAME",
        "COIN_SPAWN_INTERVAL",
    ]

    for setting in required_settings:
        if not hasattr(config, setting):
            raise ConfigError(f"Missing required setting: {setting}")

    # Validate types
    if not isinstance(config.MAX_PLAYERS_PER_GAME, int):
        raise ConfigError("MAX_PLAYERS_PER_GAME must be an integer")

    if not isinstance(config.COIN_SPAWN_INTERVAL, int):
        raise ConfigError("COIN_SPAWN_INTERVAL must be an integer")

    # Validate values
    if config.MAX_PLAYERS_PER_GAME < 1:
        raise ConfigError("MAX_PLAYERS_PER_GAME must be positive")

    if config.COIN_SPAWN_INTERVAL < 1:
        raise ConfigError("COIN_SPAWN_INTERVAL must be positive")

    # Validate security settings in production
    if not config.DEBUG and config.SECRET_KEY == "dev-key-please-change-in-production":
        raise ConfigError("Default secret key cannot be used in production")
