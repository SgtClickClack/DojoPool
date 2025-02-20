from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..models import Base

class TrainingProgram(Base):
    pass

class Exercise(Base):
    pass

    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # shot_practice, drill, challenge

class UserProgress(Base):
    pass
