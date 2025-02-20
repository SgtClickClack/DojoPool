"""Base model class for DojoPool."""

from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import Boolean, DateTime, Integer
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from ..extensions import db


class BaseModel(db.Model):
    """Base model class with common functionality."""

    __abstract__ = True
    __allow_unmapped__ = True

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    _is_deleted: Mapped[bool] = mapped_column("is_deleted", Boolean, default=False)

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
            "is_deleted": self._is_deleted,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create model instance from dictionary."""
        instance = cls()
        instance.id = data.get("id")
        instance.created_at = (
            datetime.fromisoformat(data["created_at"])
            if data.get("created_at")
            else None
        )
        instance.updated_at = (
            datetime.fromisoformat(data["updated_at"])
            if data.get("updated_at")
            else None
        )
        instance.deleted_at = (
            datetime.fromisoformat(data["deleted_at"])
            if data.get("deleted_at")
            else None
        )
        instance._is_deleted = data.get("is_deleted", False)
        return instance

    def update(self, data: Dict[str, Any]):
        """Update model with new data."""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()

    def delete(self):
        """Soft delete the model."""
        self._is_deleted = True
        self.deleted_at = datetime.utcnow()

    def restore(self) -> None:
        """Restore a soft-deleted model."""
        self._is_deleted = False
        self.deleted_at = None

    @property
    def is_deleted(self) -> bool:
        """Check if model is deleted."""
        return self._is_deleted

    def validate(self):
        """
        Validate model data.
        Override in subclasses to implement specific validation.
        """
        return True

    def __repr__(self):
        """String representation of model."""
        return f"<{self.__class__.__name__} {self.id}>"
