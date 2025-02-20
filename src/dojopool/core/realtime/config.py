"""WebSocket configuration module.

This module provides configuration settings and options for WebSocket operations.
"""

from dataclasses import dataclass
from datetime import timedelta
from typing import Any, Dict, Optional


@dataclass
class RateLimitConfig:
    """Rate limit configuration."""

    max_requests: int
    time_window: timedelta
    error_message: str = "Rate limit exceeded"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary.

        Returns:
            Dict[str, Any]: Dictionary representation
        """
        return {
            "max_requests": self.max_requests,
            "time_window_seconds": self.time_window.total_seconds(),
            "error_message": self.error_message,
        }


@dataclass
class RoomConfig:
    """Room configuration."""

    max_members: int
    idle_timeout: timedelta
    cleanup_interval: timedelta

    def to_dict(self):
        """Convert to dictionary.

        Returns:
            Dict[str, Any]: Dictionary representation
        """
        return {
            "max_members": self.max_members,
            "idle_timeout_seconds": self.idle_timeout.total_seconds(),
            "cleanup_interval_seconds": self.cleanup_interval.total_seconds(),
        }


@dataclass
class MetricsConfig:
    """Metrics configuration."""

    enabled: bool = True
    collection_interval: timedelta = timedelta(seconds=60)
    retention_days: int = 30

    def to_dict(self):
        """Convert to dictionary.

        Returns:
            Dict[str, Any]: Dictionary representation
        """
        return {
            "enabled": self.enabled,
            "collection_interval_seconds": self.collection_interval.total_seconds(),
            "retention_days": self.retention_days,
        }


@dataclass
class SecurityConfig:
    """Security configuration."""

    require_authentication: bool = True
    token_expiry: timedelta = timedelta(hours=24)
    max_failed_attempts: int = 5
    lockout_duration: timedelta = timedelta(minutes=15)

    def to_dict(self):
        """Convert to dictionary.

        Returns:
            Dict[str, Any]: Dictionary representation
        """
        return {
            "require_authentication": self.require_authentication,
            "token_expiry_seconds": self.token_expiry.total_seconds(),
            "max_failed_attempts": self.max_failed_attempts,
            "lockout_duration_seconds": self.lockout_duration.total_seconds(),
        }


class WebSocketConfig:
    """WebSocket configuration class."""

    def __init__(
        self,
        rate_limit: Optional[RateLimitConfig] = None,
        room: Optional[RoomConfig] = None,
        metrics: Optional[MetricsConfig] = None,
        security: Optional[SecurityConfig] = None,
        debug: bool = False,
    ):
        """Initialize WebSocketConfig.

        Args:
            rate_limit: Rate limit configuration
            room: Room configuration
            metrics: Metrics configuration
            security: Security configuration
            debug: Debug mode flag
        """
        self.rate_limit = rate_limit or RateLimitConfig(
            max_requests=100, time_window=timedelta(minutes=1)
        )

        self.room = room or RoomConfig(
            max_members=100,
            idle_timeout=timedelta(minutes=30),
            cleanup_interval=timedelta(minutes=5),
        )

        self.metrics = metrics or MetricsConfig()
        self.security = security or SecurityConfig()
        self.debug = debug

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary.

        Returns:
            Dict[str, Any]: Dictionary representation
        """
        return {
            "rate_limit": self.rate_limit.to_dict(),
            "room": self.room.to_dict(),
            "metrics": self.metrics.to_dict(),
            "security": self.security.to_dict(),
            "debug": self.debug,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create from dictionary.

        Args:
            data: Dictionary data

        Returns:
            WebSocketConfig: Configuration instance
        """
        rate_limit_data = data.get("rate_limit", {})
        room_data = data.get("room", {})
        metrics_data = data.get("metrics", {})
        security_data = data.get("security", {})

        return cls(
            rate_limit=RateLimitConfig(
                max_requests=rate_limit_data.get("max_requests", 100),
                time_window=timedelta(
                    seconds=rate_limit_data.get("time_window_seconds", 60)
                ),
                error_message=rate_limit_data.get(
                    "error_message", "Rate limit exceeded"
                ),
            ),
            room=RoomConfig(
                max_members=room_data.get("max_members", 100),
                idle_timeout=timedelta(
                    seconds=room_data.get("idle_timeout_seconds", 1800)
                ),
                cleanup_interval=timedelta(
                    seconds=room_data.get("cleanup_interval_seconds", 300)
                ),
            ),
            metrics=MetricsConfig(
                enabled=metrics_data.get("enabled", True),
                collection_interval=timedelta(
                    seconds=metrics_data.get("collection_interval_seconds", 60)
                ),
                retention_days=metrics_data.get("retention_days", 30),
            ),
            security=SecurityConfig(
                require_authentication=security_data.get(
                    "require_authentication", True
                ),
                token_expiry=timedelta(
                    seconds=security_data.get("token_expiry_seconds", 86400)
                ),
                max_failed_attempts=security_data.get("max_failed_attempts", 5),
                lockout_duration=timedelta(
                    seconds=security_data.get("lockout_duration_seconds", 900)
                ),
            ),
            debug=data.get("debug", False),
        )


# Default configuration
default_config = WebSocketConfig()
