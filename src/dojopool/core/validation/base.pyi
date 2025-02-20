"""Type stub for base validation module."""

from dataclasses import dataclass
from typing import Any, Dict, Generic, Optional, TypeVar

from marshmallow import Schema

T = TypeVar("T")

@dataclass
class ValidationResult(Generic[T]):
    is_valid: bool
    data: Optional[T]
    errors: Optional[Dict[str, Any]]

class BaseValidator:
    schema: Schema

    def __init__(self, schema: Schema) -> None: ...
    def validate(self, data: Dict[str, Any]) -> ValidationResult[Dict[str, Any]]: ...
    def dump(self, obj: Any) -> Dict[str, Any]: ...
