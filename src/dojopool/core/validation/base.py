"""Base validation module.

This module provides base validation classes and utilities.
"""

from dataclasses import dataclass
from typing import Any, Dict, Generic, Optional, TypeVar

from marshmallow import Schema, ValidationError

T = TypeVar("T")


@dataclass
class ValidationResult(Generic[T]):
    """Validation result container.

    Generic type T represents the type of validated data.
    """

    is_valid: bool
    data: Optional[T] = None
    errors: Optional[Dict[str, Any]] = None


class BaseValidator:
    """Base validator class."""

    def __init__(self, schema: Schema) -> None:
        """Initialize validator with schema.

        Args:
            schema: Marshmallow schema for validation
        """
        self.schema = schema

    def validate(self, data: Dict[str, Any]):
        """Validate data against schema.

        Args:
            data: Data to validate

        Returns:
            ValidationResult with validation status and results
        """
        try:
            validated_data = self.schema.load(data)
            return ValidationResult(is_valid=True, data=validated_data)
        except ValidationError as e:
            return ValidationResult(is_valid=False, errors=e.messages)

    def dump(self, obj: Any):
        """Serialize object according to schema.

        Args:
            obj: Object to serialize

        Returns:
            Serialized data
        """
        return self.schema.dump(obj)
