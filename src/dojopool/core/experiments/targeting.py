import gc
import gc
"""Targeting system for A/B testing experiments."""

import hashlib
import logging
from dataclasses import dataclass
from datetime import datetime, time
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Union

logger = logging.getLogger(__name__)


class Operator(Enum):
    """Supported targeting operators."""

    EQUALS = "equals"
    CONTAINS = "contains"
    GT = "gt"
    LT = "lt"
    IN = "in"
    BETWEEN = "between"
    REGEX = "regex"
    EXISTS = "exists"


@dataclass
class TimeWindow:
    """Represents a time window for targeting."""

    start_time: time
    end_time: time
    days: Optional[Set[int]] = None  # 0=Monday, 6=Sunday

    def is_active(self, current_time: datetime) -> bool:
        """Check if the current time falls within the window."""
        if self.days and current_time.weekday() not in self.days:
            return False

        current_time_of_day = current_time.time()
        if self.start_time <= self.end_time:
            return self.start_time <= current_time_of_day <= self.end_time
        else:  # Handles overnight windows (e.g., 22:00-06:00)
            return (
                current_time_of_day >= self.start_time
                or current_time_of_day <= self.end_time
            )


@dataclass
class TargetingRule:
    """A targeting rule for experiments."""

    attribute: str
    operator: Union[Operator, str]
    value: Any
    time_window: Optional[TimeWindow] = None

    def __post_init__(self):
        """Convert operator string to enum if needed."""
        if isinstance(self.operator, str):
            self.operator = Operator(self.operator)

    def matches(
        self, user_attributes: Dict[str, Any], current_time: Optional[datetime] = None
    ) -> bool:
        """Check if user matches the targeting rule."""
        # Check time window if specified
        if self.time_window and current_time:
            if not self.time_window.is_active(current_time):
                return False

        # Check if attribute exists
        if self.operator == Operator.EXISTS:
            return self.attribute in user_attributes

        if self.attribute not in user_attributes:
            return False

        user_value = user_attributes[self.attribute]

        # Evaluate based on operator
        if self.operator == Operator.EQUALS:
            return user_value == self.value
        elif self.operator == Operator.CONTAINS:
            return (
                self.value in user_value
                if isinstance(user_value, (list, set, str))
                else False
            )
        elif self.operator == Operator.GT:
            return (
                user_value > self.value
                if isinstance(user_value, (int, float))
                else False
            )
        elif self.operator == Operator.LT:
            return (
                user_value < self.value
                if isinstance(user_value, (int, float))
                else False
            )
        elif self.operator == Operator.IN:
            return (
                user_value in self.value
                if isinstance(self.value, (list, set))
                else False
            )
        elif self.operator == Operator.BETWEEN:
            if not isinstance(self.value, (list, tuple)) or len(self.value) != 2:
                return False
            return self.value[0] <= user_value <= self.value[1]
        elif self.operator == Operator.REGEX:
            import re

            try:
                return bool(re.match(self.value, str(user_value)))
            except (re.error, TypeError):
                logger.error(f"Invalid regex pattern: {self.value}")
                return False

        return False


class TrafficAllocator:
    """Handles traffic allocation for experiments."""

    @staticmethod
    def is_in_traffic(user_id: str, salt: str, percentage: float) -> bool:
        """Determine if user should be included in traffic."""
        if percentage >= 100:
            return True
        if percentage <= 0:
            return False

        hash_input = f"{salt}:{user_id}".encode()
        hash_value = int(hashlib.sha256(hash_input).hexdigest(), 16)
        return (hash_value % 10000) < (percentage * 100)  # More granular percentage


class ExperimentTargeting:
    """Manages targeting and traffic allocation for experiments."""

    def __init__(self):
        self._user_attributes: Dict[str, Dict[str, Any]] = {}
        self._traffic_allocator = TrafficAllocator()
        self._custom_attributes: Dict[str, Any] = {}

    def set_user_attributes(self, user_id: str, attributes: Dict[str, Any]) -> None:
        """Set or update user attributes."""
        self._user_attributes[user_id] = attributes

    def set_custom_attribute(self, name: str, value: Any):
        """Set a custom attribute for targeting (e.g., current_time for testing)."""
        self._custom_attributes[name] = value

    def is_user_eligible(
        self,
        user_id: str,
        rules: List[TargetingRule],
        traffic_percentage: float,
        required_segments: Optional[Set[str]] = None,
    ):
        """Check if user is eligible for an experiment."""
        # Get user attributes
        attributes = self._user_attributes.get(user_id, {})
        current_time = self._custom_attributes.get("current_time", datetime.now())

        # Check segments
        if required_segments:
            user_segments = set(attributes.get("segments", []))
            if not required_segments.intersection(user_segments):
                return False

        # Check targeting rules
        if not all(rule.matches(attributes, current_time) for rule in rules):
            return False

        # Check traffic allocation
        return self._traffic_allocator.is_in_traffic(
            user_id, "experiment", traffic_percentage
        )
