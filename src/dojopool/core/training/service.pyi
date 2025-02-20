from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import ForeignKey, desc
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..ai.service import AIService
from ..models import db
from .models import Exercise, TrainingProgram, UserProgress

class TrainingService:
    pass
