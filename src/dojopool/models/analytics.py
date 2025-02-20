"""Analytics models for tracking metrics and statistics."""

from datetime import date, datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db
from ..core.models.base import BaseModel

if TYPE_CHECKING:
    from .game import Game
    from .user import User
    from .venue import Venue


class UserMetrics(BaseModel):
    """User activity and performance metrics."""

    __tablename__ = "user_metrics"
    __table_args__ = {"extend_existing": True}

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="metrics")

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        base_dict = super().to_dict()
        metric_dict = {
            "user_id": self.user_id,
            "metric_type": self.metric_type,
            "value": self.value,
            "period": self.period,
            "date": self.date.isoformat(),
        }
        return {**base_dict, **metric_dict}


class GameMetrics(BaseModel):
    """Game-related metrics and statistics."""

    __tablename__ = "game_metrics"
    __table_args__ = {"extend_existing": True}

    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False)
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    game: Mapped["Game"] = relationship("Game", back_populates="metrics")

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        base_dict = super().to_dict()
        metric_dict = {
            "game_id": self.game_id,
            "metric_type": self.metric_type,
            "value": self.value,
        }
        return {**base_dict, **metric_dict}


class VenueMetrics(BaseModel):
    """Venue usage and performance metrics."""

    __tablename__ = "venue_metrics"
    __table_args__ = {"extend_existing": True}

    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id"), nullable=False)
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    hour: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    venue: Mapped["Venue"] = relationship("Venue", back_populates="metrics")

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        base_dict = super().to_dict()
        metric_dict = {
            "venue_id": self.venue_id,
            "metric_type": self.metric_type,
            "value": self.value,
            "period": self.period,
            "date": self.date.isoformat(),
            "hour": self.hour,
        }
        return {**base_dict, **metric_dict}


class FeatureUsageMetrics(BaseModel):
    """Feature usage and engagement metrics."""

    __tablename__ = "feature_usage_metrics"
    __table_args__ = {"extend_existing": True}

    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    context: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="feature_usage")

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        base_dict = super().to_dict()
        metric_dict = {
            "feature_name": self.feature_name,
            "user_id": self.user_id,
            "action": self.action,
            "context": self.context,
        }
        return {**base_dict, **metric_dict}


class PerformanceMetrics(BaseModel):
    """System performance and technical metrics."""

    __tablename__ = "performance_metrics"
    __table_args__ = {"extend_existing": True}

    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    endpoint: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    component: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    context: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        base_dict = super().to_dict()
        metric_dict = {
            "metric_type": self.metric_type,
            "value": self.value,
            "endpoint": self.endpoint,
            "component": self.component,
            "context": self.context,
        }
        return {**base_dict, **metric_dict}


class AggregatedMetrics(BaseModel):
    """Pre-aggregated metrics for faster dashboard loading."""

    __tablename__ = "aggregated_metrics"
    __table_args__ = {"extend_existing": True}

    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    dimension: Mapped[str] = mapped_column(String(50), nullable=False)
    dimension_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sum: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    avg: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    percentile_90: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        """Convert aggregated metric to dictionary."""
        base_dict = super().to_dict()
        metric_dict = {
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
            "percentile_90": self.percentile_90,
        }
        return {**base_dict, **metric_dict}


__all__ = [
    "UserMetrics",
    "GameMetrics",
    "VenueMetrics",
    "FeatureUsageMetrics",
    "PerformanceMetrics",
    "AggregatedMetrics",
]
