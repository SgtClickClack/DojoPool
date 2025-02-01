"""WebSocket environment configuration module.

This module provides environment-specific configuration settings for WebSocket functionality.
"""

import os
from dataclasses import dataclass
from datetime import timedelta
from typing import Any, Dict

from .config import MetricsConfig, RateLimitConfig, RoomConfig, SecurityConfig, WebSocketConfig


@dataclass
class EnvironmentConfig:
    """Environment-specific configuration."""

    # Environment type
    ENV_TYPE: str = os.getenv("WEBSOCKET_ENV", "development")

    # Environment-specific configurations
    CONFIGS: Dict[str, Dict[str, Any]] = {
        "development": {
            "host": "localhost",
            "port": 5000,
            "debug": True,
            "cors_allowed_origins": "*",
            "rate_limits": {
                "join_game": RateLimitConfig(
                    max_requests=100,
                    time_window=timedelta(minutes=1),
                    error_message="Too many game join attempts",
                ),
                "update_score": RateLimitConfig(
                    max_requests=600,
                    time_window=timedelta(minutes=1),
                    error_message="Too many score updates",
                ),
            },
            "room_config": RoomConfig(
                max_members=10,
                idle_timeout=timedelta(minutes=30),
                cleanup_interval=timedelta(minutes=5),
            ),
            "security_config": SecurityConfig(
                max_payload_size=5 * 1024 * 1024,  # 5MB
                max_connections_per_user=10,
                token_expiry=timedelta(days=7),
                allowed_origins=["http://localhost:3000"],
            ),
            "metrics_config": MetricsConfig(
                enabled=True,
                collection_interval=timedelta(seconds=10),
                retention_period=timedelta(days=1),
            ),
        },
        "testing": {
            "host": "localhost",
            "port": 5001,
            "debug": True,
            "cors_allowed_origins": "*",
            "rate_limits": {
                "join_game": RateLimitConfig(
                    max_requests=1000,
                    time_window=timedelta(minutes=1),
                    error_message="Too many game join attempts",
                ),
                "update_score": RateLimitConfig(
                    max_requests=6000,
                    time_window=timedelta(minutes=1),
                    error_message="Too many score updates",
                ),
            },
            "room_config": RoomConfig(
                max_members=100,
                idle_timeout=timedelta(minutes=5),
                cleanup_interval=timedelta(minutes=1),
            ),
            "security_config": SecurityConfig(
                max_payload_size=10 * 1024 * 1024,  # 10MB
                max_connections_per_user=100,
                token_expiry=timedelta(hours=1),
                allowed_origins=["*"],
            ),
            "metrics_config": MetricsConfig(
                enabled=False,
                collection_interval=timedelta(seconds=1),
                retention_period=timedelta(hours=1),
            ),
        },
        "staging": {
            "host": "0.0.0.0",
            "port": int(os.getenv("PORT", 5000)),
            "debug": False,
            "cors_allowed_origins": os.getenv("CORS_ORIGINS", "https://staging.example.com"),
            "rate_limits": {
                "join_game": RateLimitConfig(
                    max_requests=30,
                    time_window=timedelta(minutes=1),
                    error_message="Too many game join attempts",
                ),
                "update_score": RateLimitConfig(
                    max_requests=180,
                    time_window=timedelta(minutes=1),
                    error_message="Too many score updates",
                ),
            },
            "room_config": RoomConfig(
                max_members=50,
                idle_timeout=timedelta(minutes=30),
                cleanup_interval=timedelta(minutes=5),
            ),
            "security_config": SecurityConfig(
                max_payload_size=2 * 1024 * 1024,  # 2MB
                max_connections_per_user=3,
                token_expiry=timedelta(days=1),
                allowed_origins=[os.getenv("CORS_ORIGINS", "https://staging.example.com")],
            ),
            "metrics_config": MetricsConfig(
                enabled=True,
                collection_interval=timedelta(seconds=30),
                retention_period=timedelta(days=7),
            ),
        },
        "production": {
            "host": "0.0.0.0",
            "port": int(os.getenv("PORT", 5000)),
            "debug": False,
            "cors_allowed_origins": os.getenv("CORS_ORIGINS", "https://example.com"),
            "rate_limits": {
                "join_game": RateLimitConfig(
                    max_requests=20,
                    time_window=timedelta(minutes=1),
                    error_message="Too many game join attempts",
                ),
                "update_score": RateLimitConfig(
                    max_requests=120,
                    time_window=timedelta(minutes=1),
                    error_message="Too many score updates",
                ),
            },
            "room_config": RoomConfig(
                max_members=100,
                idle_timeout=timedelta(minutes=30),
                cleanup_interval=timedelta(minutes=5),
            ),
            "security_config": SecurityConfig(
                max_payload_size=1 * 1024 * 1024,  # 1MB
                max_connections_per_user=2,
                token_expiry=timedelta(hours=12),
                allowed_origins=[os.getenv("CORS_ORIGINS", "https://example.com")],
            ),
            "metrics_config": MetricsConfig(
                enabled=True,
                collection_interval=timedelta(seconds=60),
                retention_period=timedelta(days=30),
            ),
        },
    }

    @classmethod
    def get_config(cls) -> WebSocketConfig:
        """Get environment-specific configuration.

        Returns:
            WebSocketConfig: The configuration for the current environment.
        """
        env_config = cls.CONFIGS.get(cls.ENV_TYPE, cls.CONFIGS["development"])
        return WebSocketConfig(**env_config)


# Get environment-specific configuration
env_config = EnvironmentConfig.get_config()
