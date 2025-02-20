from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import Base

class PlayerRating(Base):
    pass
