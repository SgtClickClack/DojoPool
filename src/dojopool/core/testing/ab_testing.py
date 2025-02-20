import gc
import gc
"""
A/B Testing framework for managing experiments, variants, and user allocation.
Supports multiple concurrent experiments, user segmentation, and metrics tracking.
"""

import hashlib
import logging
import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


class VariantType(Enum):
    """Types of variants supported in experiments."""

    BOOLEAN = "boolean"  # True/False variants
    STRING = "string"  # String-based variants
    NUMBER = "number"  # Numeric variants
    JSON = "json"  # Complex JSON variants


class TargetingRule:
    """Rule for targeting specific users."""

    def __init__(self, condition: Dict[str, Any]):
        self.condition = condition

    def matches(self, user_attributes: Dict[str, Any]) -> bool:
        """Check if user matches the targeting rule."""
        for key, value in self.condition.items():
            if key not in user_attributes:
                return False
            if isinstance(value, list):
                if user_attributes[key] not in value:
                    return False
            elif user_attributes[key] != value:
                return False
        return True


@dataclass
class ExperimentSchedule:
    """Schedule for experiment activation."""

    start_date: datetime
    end_date: Optional[datetime] = None
    days_of_week: Optional[List[int]] = None  # 0=Monday, 6=Sunday
    hours_of_day: Optional[List[int]] = None  # 0-23
    timezone: str = "UTC"


@dataclass
class Variant:
    """Represents a variant in an experiment."""

    id: str
    name: str
    type: VariantType
    value: Any
    weight: float = 1.0  # Relative weight for allocation
    traffic_percentage: float = 100.0  # Percentage of eligible users to include


@dataclass
class Experiment:
    """Represents an A/B test experiment."""

    id: str
    name: str
    description: str
    variants: List[Variant]
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool = True
    user_segments: Set[str] = field(default_factory=set)
    targeting_rules: List[TargetingRule] = field(default_factory=list)
    schedule: Optional[ExperimentSchedule] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    traffic_percentage: float = 100.0  # Overall experiment traffic percentage

    def __post_init__(self):
        """Initialize optional fields with default values."""
        if self.user_segments is None:
            self.user_segments = set()
        if self.metadata is None:
            self.metadata = {}
        if self.targeting_rules is None:
            self.targeting_rules = []

    def is_user_eligible(self, user_attributes: Dict[str, Any]) -> bool:
        """Check if user is eligible for the experiment."""
        # Check user segments
        if self.user_segments:
            user_segments = set(user_attributes.get("segments", []))
            if not self.user_segments.intersection(user_segments):
                return False

        # Check targeting rules
        for rule in self.targeting_rules:
            if not rule.matches(user_attributes):
                return False

        return True

    def is_scheduled_active(self, current_time: datetime):
        """Check if experiment is active based on schedule."""
        if not self.schedule:
            return True

        if current_time < self.schedule.start_date:
            return False

        if self.schedule.end_date and current_time > self.schedule.end_date:
            return False

        if self.schedule.days_of_week:
            if current_time.weekday() not in self.schedule.days_of_week:
                return False

        if self.schedule.hours_of_day:
            if current_time.hour not in self.schedule.hours_of_day:
                return False

        return True


