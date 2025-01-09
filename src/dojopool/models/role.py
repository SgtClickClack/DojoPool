"""Role model module."""
from datetime import datetime

from dojopool.core.extensions import db

class Role(db.Model):
    """Role model class."""

    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                          onupdate=datetime.utcnow)

    def __init__(self, name, description=None):
        """Initialize role."""
        self.name = name
        self.description = description

    def __repr__(self):
        """Represent role as string."""
        return f'<Role {self.name}>' 