"""Analytics models module."""

from datetime import date, datetime
from typing import Any, Dict, Optional

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ...core.extensions import db


class UserMetrics(db.Model):
    """User metrics model."""

    __tablename__ = "user_metrics"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[date] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "metric_type": self.metric_type,
            "value": self.value,
            "period": self.period,
            "date": self.date.isoformat(),
            "created_at": self.created_at.isoformat(),
        }


class GameMetrics(db.Model):
    """Game metrics model."""

    __tablename__ = "game_metrics"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False)
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "game_id": self.game_id,
            "metric_type": self.metric_type,
            "value": self.value,
            "created_at": self.created_at.isoformat(),
        }


class VenueMetrics(db.Model):
    """Venue metrics model."""

    __tablename__ = "venue_metrics"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id"), nullable=False)
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[date] = mapped_column(DateTime, nullable=False)
    hour: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "venue_id": self.venue_id,
            "metric_type": self.metric_type,
            "value": self.value,
            "period": self.period,
            "date": self.date.isoformat(),
            "hour": self.hour,
            "created_at": self.created_at.isoformat(),
        }


class FeatureUsageMetrics(db.Model):
    """Feature usage metrics model."""

    __tablename__ = "feature_usage_metrics"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    context: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "feature_name": self.feature_name,
            "user_id": self.user_id,
            "action": self.action,
            "context": self.context,
            "created_at": self.created_at.isoformat(),
        }


class PerformanceMetrics(db.Model):
    """Performance metrics model."""

    __tablename__ = "performance_metrics"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    endpoint: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    component: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    context: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "metric_type": self.metric_type,
            "value": self.value,
            "endpoint": self.endpoint,
            "component": self.component,
            "context": self.context,
            "created_at": self.created_at.isoformat(),
        }


class AggregatedMetrics(db.Model):
    """Aggregated metrics model."""

    __tablename__ = "aggregated_metrics"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    dimension: Mapped[str] = mapped_column(String(50), nullable=False)
    dimension_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[date] = mapped_column(DateTime, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False)
    sum: Mapped[float] = mapped_column(Float, nullable=False)
    avg: Mapped[float] = mapped_column(Float, nullable=False)
    min: Mapped[float] = mapped_column(Float, nullable=False)
    max: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "metric_type": self.metric_type,
            "dimension": self.dimension,
            "dimension_id": self.dimension_id,
            "period": self.period,
            "date": self.date.isoformat(),
            "count": self.count,
            "sum": self.sum,
            "avg": self.avg,
            "min": self.min,
            "max": self.max,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
