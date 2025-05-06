"""
Authentication and authorization models.
"""

from datetime import datetime
from typing import List

from ...core.extensions import db


class Role(db.Model):
    """Role model for user permissions."""

    __tablename__ = "roles"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    permissions = db.Column(db.JSON)  # List of permission strings
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    users = db.relationship("User", secondary="user_roles", back_populates="roles")


# TODO: Remove duplicate User model to resolve SQLAlchemy registry conflicts.
# class User(db.Model):
#     ...


class UserRole(db.Model):
    """Association table for User-Role relationship."""

    __tablename__ = "user_roles"
    __table_args__ = (
        db.UniqueConstraint("user_id", "role_id", name="unique_user_role"),
        {"extend_existing": True},
    )

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), primary_key=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