class ABTestManager:
    """Manages A/B test experiments and user allocation."""

    def __init__(self):
        """Initialize the A/B test manager."""
        self._experiments: Dict[str, Experiment] = {}
        self._user_allocations: Dict[str, str] = {}  # assignment_key -> variant_id
        self._user_attributes_cache: Dict[str, Dict[str, Any]] = (
            {}
        )  # Cache for user attributes

    def set_user_attributes(self, user_id: str, attributes: Dict[str, Any]) -> None:
        """Set or update user attributes for targeting."""
        self._user_attributes_cache[user_id] = attributes

    def get_user_attributes(self, user_id: str):
        """Get cached user attributes."""
        return self._user_attributes_cache.get(user_id, {})

    def _is_user_in_experiment_traffic(self, user_id: str, experiment: Experiment):
        """Determine if user should be included in experiment traffic."""
        hash_input = f"{experiment.id}:traffic:{user_id}".encode()
        hash_value = int(hashlib.sha256(hash_input).hexdigest(), 16)
        normalized_hash = (hash_value % 100) / 100.0
        return normalized_hash <= (experiment.traffic_percentage / 100.0)

    def _is_user_in_variant_traffic(self, user_id: str, variant: Variant):
        """Determine if user should be included in variant traffic."""
        hash_input = f"{variant.id}:traffic:{user_id}".encode()
        hash_value = int(hashlib.sha256(hash_input).hexdigest(), 16)
        normalized_hash = (hash_value % 100) / 100.0
        return normalized_hash <= (variant.traffic_percentage / 100.0)

    def get_variant(self, experiment_id: str, user_id: str) -> Optional[Variant]:
        """Get the variant for a user, considering targeting and traffic rules."""
        experiment = self._experiments.get(experiment_id)
        if not experiment or not experiment.is_active:
            return None

        # Check if experiment is currently scheduled
        if not experiment.is_scheduled_active(datetime.now()):
            return None

        # Check user eligibility
        user_attributes = self.get_user_attributes(user_id)
        if not experiment.is_user_eligible(user_attributes):
            return None

        # Check experiment traffic allocation
        if not self._is_user_in_experiment_traffic(user_id, experiment):
            return None

        # Get or create variant assignment
        assignment_key = self.get_assignment_key(experiment_id, user_id)
        variant_id = self._user_allocations.get(assignment_key)
        if variant_id:
            variant = next((v for v in experiment.variants if v.id == variant_id), None)
            if variant and self._is_user_in_variant_traffic(user_id, variant):
                return variant

        # Assign new variant
        eligible_variants = [
            v
            for v in experiment.variants
            if self._is_user_in_variant_traffic(user_id, v)
        ]
        if not eligible_variants:
            return None

        # Use weighted random selection
        total_weight = sum(v.weight for v in eligible_variants)
        random_value = random.uniform(0, total_weight)
        cumulative_weight = 0

        for variant in eligible_variants:
            cumulative_weight += variant.weight
            if random_value <= cumulative_weight:
                self._user_allocations[assignment_key] = variant.id
                return variant

        return eligible_variants[-1] if eligible_variants else None

    @staticmethod
    def get_assignment_key(experiment_id: str, user_id: str) -> str:
        """Generate a unique key for user-experiment assignment."""
        return f"{experiment_id}:{user_id}"

    def create_experiment(
        self,
        name: str,
        description: str,
        variants: List[Variant],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_segments: Optional[Set[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create a new experiment."""
        try:
            # Generate stable ID from name
            exp_id = hashlib.sha256(name.encode()).hexdigest()[:12]

            # Validate variants
            if not variants or len(variants) < 2:
                raise ValueError("Experiment must have at least 2 variants")

            # Normalize weights
            total_weight = sum(v.weight for v in variants)
            for variant in variants:
                variant.weight = variant.weight / total_weight

            # Create experiment
            experiment = Experiment(
                id=exp_id,
                name=name,
                description=description,
                variants=variants,
                start_date=start_date or datetime.now(),
                end_date=end_date,
                is_active=True,
                user_segments=user_segments or set(),
                metadata=metadata or {},
            )

            self._experiments[exp_id] = experiment
            return exp_id

        except Exception as e:
            logger.error(f"Error creating experiment: {str(e)}")
            raise

    def update_experiment(
        self,
        experiment_id: str,
        is_active: Optional[bool] = None,
        end_date: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Update an existing experiment."""
        try:
            experiment = self._experiments.get(experiment_id)
            if not experiment:
                return False

            if is_active is not None:
                experiment.is_active = is_active

            if end_date is not None:
                experiment.end_date = end_date

            if metadata is not None:
                experiment.metadata.update(metadata)

            return True

        except Exception as e:
            logger.error(f"Error updating experiment: {str(e)}")
            return False

    def get_experiment(self, experiment_id: str):
        """Get experiment details."""
        return self._experiments.get(experiment_id)

    def get_active_experiments(self):
        """Get all active experiments."""
        return [
            exp
            for exp in self._experiments.values()
            if exp.is_active and (not exp.end_date or datetime.now() <= exp.end_date)
        ]

    def get_user_variants(self, user_id: str) -> Dict[str, Variant]:
        """Get all variants assigned to a user."""
        result = {}
        user_allocations = self._user_allocations.get(user_id, {})

        for exp_id, variant_id in user_allocations.items():
            experiment = self._experiments.get(exp_id)
            if experiment and experiment.is_active:
                variant = next(
                    (v for v in experiment.variants if v.id == variant_id), None
                )
                if variant:
                    result[exp_id] = variant

        return result
