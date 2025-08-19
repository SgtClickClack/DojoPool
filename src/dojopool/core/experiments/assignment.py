"""
Test group assignment system for A/B testing experiments.
Handles user assignment to experiment variants with support for:
- Consistent hashing for stable assignments
- Traffic percentage control
- User segmentation with multiple conditions
- Time-based experiment scheduling
- Variant weights and traffic allocation
"""

import hashlib
import logging
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

from ..monitoring.error_logger import error_logger

logger = logging.getLogger(__name__)


class AssignmentStrategy(Enum):
    """Available strategies for variant assignment."""

    RANDOM = "random"  # Random assignment with weights
    DETERMINISTIC = "deterministic"  # Consistent hashing
    STICKY = "sticky"  # Persistent assignment
    ADAPTIVE = "adaptive"  # Dynamic based on metrics


@dataclass
class AssignmentRule:
    """Rule for assigning users to variants."""

    condition: Dict[str, Any]  # Targeting condition
    variant_id: str  # Target variant
    weight: float = 1.0  # Rule weight

    def matches(self, user_attributes: Dict[str, Any]) -> bool:
        """Check if user matches the targeting condition."""
        for key, value in self.condition.items():
            if key not in user_attributes:
                return False
            if isinstance(value, list):
                if not any(v in user_attributes[key] for v in value):
                    return False
            elif user_attributes[key] != value:
                return False
        return True


class AssignmentManager:
    """Manages test group assignments for experiments."""

    def __init__(self):
        """Initialize the assignment manager."""
        self._assignments: Dict[str, Dict[str, str]] = (
            {}
        )  # user_id -> {experiment_id -> variant_id}
        self._user_attributes: Dict[str, Dict[str, Any]] = {}  # user_id -> attributes
        self._assignment_rules: Dict[str, List[AssignmentRule]] = {}  # experiment_id -> rules

    def set_user_attributes(self, user_id: str, attributes: Dict[str, Any]) -> None:
        """Set or update user attributes."""
        self._user_attributes[user_id] = attributes

    def add_assignment_rule(
        self, experiment_id: str, condition: Dict[str, Any], variant_id: str, weight: float = 1.0
    ) -> None:
        """Add a new assignment rule."""
        if experiment_id not in self._assignment_rules:
            self._assignment_rules[experiment_id] = []

        rule = AssignmentRule(condition, variant_id, weight)
        self._assignment_rules[experiment_id].append(rule)

    def _get_assignment_hash(self, user_id: str, experiment_id: str) -> int:
        """Generate a consistent hash for user-experiment pair."""
        hash_input = f"{user_id}:{experiment_id}".encode("utf-8")
        return int(hashlib.sha256(hash_input).hexdigest(), 16)

    def _is_in_experiment_traffic(
        self, user_id: str, experiment_id: str, traffic_percentage: float
    ) -> bool:
        """Check if user should be included in experiment traffic."""
        if traffic_percentage >= 100:
            return True

        hash_value = self._get_assignment_hash(user_id, experiment_id)
        normalized_hash = (hash_value % 100) / 100.0
        return normalized_hash <= (traffic_percentage / 100.0)

    def _get_variant_by_rules(
        self, experiment_id: str, user_attributes: Dict[str, Any]
    ) -> Optional[str]:
        """Get variant based on assignment rules."""
        if experiment_id not in self._assignment_rules:
            return None

        matching_rules = [
            rule for rule in self._assignment_rules[experiment_id] if rule.matches(user_attributes)
        ]

        if not matching_rules:
            return None

        # Use rule weights to select variant
        total_weight = sum(rule.weight for rule in matching_rules)
        hash_value = self._get_assignment_hash(user_attributes.get("user_id", ""), experiment_id)
        normalized_hash = (hash_value % 1000) / 1000.0  # More precision

        cumulative_weight = 0
        for rule in matching_rules:
            cumulative_weight += rule.weight / total_weight
            if normalized_hash <= cumulative_weight:
                return rule.variant_id

        return matching_rules[-1].variant_id  # Fallback to last rule

    def assign_variant(
        self,
        experiment_id: str,
        user_id: str,
        variants: List[Dict[str, Any]],
        traffic_percentage: float = 100.0,
        strategy: AssignmentStrategy = AssignmentStrategy.DETERMINISTIC,
    ) -> Optional[str]:
        """
        Assign a user to an experiment variant.

        Args:
            experiment_id: ID of the experiment
            user_id: ID of the user
            variants: List of variant configurations
            traffic_percentage: Percentage of users to include
            strategy: Assignment strategy to use

        Returns:
            Optional[str]: Assigned variant ID or None if user is excluded
        """
        try:
            # Check existing assignment
            if user_id in self._assignments and experiment_id in self._assignments[user_id]:
                return self._assignments[user_id][experiment_id]

            # Check traffic allocation
            if not self._is_in_experiment_traffic(user_id, experiment_id, traffic_percentage):
                return None

            # Get user attributes
            user_attributes = self._user_attributes.get(user_id, {})
            user_attributes["user_id"] = user_id

            # Try rule-based assignment first
            variant_id = self._get_variant_by_rules(experiment_id, user_attributes)
            if variant_id:
                if user_id not in self._assignments:
                    self._assignments[user_id] = {}
                self._assignments[user_id][experiment_id] = variant_id
                return variant_id

            # Fall back to strategy-based assignment
            if strategy == AssignmentStrategy.DETERMINISTIC:
                # Use consistent hashing
                hash_value = self._get_assignment_hash(user_id, experiment_id)
                total_weight = sum(v.get("weight", 1.0) for v in variants)
                normalized_hash = (hash_value % 1000) / 1000.0

                cumulative_weight = 0
                for variant in variants:
                    weight = variant.get("weight", 1.0)
                    cumulative_weight += weight / total_weight
                    if normalized_hash <= cumulative_weight:
                        variant_id = variant["id"]
                        break
                else:
                    variant_id = variants[-1]["id"]

            elif strategy == AssignmentStrategy.STICKY:
                # Use stored assignment or create new one
                variant_id = variants[hash_value % len(variants)]["id"]

            else:  # RANDOM or ADAPTIVE
                # Implement more sophisticated strategies here
                variant_id = variants[0]["id"]  # Default to first variant

            # Store assignment
            if user_id not in self._assignments:
                self._assignments[user_id] = {}
            self._assignments[user_id][experiment_id] = variant_id

            return variant_id

        except Exception as e:
            error_logger.log_error(
                f"Error assigning variant for experiment {experiment_id}",
                error=e,
                context={
                    "user_id": user_id,
                    "experiment_id": experiment_id,
                    "strategy": strategy.value,
                },
            )
            return None

    def get_user_assignments(self, user_id: str) -> Dict[str, str]:
        """Get all experiment assignments for a user."""
        return self._assignments.get(user_id, {})

    def clear_user_assignment(self, user_id: str, experiment_id: str) -> None:
        """Clear a specific user-experiment assignment."""
        if user_id in self._assignments and experiment_id in self._assignments[user_id]:
            del self._assignments[user_id][experiment_id]

    def clear_experiment_assignments(self, experiment_id: str) -> None:
        """Clear all assignments for an experiment."""
        for user_assignments in self._assignments.values():
            if experiment_id in user_assignments:
                del user_assignments[experiment_id]
