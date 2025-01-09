"""Base validation module.

This module provides base validation classes and utilities.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
from marshmallow import Schema, ValidationError


@dataclass
class ValidationResult:
    """Validation result container."""

    is_valid: bool
    data: Optional[Dict[str, Any]] = None
    errors: Optional[Dict[str, Any]] = None


class BaseValidator:
    """Base validator class."""

    def __init__(self, schema: Schema):
        """Initialize validator with schema."""
        self.schema = schema

    def validate(self, data: Dict[str, Any]) -> ValidationResult:
        """Validate data against schema.

        Args:
            data: Data to validate.

        Returns:
            ValidationResult: Result of validation.
        """
        try:
            validated_data = self.schema.load(data)
            return ValidationResult(is_valid=True, data=validated_data, errors=None)
        except ValidationError as e:
            return ValidationResult(is_valid=False, data=None, errors=e.messages)

    def dump(self, obj: Any) -> Dict[str, Any]:
        """Serialize object according to schema.

        Args:
            obj: Object to serialize.

        Returns:
            Dict[str, Any]: Serialized data.
        """
        return self.schema.dump(obj)
