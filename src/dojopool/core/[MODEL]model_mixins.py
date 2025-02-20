from flask_caching import Cache
from flask_caching import Cache
"""Model mixins for common functionality."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Type, TypeVar, Union
from uuid import UUID

from sqlalchemy import Column, DateTime, ForeignKey, Integer, inspect
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from dojopool.core.extensions import db

T = TypeVar("T", bound="BaseMixin")


class CRUDMixin:
    """Mixin that adds convenience methods for CRUD operations."""

    @classmethod
    def create(cls, **kwargs: Any) -> Any:
        """Create a new record and save it to the database.

        Args:
            **kwargs: Model attributes

        Returns:
            Newly created model instance
        """
        instance = cls(**kwargs)
        return instance.save()

    def update(self, commit: bool = True, **kwargs: Any):
        """Update specific fields of a record.

        Args:
            commit: Whether to commit changes
            **kwargs: Fields to update

        Returns:
            Updated model instance
        """
        for attr, value in kwargs.items():
            setattr(self, attr, value)
        return self.save() if commit else self

    def save(self, commit: bool = True):
        """Save the record.

        Args:
            commit: Whether to commit changes

        Returns:
            Saved model instance
        """
        db.session.add(self)
        if commit:
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                raise e
        return self

    def delete(self, commit: bool = True):
        """Remove the record from the database.

        Args:
            commit: Whether to commit changes
        """
        db.session.delete(self)
        if commit:
            try:
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                raise e


class SerializerMixin:
    """Mixin that adds serialization methods."""

    def to_dict(
        self,
        exclude: Optional[List[str]] = None,
        include: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Convert model to dictionary.

        Args:
            exclude: Fields to exclude
            include: Additional fields to include

        Returns:
            Model as dictionary
        """
        exclude = exclude or []
        data = {}

        for field in [
            x for x in dir(self) if not x.startswith("_") and x not in exclude
        ]:
            if hasattr(self, field):
                value = getattr(self, field)
                if not callable(value):
                    data[field] = value

        if include:
            for field in include:
                if hasattr(self, field):
                    value = getattr(self, field)
                    if not callable(value):
                        data[field] = value

        return data

    @classmethod
    def from_dict(cls: Type[T], data: Dict[str, Any]):
        """Create model from dictionary.

        Args:
            data: Dictionary of model attributes

        Returns:
            Model instance
        """
        return cls(**data)


class BaseMixin(CRUDMixin, SerializerMixin):
    """Base mixin that includes CRUD and serialization methods."""

    __table_args__ = {"extend_existing": True}

    @declared_attr
    def __tablename__(cls):
        """Get table name from class name."""
        return cls.__name__.lower()

    @classmethod
    def get_by_id(cls: Type[T], id: int):
        """Get record by ID.

        Args:
            id: Record ID

        Returns:
            Model instance if found, None otherwise
        """
        return cls.query.get(id)

    @classmethod
    def get_all(cls: Type[T]) -> List[T]:
        """Get all records.

        Returns:
            List of model instances
        """
        return cls.query.all()

    def __repr__(self):
        """Get string representation of model."""
        return f"<{self.__class__.__name__}({self.id})>"


class TimestampMixin:
    """Mixin that adds timestamp fields."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)


class TimestampedModel(BaseMixin, TimestampMixin):
    """Base model class that includes CRUD convenience methods and timestamp fields."""

    __abstract__: bool = True
