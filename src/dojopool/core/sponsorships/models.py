from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..models import db


class Sponsor(Base):
    __tablename__: str = "sponsors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    logo_url: Mapped[str] = mapped_column(String(500))
    website: Mapped[str] = mapped_column(String(500))
    contact_email: Mapped[str] = mapped_column(String(255))
    contact_phone: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(
        String(50), default="active"
    )  # active, inactive, pending
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    deals: Mapped[List[SponsorshipDeal]] = relationship(
        "SponsorshipDeal", back_populates="sponsor"
    )


class SponsorshipTier(Base):
    __tablename__: str = "sponsorship_tiers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # bronze, silver, gold, platinum
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    benefits: Mapped[str] = mapped_column(Text)  # JSON string of benefits
    max_sponsors: Mapped[int] = mapped_column(
        Integer
    )  # Maximum number of sponsors allowed at this tier
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    deals: Mapped[List[SponsorshipDeal]] = relationship(
        "SponsorshipDeal", back_populates="tier"
    )


class SponsorshipDeal(Base):
    __tablename__: str = "sponsorship_deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sponsor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sponsors.id"), nullable=False
    )
    tier_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sponsorship_tiers.id"), nullable=False
    )
    venue_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("venues.id"), nullable=True
    )  # Optional venue-specific sponsorship
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # active, expired, cancelled
    payment_status: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # paid, pending, failed
    stripe_payment_id: Mapped[str] = mapped_column(String(255))
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    sponsor: Mapped[List[Sponsor]] = relationship("Sponsor", back_populates="deals")
    tier: Mapped[List[SponsorshipTier]] = relationship(
        "SponsorshipTier", back_populates="deals"
    )
    venue: Mapped[List[Venue]] = relationship(
        "Venue", back_populates="sponsorship_deals"
    )
