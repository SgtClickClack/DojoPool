from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Type, TypeVar, Union
from uuid import UUID

from sqlalchemy import Column, DateTime, ForeignKey, Integer, inspect
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from dojopool.core.extensions import db

class CRUDMixin:
    pass

class SerializerMixin:
    pass

class BaseMixin(CRUDMixin, SerializerMixin):
    pass

class TimestampMixin:
    pass

class TimestampedModel(BaseMixin, TimestampMixin):
    pass
