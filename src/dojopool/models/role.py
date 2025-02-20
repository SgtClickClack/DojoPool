"""
Role model module.

This module contains the Role model for user roles and permissions.
"""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database.database import db
from .associations import user_roles

if TYPE_CHECKING:
    from .user import User


class Role(Base):
    """Role model."""

    __tablename__: str = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    # Permissions
    can_create_tournaments: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    can_edit_tournaments: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    can_delete_tournaments: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    can_manage_users: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    can_manage_roles: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    can_manage_venues: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    can_manage_games: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    can_manage_matches: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User", secondary=user_roles, back_populates="roles", lazy="select"
    )

    def __init__(
        self,
        name: str,
        description: Optional[str] = None,
        can_create_tournaments: bool = False,
        can_edit_tournaments: bool = False,
        can_delete_tournaments: bool = False,
        can_manage_users: bool = False,
        can_manage_roles: bool = False,
        can_manage_venues: bool = False,
        can_manage_games: bool = False,
        can_manage_matches: bool = False,
    ) -> None:
        """Initialize a new role.

        Args:
            name: Role name
            description: Role description
            can_create_tournaments: Whether the role can create tournaments
            can_edit_tournaments: Whether the role can edit tournaments
            can_delete_tournaments: Whether the role can delete tournaments
            can_manage_users: Whether the role can manage users
            can_manage_roles: Whether the role can manage roles
            can_manage_venues: Whether the role can manage venues
            can_manage_games: Whether the role can manage games
            can_manage_matches: Whether the role can manage matches
        """
        super().__init__()
        self.name = name
        self.description = description
        self.can_create_tournaments = can_create_tournaments
        self.can_edit_tournaments = can_edit_tournaments
        self.can_delete_tournaments = can_delete_tournaments
        self.can_manage_users = can_manage_users
        self.can_manage_roles = can_manage_roles
        self.can_manage_venues = can_manage_venues
        self.can_manage_games = can_manage_games
        self.can_manage_matches = can_manage_matches
        self.created_at = datetime.utcnow()

    def __repr__(self):
        """Return string representation."""
        return f"<Role {self.name}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert role to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
