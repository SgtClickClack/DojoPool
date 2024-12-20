"""Database mixins module."""

from datetime import datetime
from src.core.database import db

class TimestampMixin:
    """Mixin for adding timestamp fields."""
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 