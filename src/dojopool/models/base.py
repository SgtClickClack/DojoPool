"""Base model module.

This module contains the base model class for SQLAlchemy models.
"""
from datetime import datetime
from typing import Dict, Any
from dojopool.core.extensions import db

class BaseModel(db.Model):
    """Base model class."""
    __abstract__ = True
    
    def save(self) -> None:
        """Save the model instance."""
        db.session.add(self)
        db.session.commit()
    
    def delete(self) -> None:
        """Delete the model instance."""
        db.session.delete(self)
        db.session.commit()
    
    @classmethod
    def get_by_id(cls, id: int) -> Any:
        """Get model instance by ID."""
        return cls.query.get(id)
    
    @classmethod
    def get_all(cls) -> Any:
        """Get all model instances."""
        return cls.query.all()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model instance to dictionary."""
        raise NotImplementedError("Subclasses must implement to_dict()")
    
    def update(self, data: Dict[str, Any]) -> None:
        """Update model instance with dictionary data."""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        db.session.commit()
    
    @classmethod
    def create(cls, **kwargs) -> Any:
        """Create a new model instance."""
        instance = cls(**kwargs)
        db.session.add(instance)
        db.session.commit()
        return instance

class TimestampedModel(BaseModel):
    """Base model class with timestamp fields."""
    __abstract__ = True
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model instance to dictionary."""
        return {
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

__all__ = ['BaseModel', 'TimestampedModel']