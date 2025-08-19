"""Configuration package for DojoPool."""

import os
from typing import Optional, Type

from .config import Config
from .development import DevelopmentConfig
from .production import ProductionConfig
from .testing import TestingConfig


def get_config(config_name: Optional[str] = None) -> Type[Config]:
    """Get configuration class based on environment.

    Args:
        config_name: Name of configuration to use

    Returns:
        Configuration class

    Raises:
        ValueError: If config_name is invalid
    """
    configs = {
        "development": DevelopmentConfig,
        "testing": TestingConfig,
        "production": ProductionConfig,
        "default": DevelopmentConfig,
    }

    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "default")

    config_class = configs.get(config_name)
    if config_class is None:
        raise ValueError(f"Invalid configuration name: {config_name}")

    # Validate configuration
    errors = config_class.validate()
    if errors:
        error_msg = "\n".join(f"{k}: {v}" for k, v in errors.items())
        raise ValueError(f"Configuration validation failed:\n{error_msg}")

    return config_class


__all__ = ["Config", "DevelopmentConfig", "TestingConfig", "ProductionConfig", "get_config"]
