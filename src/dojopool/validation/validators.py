"""Validation module."""

from typing import (
    Any,
    Dict,
    Optional,
    List,
    NoReturn,
    Callable,
    Union,
    TypeVar,
    Protocol,
    overload,
    cast,
)
from datetime import datetime
import threading
from collections import defaultdict
import re

T = TypeVar("T")
ValidatorValue = Union[str, int, float, list, dict, None]
MetricsDict = Dict[str, Union[int, float, str, Dict[str, Any]]]


class ValidatorProtocol(Protocol):
    """Protocol for validator functions."""

    def __call__(self, value: ValidatorValue) -> bool: ...


class ValidationMetrics:
    """Tracks validation metrics."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._validation_counts: Dict[str, int] = defaultdict(int)
        self._failure_counts: Dict[str, int] = defaultdict(int)
        self._validation_times: Dict[str, List[float]] = defaultdict(list)
        self._last_reset = datetime.now()

    def record_validation(self, field: str, success: bool, duration_ms: float) -> None:
        """Record a validation attempt."""
        with self._lock:
            self._validation_counts[field] += 1
            if not success:
                self._failure_counts[field] += 1
            self._validation_times[field].append(duration_ms)

    def get_metrics(self) -> MetricsDict:
        """Get current metrics."""
        with self._lock:
            metrics: MetricsDict = {}
            for field in self._validation_counts.keys():
                total = self._validation_counts[field]
                failures = self._failure_counts[field]
                times = self._validation_times[field]

                metrics[field] = {
                    "total_validations": total,
                    "failure_count": failures,
                    "success_rate": ((total - failures) / total * 100) if total > 0 else 100,
                    "avg_duration_ms": sum(times) / len(times) if times else 0,
                    "max_duration_ms": max(times) if times else 0,
                }

            metrics["_meta"] = {
                "last_reset": self._last_reset.isoformat(),
                "total_fields_validated": len(self._validation_counts),
            }

            return metrics

    def reset(self) -> None:
        """Reset all metrics."""
        with self._lock:
            self._validation_counts.clear()
            self._failure_counts.clear()
            self._validation_times.clear()
            self._last_reset = datetime.now()


class VenueValidator:
    """Validator for venue data."""

    _metrics = ValidationMetrics()

    # Regex patterns for validation
    PHONE_PATTERN = re.compile(r"^\+?1?[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}$")
    EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    URL_PATTERN = re.compile(
        r"^https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)$"
    )
    POSTAL_CODE_PATTERN = re.compile(r"^\d{5}(?:[-\s]\d{4})?$")  # US format
    TIME_PATTERN = re.compile(r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")

    # Allowed values
    ALLOWED_STATUSES = {"active", "maintenance", "closed"}
    ALLOWED_AMENITIES = {
        "parking",
        "food",
        "bar",
        "wifi",
        "tournaments",
        "lessons",
        "equipment_rental",
        "pro_shop",
        "spectator_area",
        "private_rooms",
    }
    ALLOWED_DAYS = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}

    @classmethod
    def get_metrics(cls) -> MetricsDict:
        """Get current validation metrics."""
        return cls._metrics.get_metrics()

    @classmethod
    def reset_metrics(cls) -> None:
        """Reset validation metrics."""
        cls._metrics.reset()

    @staticmethod
    def _track_validation(field: str, success: bool, start_time: float) -> None:
        """Track validation metrics for a field."""
        duration = (datetime.now().timestamp() - start_time) * 1000
        VenueValidator._metrics.record_validation(field, success, duration)

    @classmethod
    def validate_name(cls, name: str) -> bool:
        """Validate venue name."""
        start_time = datetime.now().timestamp()
        result = bool(name and len(name) <= 100 and not name.isspace())
        cls._track_validation("name", result, start_time)
        return result

    @classmethod
    def validate_address(cls, address: str) -> bool:
        """Validate venue address."""
        start_time = datetime.now().timestamp()
        result = bool(address and len(address) <= 255)
        cls._track_validation("address", result, start_time)
        return result

    @classmethod
    def validate_city(cls, city: str) -> bool:
        """Validate venue city."""
        start_time = datetime.now().timestamp()
        result = bool(city and len(city) <= 100)
        cls._track_validation("city", result, start_time)
        return result

    @classmethod
    def validate_state(cls, state: str) -> bool:
        """Validate venue state."""
        start_time = datetime.now().timestamp()
        result = bool(state and len(state) <= 50)
        cls._track_validation("state", result, start_time)
        return result

    @classmethod
    def validate_country(cls, country: str) -> bool:
        """Validate venue country."""
        start_time = datetime.now().timestamp()
        result = bool(country and len(country) <= 50)
        cls._track_validation("country", result, start_time)
        return result

    @classmethod
    def validate_postal_code(cls, postal_code: str) -> bool:
        """Validate venue postal code."""
        start_time = datetime.now().timestamp()
        result = bool(postal_code and cls.POSTAL_CODE_PATTERN.match(postal_code))
        cls._track_validation("postal_code", result, start_time)
        return result

    @classmethod
    def validate_phone(cls, phone: Optional[str]) -> bool:
        """Validate venue phone number."""
        start_time = datetime.now().timestamp()
        result = not phone or bool(cls.PHONE_PATTERN.match(phone))
        cls._track_validation("phone", result, start_time)
        return result

    @classmethod
    def validate_email(cls, email: Optional[str]) -> bool:
        """Validate venue email."""
        start_time = datetime.now().timestamp()
        result = not email or bool(cls.EMAIL_PATTERN.match(email))
        cls._track_validation("email", result, start_time)
        return result

    @classmethod
    def validate_website(cls, website: Optional[str]) -> bool:
        """Validate venue website."""
        start_time = datetime.now().timestamp()
        result = not website or bool(cls.URL_PATTERN.match(website))
        cls._track_validation("website", result, start_time)
        return result

    @classmethod
    def validate_capacity(cls, capacity: Optional[int]) -> bool:
        """Validate venue capacity."""
        start_time = datetime.now().timestamp()
        result = capacity is None or capacity > 0
        cls._track_validation("capacity", result, start_time)
        return result

    @classmethod
    def validate_tables(cls, tables: int) -> bool:
        """Validate number of pool tables."""
        start_time = datetime.now().timestamp()
        result = tables > 0
        cls._track_validation("tables", result, start_time)
        return result

    @classmethod
    def validate_table_rate(cls, table_rate: Optional[float]) -> bool:
        """Validate table hourly rate."""
        start_time = datetime.now().timestamp()
        result = table_rate is None or table_rate >= 0
        cls._track_validation("table_rate", result, start_time)
        return result

    @classmethod
    def validate_rating(cls, rating: Optional[float]) -> bool:
        """Validate venue rating."""
        start_time = datetime.now().timestamp()
        result = rating is None or (0 <= rating <= 5)
        cls._track_validation("rating", result, start_time)
        return result

    @classmethod
    def validate_status(cls, status: str) -> bool:
        """Validate venue status."""
        start_time = datetime.now().timestamp()
        result = status in ["active", "maintenance", "closed"]
        cls._track_validation("status", result, start_time)
        return result

    @classmethod
    def validate_coordinates(cls, latitude: Optional[float], longitude: Optional[float]) -> bool:
        """Validate venue coordinates."""
        start_time = datetime.now().timestamp()

        if latitude is None and longitude is None:
            cls._track_validation("coordinates", True, start_time)
            return True

        try:
            result = (
                isinstance(latitude, (int, float))
                and isinstance(longitude, (int, float))
                and -90 <= float(latitude) <= 90
                and -180 <= float(longitude) <= 180
            )
            cls._track_validation("coordinates", result, start_time)
            return result
        except (TypeError, ValueError):
            cls._track_validation("coordinates", False, start_time)
            return False

    @classmethod
    def validate_photos(cls, photos: Optional[list]) -> bool:
        """Validate venue photos."""
        start_time = datetime.now().timestamp()
        result = not photos or all(isinstance(url, str) and len(url) <= 255 for url in photos)
        cls._track_validation("photos", result, start_time)
        return result

    @classmethod
    def validate_social_links(cls, social_links: Optional[Dict[str, str]]) -> bool:
        """Validate venue social media links."""
        start_time = datetime.now().timestamp()
        result = not social_links or all(
            isinstance(platform, str) and isinstance(url, str) and len(url) <= 255
            for platform, url in social_links.items()
        )
        cls._track_validation("social_links", result, start_time)
        return result

    @classmethod
    def validate_featured_image(cls, featured_image: Optional[str]) -> bool:
        """Validate venue featured image."""
        start_time = datetime.now().timestamp()
        result = not featured_image or len(featured_image) <= 255
        cls._track_validation("featured_image", result, start_time)
        return result

    @classmethod
    def validate_virtual_tour(cls, virtual_tour: Optional[str]) -> bool:
        """Validate venue virtual tour URL."""
        start_time = datetime.now().timestamp()
        result = not virtual_tour or len(virtual_tour) <= 255
        cls._track_validation("virtual_tour", result, start_time)
        return result

    @classmethod
    def validate_hours_data(cls, hours_data: Optional[Dict[str, Any]]) -> bool:
        """Validate venue operating hours data."""
        start_time = datetime.now().timestamp()

        if not hours_data:
            cls._track_validation("hours_data", True, start_time)
            return True

        try:
            result = all(
                day.lower() in cls.ALLOWED_DAYS
                and isinstance(hours, dict)
                and "open" in hours
                and "close" in hours
                and bool(cls.TIME_PATTERN.match(hours["open"]))
                and bool(cls.TIME_PATTERN.match(hours["close"]))
                for day, hours in hours_data.items()
            )
            cls._track_validation("hours_data", result, start_time)
            return result
        except (AttributeError, KeyError):
            cls._track_validation("hours_data", False, start_time)
            return False

    @classmethod
    def validate_amenities_summary(cls, amenities_summary: Optional[Dict[str, bool]]) -> bool:
        """Validate venue amenities summary."""
        start_time = datetime.now().timestamp()

        if not amenities_summary:
            cls._track_validation("amenities_summary", True, start_time)
            return True

        result = all(
            isinstance(amenity, str)
            and amenity.lower() in cls.ALLOWED_AMENITIES
            and isinstance(available, bool)
            for amenity, available in amenities_summary.items()
        )
        cls._track_validation("amenities_summary", result, start_time)
        return result

    @classmethod
    def validate_rules(cls, rules: Optional[str]) -> bool:
        """Validate venue rules."""
        start_time = datetime.now().timestamp()
        result = not rules or len(rules) <= 1000
        cls._track_validation("rules", result, start_time)
        return result

    @classmethod
    def validate_notes(cls, notes: Optional[str]) -> bool:
        """Validate venue notes."""
        start_time = datetime.now().timestamp()
        result = not notes or len(notes) <= 1000
        cls._track_validation("notes", result, start_time)
        return result

    @classmethod
    def validate(cls, data: Dict[str, Any]) -> bool:
        """Validate all venue data."""
        start_time = datetime.now().timestamp()

        # Required fields validation
        required_fields = {"name", "address", "city", "state", "country", "postal_code", "tables"}
        missing_fields = required_fields - set(data.keys())
        if missing_fields:
            cls._track_validation("complete_validation", False, start_time)
            return False

        # Create validator mapping with proper type casting
        validators: Dict[str, ValidatorProtocol] = {
            "name": cast(ValidatorProtocol, cls.validate_name),
            "address": cast(ValidatorProtocol, cls.validate_address),
            "city": cast(ValidatorProtocol, cls.validate_city),
            "state": cast(ValidatorProtocol, cls.validate_state),
            "country": cast(ValidatorProtocol, cls.validate_country),
            "postal_code": cast(ValidatorProtocol, cls.validate_postal_code),
            "phone": cast(ValidatorProtocol, cls.validate_phone),
            "email": cast(ValidatorProtocol, cls.validate_email),
            "website": cast(ValidatorProtocol, cls.validate_website),
            "capacity": cast(ValidatorProtocol, cls.validate_capacity),
            "tables": cast(ValidatorProtocol, cls.validate_tables),
            "table_rate": cast(ValidatorProtocol, cls.validate_table_rate),
            "rating": cast(ValidatorProtocol, cls.validate_rating),
            "status": cast(ValidatorProtocol, cls.validate_status),
            "photos": cast(ValidatorProtocol, cls.validate_photos),
            "social_links": cast(ValidatorProtocol, cls.validate_social_links),
            "featured_image": cast(ValidatorProtocol, cls.validate_featured_image),
            "virtual_tour": cast(ValidatorProtocol, cls.validate_virtual_tour),
            "hours_data": cast(ValidatorProtocol, cls.validate_hours_data),
            "amenities_summary": cast(ValidatorProtocol, cls.validate_amenities_summary),
            "rules": cast(ValidatorProtocol, cls.validate_rules),
            "notes": cast(ValidatorProtocol, cls.validate_notes),
        }

        # Validate each field
        for field, validator in validators.items():
            if field in data and not validator(data[field]):
                cls._track_validation("complete_validation", False, start_time)
                return False

        # Special handling for coordinates
        if "latitude" in data or "longitude" in data:
            if not cls.validate_coordinates(data.get("latitude"), data.get("longitude")):
                cls._track_validation("complete_validation", False, start_time)
                return False

        cls._track_validation("complete_validation", True, start_time)
        return True
