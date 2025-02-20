"""Table model module."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db
from ..core.models.base import BaseModel
from .venue import Venue


class TableType(str, Enum):
    """Table type enumeration."""

    STANDARD: str = "standard"
    TOURNAMENT = "tournament"
    SNOOKER = "snooker"
    CAROM = "carom"


class TableStatus(str, Enum):
    """Table status enumeration."""

    AVAILABLE: str = "available"
    IN_USE: str = "in_use"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"
    OFFLINE: str = "offline"


class Table(BaseModel):
    """Table model."""

    __tablename__: str = "tables"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    venue_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("venues.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    table_type: Mapped[TableType] = mapped_column(SQLEnum(TableType), nullable=False)
    status: Mapped[TableStatus] = mapped_column(
        SQLEnum(TableStatus), nullable=False, default=TableStatus.AVAILABLE
    )
    qr_code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # URL or path to QR code image
    last_qr_refresh: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    venue: Mapped["Venue"] = relationship("Venue", back_populates="tables")
    games: Mapped[List["Game"]] = relationship("Game", back_populates="table")
    tournament_matches: Mapped[List["TournamentMatch"]] = relationship(
        "TournamentMatch", back_populates="table"
    )

    def __init__(
        self,
        venue_id: int,
        name: str,
        table_type: TableType,
        status: Optional[TableStatus] = None,
        qr_code: Optional[str] = None,
    ) -> None:
        """Initialize a new table.

        Args:
            venue_id: Venue ID
            name: Table name
            table_type: Table type
            status: Optional table status
            qr_code: Optional QR code URL/path
        """
        super().__init__()
        self.venue_id = venue_id
        self.name = name
        self.table_type = table_type
        self.status = status or TableStatus.AVAILABLE
        self.qr_code = qr_code
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def __repr__(self):
        """Get string representation.

        Returns:
            String representation
        """
        return f"<Table {self.name}>"
