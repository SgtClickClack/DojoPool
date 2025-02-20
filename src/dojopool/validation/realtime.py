import gc
import gc
"""Real-time validation service."""

import logging
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from cachetools import LRUCache, TTLCache

from .validators import VenueValidator

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Validation result with metadata."""

    is_valid: bool
    field_results: Dict[str, bool]
    errors: List[str]
    timestamp: datetime
    duration_ms: float


class RateLimiter:
    """Rate limiter for validation requests."""

    def __init__(
        self,
        max_requests: int = 100,
        time_window: int = 60,
        burst_limit: int = 10,  # seconds
    ):
        """Initialize rate limiter."""
        self._lock = threading.Lock()
        self._requests: Dict[str, List[datetime]] = {}
        self._max_requests = max_requests
        self._time_window = time_window
        self._burst_limit = burst_limit

    def check_rate_limit(self, client_id: str) -> Tuple[bool, Optional[int]]:
        """Check if request is within rate limits."""
        with self._lock:
            now = datetime.now()
            window_start = now - timedelta(seconds=self._time_window)

            # Initialize or clean old requests
            if client_id not in self._requests:
                self._requests[client_id] = []
            else:
                self._requests[client_id] = [
                    ts for ts in self._requests[client_id] if ts > window_start
                ]

            # Check burst limit
            if len(self._requests[client_id]) >= self._burst_limit:
                recent_requests = [
                    ts
                    for ts in self._requests[client_id][-self._burst_limit :]
                    if (now - ts).total_seconds() < 1
                ]
                if len(recent_requests) >= self._burst_limit:
                    return False, 1  # Wait 1 second

            # Check rate limit
            if len(self._requests[client_id]) >= self._max_requests:
                oldest = min(self._requests[client_id])
                wait_time = int((window_start - oldest).total_seconds()) + 1
                return False, wait_time

            # Record request
            self._requests[client_id].append(now)
            return True, None


class ValidationCache:
    """Cache for validation results."""

    def __init__(self, ttl: int = 300, max_size: int = 1000):  # 5 minutes
        """Initialize cache."""
        self._cache = TTLCache(maxsize=max_size, ttl=ttl)
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[ValidationResult]:
        """Get cached validation result."""
        with self._lock:
            return self._cache.get(key)

    def set(self, key: str, result: ValidationResult):
        """Cache validation result."""
        with self._lock:
            self._cache[key] = result


class RealtimeValidator:
    """Real-time validation service."""

    def __init__(
        self,
        cache_ttl: int = 300,
        cache_size: int = 1000,
        rate_limit: int = 100,
        time_window: int = 60,
        burst_limit: int = 10,
    ):
        """Initialize real-time validator."""
        self._validator = VenueValidator()
        self._cache = ValidationCache(ttl=cache_ttl, max_size=cache_size)
        self._rate_limiter = RateLimiter(
            max_requests=rate_limit, time_window=time_window, burst_limit=burst_limit
        )
        self._error_cache = LRUCache(maxsize=1000)  # Cache common errors

    def _generate_cache_key(self, data: Dict[str, Any]) -> str:
        """Generate cache key for validation data."""
        # Sort keys and create deterministic string representation
        sorted_items = sorted((k, str(v)) for k, v in data.items() if v is not None)
        return ";".join(f"{k}={v}" for k, v in sorted_items)

    def _collect_field_results(self, data: Dict[str, Any]):
        """Collect validation results for each field."""
        field_results = {}
        errors = []

        # Check required fields
        required_fields = {
            "name",
            "address",
            "city",
            "state",
            "country",
            "postal_code",
            "tables",
        }
        missing_fields = required_fields - set(data.keys())
        if missing_fields:
            errors.append(f"Missing required fields: {', '.join(missing_fields)}")
            return field_results, errors

        # Validate each field
        for field, value in data.items():
            validator_method = getattr(self._validator, f"validate_{field}", None)
            if validator_method:
                try:
                    is_valid = validator_method(value)
                    field_results[field] = is_valid
                    if not is_valid:
                        error_key = f"{field}:{str(value)}"
                        if error_key in self._error_cache:
                            error_msg = self._error_cache[error_key]
                        else:
                            error_msg = f"Invalid {field}: {value}"
                            self._error_cache[error_key] = error_msg
                        errors.append(error_msg)
                except Exception as e:
                    logger.error(f"Error validating {field}: {e}")
                    errors.append(f"Error validating {field}")
                    field_results[field] = False

        return field_results, errors

    def validate(
        self, data: Dict[str, Any], client_id: str
    ) -> Tuple[ValidationResult, Optional[int]]:
        """Validate data in real-time with rate limiting."""
        # Check rate limit
        allowed, wait_time = self._rate_limiter.check_rate_limit(client_id)
        if not allowed:
            return (
                ValidationResult(
                    is_valid=False,
                    field_results={},
                    errors=["Rate limit exceeded"],
                    timestamp=datetime.now(),
                    duration_ms=0,
                ),
                wait_time,
            )

        # Check cache
        cache_key = self._generate_cache_key(data)
        cached_result = self._cache.get(cache_key)
        if cached_result:
            return cached_result, None

        # Perform validation
        start_time = datetime.now()
        field_results, errors = self._collect_field_results(data)
        duration_ms = (datetime.now() - start_time).total_seconds() * 1000

        # Create result
        result = ValidationResult(
            is_valid=len(errors) == 0,
            field_results=field_results,
            errors=errors,
            timestamp=datetime.now(),
            duration_ms=duration_ms,
        )

        # Cache result
        self._cache.set(cache_key, result)

        return result, None

    def bulk_validate(
        self, items: List[Dict[str, Any]], client_id: str
    ) -> List[Tuple[ValidationResult, Optional[int]]]:
        """Validate multiple items with rate limiting."""
        results = []
        for item in items:
            result, wait_time = self.validate(item, client_id)
            results.append((result, wait_time))
            if wait_time:
                # If rate limited, stop processing remaining items
                break
        return results
