"""Staff member model with complete type annotations."""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db


class StaffMember(Base):
    """Staff member model with complete type annotations."""

    __tablename__ = "staff_member"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id"), nullable=False)
    role: Mapped[str] = mapped_column(nullable=False)
    start_date: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="staff_roles")
    venue: Mapped["Venue"] = relationship(back_populates="staff")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<StaffMember {self.user_id} at {self.venue_id}>"
