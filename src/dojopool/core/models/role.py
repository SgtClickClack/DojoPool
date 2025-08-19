"""Role model module."""

from datetime import datetime
from typing import Dict, Any

from ...core.extensions import db


class Role(db.Model):
    """Role model for user permissions."""

    __tablename__ = "roles"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    permissions = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, name: str, description: str = None, permissions: Dict[str, Any] = None):
        """Initialize role."""
        self.name = name
        self.description = description
        self.permissions = permissions or {}

    def __repr__(self):
        """String representation of the role."""
        return f"<Role {self.name}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert role to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "permissions": self.permissions,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def has_permission(self, permission: str) -> bool:
        """Check if role has a specific permission.

        Args:
            permission: Permission to check

        Returns:
            bool: True if role has permission
        """
        return bool(self.permissions.get(permission, False))

    def add_permission(self, permission: str) -> None:
        """Add a permission to the role.

        Args:
            permission: Permission to add
        """
        if not self.permissions:
            self.permissions = {}
        self.permissions[permission] = True
        self.updated_at = datetime.utcnow()

    def remove_permission(self, permission: str) -> None:
        """Remove a permission from the role.

        Args:
            permission: Permission to remove
        """
        if self.permissions and permission in self.permissions:
            del self.permissions[permission]
            self.updated_at = datetime.utcnow()
