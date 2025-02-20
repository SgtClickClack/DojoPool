from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from flask_login import UserMixin
from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db

class User(db.Model, UserMixin):
    pass

    rank_streak_type: Mapped[Optional[str]] = mapped_column(nullable=True)
