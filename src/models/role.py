"""Role model for user roles."""

from datetime import datetime
from src.core.database import db
from src.core.mixins import TimestampMixin
from .associations import user_roles

class Role(TimestampMixin, db.Model):
    """Model for user roles."""
    
    __tablename__ = 'roles'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    permissions = db.Column(db.JSON)  # JSON array of permission strings
    
    # Relationships
    users = db.relationship('User', secondary=user_roles, back_populates='roles')
    
    def __repr__(self):
        """String representation."""
        return f'<Role {self.name}>'
    
    def to_dict(self):
        """Convert role to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'permissions': self.permissions,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 