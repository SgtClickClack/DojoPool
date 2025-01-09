"""Model mixins for common functionality."""
from datetime import datetime
from typing import Any, Dict, List, Optional, Type, TypeVar
from sqlalchemy import Column, DateTime, Integer, inspect
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declared_attr

from .database import db

T = TypeVar('T', bound='Base')

class CRUDMixin:
    """Mixin that adds convenience methods for CRUD operations."""

    @classmethod
    def create(cls, **kwargs):
        """Create a new record and save it to the database."""
        instance = cls(**kwargs)
        return instance.save()

    def update(self, commit=True, **kwargs):
        """Update specific fields of a record."""
        for attr, value in kwargs.items():
            if hasattr(self, attr):
                setattr(self, attr, value)
        if commit:
            return self.save()
        return self

    def save(self, commit=True):
        """Save the record."""
        db.session.add(self)
        if commit:
            db.session.commit()
        return self

    def delete(self, soft=True, commit=True):
        """Remove the record from the database.
        
        Args:
            soft: If True, perform soft deletion by setting deleted_at.
            commit: Whether to commit the changes.
        """
        if soft and hasattr(self, 'deleted_at'):
            self.deleted_at = datetime.utcnow()
            return self.save() if commit else self
        db.session.delete(self)
        if commit:
            db.session.commit()

    def to_dict(
        self,
        exclude: Optional[List[str]] = None,
        include: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Convert model to dictionary.
        
        Args:
            exclude: List of fields to exclude.
            include: List of additional fields to include.
            
        Returns:
            Dict[str, Any]: Model attributes.
        """
        exclude = exclude or []
        data = {}
        
        # Get all column properties
        for column in inspect(self.__class__).attrs:
            if column.key not in exclude:
                value = getattr(self, column.key)
                if isinstance(value, datetime):
                    data[column.key] = value.isoformat()
                else:
                    data[column.key] = value
        
        # Add additional fields
        if include:
            for field in include:
                if hasattr(self, field) and field not in exclude:
                    value = getattr(self, field)
                    if isinstance(value, datetime):
                        data[field] = value.isoformat()
                    else:
                        data[field] = value
        
        return data

    @classmethod
    def from_dict(cls: Type[T], data: Dict[str, Any]) -> T:
        """Create a new record from dictionary data.
        
        Args:
            data: Dictionary containing record data.
            
        Returns:
            T: New record instance.
        """
        return cls(**{
            key: value for key, value in data.items()
            if hasattr(cls, key)
        })

class TimestampMixin:
    """Mixin that adds timestamp fields."""

    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)

class Base(db.Model, CRUDMixin):
    """Base model class that includes CRUD convenience methods."""

    __abstract__ = True

    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name automatically."""
        return cls.__name__.lower() + 's'

    id = Column(Integer, primary_key=True)

    @classmethod
    def get_by_id(cls: Type[T], id: int) -> Optional[T]:
        """Get a record by ID."""
        return cls.query.get(id)

    @classmethod
    def get_all(cls: Type[T]) -> List[T]:
        """Get all non-deleted records."""
        if hasattr(cls, 'deleted_at'):
            return cls.query.filter_by(deleted_at=None).all()
        return cls.query.all()

    def __repr__(self) -> str:
        """String representation of the record."""
        return f"<{self.__class__.__name__}(id={self.id})>"

class TimestampedModel(Base, TimestampMixin):
    """Base model class that includes CRUD convenience methods and timestamp fields."""

    __abstract__ = True
