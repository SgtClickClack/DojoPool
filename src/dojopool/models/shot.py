"""Shot model module.

This module contains the Shot model for tracking shots in a game.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON

from .base import BaseModel, db


class ShotBusinessModel:
    """Business logic or Pydantic shot model (not a SQLAlchemy table)."""
    # Add business logic or Pydantic fields here as needed.
    pass
