"""Database mixins module."""

from datetime import datetime
from ..extensions import db

class TimestampMixin:
    """Mixin for adding timestamp fields."""
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 