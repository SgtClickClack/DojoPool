"""
Variant types and classes for A/B testing experiments.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Any

class VariantType(Enum):
    """Types of variant values supported in experiments."""
    BOOLEAN = "boolean"
    STRING = "string"
    NUMBER = "number"
    JSON = "json"

@dataclass
class Variant:
    """Represents a variant in an A/B test experiment."""
    id: str
    name: str
    type: VariantType
    value: Any
    weight: float = 1.0  # Default to equal weighting 