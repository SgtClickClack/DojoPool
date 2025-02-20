from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..models import db

class Payment(Base):
    pass

    payment_type: Mapped[str] = mapped_column(String(50), nullable=False)

class Subscription(Base):
    pass

    plan_type: Mapped[str] = mapped_column(String(50), nullable=False)

class PricingPlan(Base):
    pass
