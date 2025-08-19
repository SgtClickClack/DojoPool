"""WebSocket authentication module.

This module provides authentication functionality for WebSocket operations.
"""

import asyncio
from collections import defaultdict
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union

from flask import session
from flask_socketio import emit

from .constants import ErrorCodes
from .log_config import logger
from .utils import format_error_response, generate_token, verify_token


class AuthManager:
    """Authentication manager class."""

    def __init__(self):
        """Initialize AuthManager."""
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._failed_attempts: Dict[str, List[datetime]] = defaultdict(list)
        self._locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start_cleanup(self, interval: int = 300) -> None:
        """Start cleanup task.

        Args:
            interval: Cleanup interval in seconds
        """
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop(interval))

    async def stop_cleanup(self) -> None:
        """Stop cleanup task."""
        if self._cleanup_task is not None:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None

    async def _cleanup_loop(self, interval: int) -> None:
        """Cleanup loop to remove expired sessions.

        Args:
            interval: Cleanup interval in seconds
        """
        while True:
            try:
                await asyncio.sleep(interval)
                await self.cleanup()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "Error in auth manager cleanup", exc_info=True, extra={"error": str(e)}
                )

    async def cleanup(self) -> None:
        """Remove expired sessions and failed attempts."""
        now = datetime.utcnow()
        expired_sessions = []

        # Clean up sessions
        for session_id, session in self._sessions.items():
            if "expires_at" in session:
                expiry = datetime.fromisoformat(session["expires_at"])
                if now > expiry:
                    expired_sessions.append(session_id)

        for session_id in expired_sessions:
            del self._sessions[session_id]

        # Clean up failed attempts
        for user_id in list(self._failed_attempts.keys()):
            async with self._locks[user_id]:
                # Keep only attempts from last hour
                self._failed_attempts[user_id] = [
                    attempt
                    for attempt in self._failed_attempts[user_id]
                    if (now - attempt).total_seconds() <= 3600
                ]

                # Remove if no attempts
                if not self._failed_attempts[user_id]:
                    del self._failed_attempts[user_id]
                    del self._locks[user_id]

    async def authenticate(self, token: str, secret_key: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with token.

        Args:
            token: Authentication token
            secret_key: Secret key for verification

        Returns:
            Optional[Dict[str, Any]]: Session data if authenticated, None if not
        """
        # Verify token
        payload = verify_token(token, secret_key)
        if not payload:
            return None

        # Create session
        session_id = generate_token(
            payload["user_id"], secret_key, datetime.utcnow() + timedelta(hours=24)
        )

        session = {
            "session_id": session_id,
            "user_id": payload["user_id"],
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        }

        self._sessions[session_id] = session
        return session

    async def check_auth(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Check if session is valid.

        Args:
            session_id: Session ID to check

        Returns:
            Optional[Dict[str, Any]]: Session data if valid, None if not
        """
        session = self._sessions.get(session_id)
        if not session:
            return None

        # Check expiry
        if "expires_at" in session:
            expiry = datetime.fromisoformat(session["expires_at"])
            if datetime.utcnow() > expiry:
                del self._sessions[session_id]
                return None

        return session

    async def check_permissions(
        self, session_id: str, required_permissions: Union[str, List[str]]
    ) -> Optional[Dict[str, Any]]:
        """Check if session has required permissions.

        Args:
            session_id: Session ID to check
            required_permissions: Required permissions

        Returns:
            Optional[Dict[str, Any]]: Error response if not allowed, None if allowed
        """
        session = await self.check_auth(session_id)
        if not session:
            return format_error_response(
                ErrorCodes.AUTHENTICATION_REQUIRED, "Authentication required"
            )

        if isinstance(required_permissions, str):
            required_permissions = [required_permissions]

        user_permissions = session.get("permissions", [])
        missing_permissions = [
            perm for perm in required_permissions if perm not in user_permissions
        ]

        if missing_permissions:
            return format_error_response(
                ErrorCodes.INSUFFICIENT_PERMISSIONS,
                "Insufficient permissions",
                {"missing_permissions": missing_permissions},
            )

        return None

    async def record_failed_attempt(
        self,
        user_id: str,
        max_attempts: int = 5,
        lockout_duration: timedelta = timedelta(minutes=15),
    ) -> Optional[Dict[str, Any]]:
        """Record failed authentication attempt.

        Args:
            user_id: User ID
            max_attempts: Maximum allowed attempts
            lockout_duration: Lockout duration

        Returns:
            Optional[Dict[str, Any]]: Error response if locked out, None otherwise
        """
        now = datetime.utcnow()

        async with self._locks[user_id]:
            # Add current attempt
            self._failed_attempts[user_id].append(now)

            # Count recent attempts
            recent_attempts = sum(
                1
                for attempt in self._failed_attempts[user_id]
                if (now - attempt).total_seconds() <= lockout_duration.total_seconds()
            )

            # Check if locked out
            if recent_attempts > max_attempts:
                return format_error_response(
                    ErrorCodes.ACCOUNT_LOCKED,
                    "Account locked due to too many failed attempts",
                    {
                        "lockout_duration_seconds": lockout_duration.total_seconds(),
                        "attempts_made": recent_attempts,
                        "max_attempts": max_attempts,
                    },
                )

        return None

    def invalidate_session(self, session_id: str) -> None:
        """Invalidate session.

        Args:
            session_id: Session ID to invalidate
        """
        if session_id in self._sessions:
            del self._sessions[session_id]


# Global auth manager instance
auth_manager = AuthManager()


def require_auth(f: Callable) -> Callable:
    """Decorator to require authentication.

    Args:
        f: Function to decorate

    Returns:
        Callable: Decorated function
    """

    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            error = format_error_response(
                ErrorCodes.AUTHENTICATION_REQUIRED, "Authentication required"
            )
            emit("error", error)
            return
        return f(*args, **kwargs)

    return wrapper


def require_permissions(permissions: Union[str, List[str]]) -> Callable:
    """Decorator to require permissions.

    Args:
        permissions: Required permissions

    Returns:
        Callable: Decorator function
    """
    if isinstance(permissions, str):
        permissions = [permissions]

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not session.get("user_id"):
                error = format_error_response(
                    ErrorCodes.AUTHENTICATION_REQUIRED, "Authentication required"
                )
                emit("error", error)
                return

            user_permissions = session.get("permissions", [])
            missing_permissions = [perm for perm in permissions if perm not in user_permissions]

            if missing_permissions:
                error = format_error_response(
                    ErrorCodes.INSUFFICIENT_PERMISSIONS,
                    "Insufficient permissions",
                    {"missing_permissions": missing_permissions},
                )
                emit("error", error)
                return

            return f(*args, **kwargs)

        return wrapper

    return decorator


async def start_auth_manager(cleanup_interval: int = 300) -> None:
    """Start authentication manager cleanup task.

    Args:
        cleanup_interval: Cleanup interval in seconds
    """
    await auth_manager.start_cleanup(cleanup_interval)


async def stop_auth_manager() -> None:
    """Stop authentication manager cleanup task."""
    await auth_manager.stop_cleanup()
