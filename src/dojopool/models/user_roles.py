"""User roles association module.

This module contains the user roles association table.
"""

from datetime import datetime

from .base import db

# Association table for user roles
user_roles = db.Table(
    "user_roles",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    db.Column("role_id", db.Integer, db.ForeignKey("roles.id"), primary_key=True),
    db.Column("created_at", db.DateTime, default=datetime.utcnow),
    extend_existing=True,
)
