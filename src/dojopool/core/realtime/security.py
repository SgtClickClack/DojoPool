import gc
import gc
"""WebSocket security module.

This module provides security-related functionality for WebSocket operations.
"""

import hashlib
import hmac
import json
import time
from base64 import b64decode, b64encode
from datetime import timedelta
from typing import Any, Dict, Optional, Union

from .constants import ErrorCodes


class SecurityManager:
    """Manager class for WebSocket security operations."""

    def __init__(self, secret_key: str, token_expiry: timedelta = timedelta(hours=24)):
        """Initialize SecurityManager.

        Args:
            secret_key: Secret key for token signing
            token_expiry: Token expiry duration
        """
        self.secret_key = secret_key.encode("utf-8")
        self.token_expiry = token_expiry
        self._blacklisted_tokens = set()

    def generate_token(self, user_id: str, **claims) -> str:
        """Generate an authentication token.

        Args:
            user_id: User ID
            **claims: Additional claims to include in token

        Returns:
            str: Generated token
        """
        # Create token payload
        payload = {
            "user_id": user_id,
            "exp": int(time.time() + self.token_expiry.total_seconds()),
            "iat": int(time.time()),
            **claims,
        }

        # Encode payload
        payload_str = json.dumps(payload)
        payload_b64 = b64encode(payload_str.encode("utf-8")).decode("utf-8")

        # Generate signature
        signature = hmac.new(
            self.secret_key, payload_b64.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        # Combine payload and signature
        return f"{payload_b64}.{signature}"

    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate an authentication token.

        Args:
            token: Token to validate

        Returns:
            Optional[Dict[str, Any]]: Token payload if valid, None if invalid
        """
        try:
            # Check if token is blacklisted
            if token in self._blacklisted_tokens:
                return None

            # Split token into payload and signature
            payload_b64, signature = token.split(".")

            # Verify signature
            expected_signature = hmac.new(
                self.secret_key, payload_b64.encode("utf-8"), hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_signature):
                return None

            # Decode payload
            payload_str = b64decode(payload_b64).decode("utf-8")
            payload = json.loads(payload_str)

            # Check expiration
            if payload["exp"] < time.time():
                return None

            return payload
        except Exception:
            return None

    def blacklist_token(self, token: str) -> None:
        """Add a token to the blacklist.

        Args:
            token: Token to blacklist
        """
        self._blacklisted_tokens.add(token)

    def clear_expired_blacklist(self):
        """Clear expired tokens from blacklist."""
        time.time()
        self._blacklisted_tokens = {
            token
            for token in self._blacklisted_tokens
            if self.validate_token(token) is not None
        }


class RateLimiter:
    """Rate limiter for WebSocket operations."""

    def __init__(self, max_requests: int, time_window: timedelta):
        """Initialize RateLimiter.

        Args:
            max_requests: Maximum number of requests allowed
            time_window: Time window for rate limiting
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self._request_history: Dict[str, list] = {}

    def is_rate_limited(self, client_id: str):
        """Check if a client is rate limited.

        Args:
            client_id: Client ID to check

        Returns:
            bool: True if rate limited, False otherwise
        """
        current_time = time.time()

        # Initialize request history for client
        if client_id not in self._request_history:
            self._request_history[client_id] = []

        # Remove old requests outside time window
        window_start = current_time - self.time_window.total_seconds()
        self._request_history[client_id] = [
            ts for ts in self._request_history[client_id] if ts > window_start
        ]

        # Check rate limit
        return len(self._request_history[client_id]) >= self.max_requests

    def add_request(self, client_id: str) -> None:
        """Add a request to the history.

        Args:
            client_id: Client ID that made the request
        """
        if client_id not in self._request_history:
            self._request_history[client_id] = []
        self._request_history[client_id].append(time.time())

    def get_retry_after(self, client_id: str):
        """Get the time until rate limit reset.

        Args:
            client_id: Client ID to check

        Returns:
            float: Seconds until rate limit reset
        """
        if not self._request_history.get(client_id):
            return 0

        oldest_request = min(self._request_history[client_id])
        return oldest_request + self.time_window.total_seconds() - time.time()


class IPBlocker:
    """IP blocking for WebSocket security."""

    def __init__(
        self, max_failures: int = 5, block_duration: timedelta = timedelta(minutes=15)
    ):
        """Initialize IPBlocker.

        Args:
            max_failures: Maximum number of failures before blocking
            block_duration: Duration to block IP addresses
        """
        self.max_failures = max_failures
        self.block_duration = block_duration
        self._failure_counts: Dict[str, int] = {}
        self._blocked_ips: Dict[str, float] = {}

    def record_failure(self, ip_address: str) -> None:
        """Record an authentication failure for an IP address.

        Args:
            ip_address: IP address to record failure for
        """
        self._failure_counts[ip_address] = self._failure_counts.get(ip_address, 0) + 1

        if self._failure_counts[ip_address] >= self.max_failures:
            self._blocked_ips[ip_address] = time.time()

    def is_blocked(self, ip_address: str) -> bool:
        """Check if an IP address is blocked.

        Args:
            ip_address: IP address to check

        Returns:
            bool: True if blocked, False otherwise
        """
        if ip_address not in self._blocked_ips:
            return False

        # Check if block has expired
        block_time = self._blocked_ips[ip_address]
        if time.time() - block_time > self.block_duration.total_seconds():
            del self._blocked_ips[ip_address]
            del self._failure_counts[ip_address]
            return False

        return True

    def clear_expired_blocks(self) -> None:
        """Clear expired IP blocks."""
        current_time = time.time()
        expired_ips = [
            ip
            for ip, block_time in self._blocked_ips.items()
            if current_time - block_time > self.block_duration.total_seconds()
        ]

        for ip in expired_ips:
            del self._blocked_ips[ip]
            del self._failure_counts[ip]


def validate_origin(origin: str, allowed_origins: list[str]) -> bool:
    """Validate WebSocket connection origin.

    Args:
        origin: Origin to validate
        allowed_origins: List of allowed origins

    Returns:
        bool: True if origin is allowed, False otherwise
    """
    if "*" in allowed_origins:
        return True

    return origin in allowed_origins


def sanitize_data(data: Dict[str, Any], max_depth: int = 10):
    """Sanitize WebSocket data for security.

    Args:
        data: Data to sanitize
        max_depth: Maximum nested depth

    Returns:
        Dict[str, Any]: Sanitized data
    """

    def _sanitize(value: Any, depth: int):
        if depth > max_depth:
            return None

        if isinstance(value, dict):
            return {
                k: _sanitize(v, depth + 1)
                for k, v in value.items()
                if isinstance(k, str)
            }
        elif isinstance(value, list):
            return [_sanitize(item, depth + 1) for item in value]
        elif isinstance(value, (str, int, float, bool, type(None))):
            return value
        else:
            return str(value)

    return _sanitize(data, 0)


def validate_payload_size(
    data: Union[str, Dict[str, Any]], max_size: int
) -> Optional[Dict[str, Any]]:
    """Validate WebSocket payload size.

    Args:
        data: Data to validate
        max_size: Maximum allowed size in bytes

    Returns:
        Optional[Dict[str, Any]]: Error details if validation fails, None if successful
    """
    try:
        # Convert to JSON if not already a string
        if not isinstance(data, str):
            data = json.dumps(data)

        # Check payload size
        size = len(data.encode("utf-8"))
        if size > max_size:
            return {
                "code": ErrorCodes.PAYLOAD_TOO_LARGE,
                "message": "Payload size exceeds maximum allowed",
                "details": {"max_size": max_size, "actual_size": size},
            }

        return None
    except Exception as e:
        return {
            "code": ErrorCodes.VALIDATION_ERROR,
            "message": "Invalid payload format",
            "details": {"error": str(e)},
        }
