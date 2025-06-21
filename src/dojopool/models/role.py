"""
Role Model Module

This module defines the Role model which specifies the user roles in the DojoPool platform.
It is enhanced with full type annotations and concise documentation.
"""

from typing import Any
from datetime import datetime
from dojopool.extensions import db  # type: ignore


class Role(db.Model):
    """Role model class."""

    __tablename__ = "roles"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)  # type: int
    name = db.Column(db.String(50), unique=True, nullable=False)  # type: str
    description = db.Column(db.String(255), nullable=True)  # type: str
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, name, description=None):
        """Initialize role."""
        self.name = name
        self.description = description

    def __repr__(self) -> str:
        """
        Returns the string representation of the Role.

        Returns:
            str: A summary representation of the role.
        """
        return f"<Role {self.name}>"
