"""Analytics models module."""

from datetime import datetime
from typing import Any, Dict

from sqlalchemy import JSON, Column, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .base import BaseModel


class UserMetrics(BaseModel):
    """User-related metrics and statistics."""

    __tablename__ = "user_metrics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    metric_type = Column(
        String(50), nullable=False
    )  # e.g., 'games_played', 'win_rate', 'skill_rating'
    value = Column(Float, nullable=False)
    period = Column(String(20), nullable=False)  # 'daily', 'weekly', 'monthly'
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="metrics")

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "metric_type": self.metric_type,
            "value": self.value,
            "period": self.period,
            "date": self.date.isoformat(),
            "created_at": self.created_at.isoformat(),
        }


class GameMetrics(BaseModel):
    """Game-related metrics and statistics."""

    __tablename__ = "game_metrics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    metric_type = Column(String(50), nullable=False)  # e.g., 'duration', 'shots_taken', 'accuracy'
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    game = relationship("Game", backref="metrics")

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            "id": self.id,
            "game_id": self.game_id,
            "metric_type": self.metric_type,
            "value": self.value,
            "created_at": self.created_at.isoformat(),
        }


class VenueMetrics(BaseModel):
    """Venue usage and performance metrics."""

    __tablename__ = "venue_metrics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    metric_type = Column(
        String(50), nullable=False
    )  # e.g., 'occupancy_rate', 'revenue', 'games_played'
    value = Column(Float, nullable=False)
    period = Column(String(20), nullable=False)  # 'hourly', 'daily', 'weekly', 'monthly'
    date = Column(Date, nullable=False)
    hour = Column(Integer, nullable=True)  # For hourly metrics
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    venue = relationship("Venue", backref="metrics")

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
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


class FeatureUsageMetrics(BaseModel):
    """Feature usage and engagement metrics."""

    __tablename__ = "feature_usage_metrics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    feature_name = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)  # e.g., 'view', 'click', 'complete'
    context = Column(JSON, nullable=True)  # Additional context about the action
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="feature_usage")

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            "id": self.id,
            "feature_name": self.feature_name,
            "user_id": self.user_id,
            "action": self.action,
            "context": self.context,
            "created_at": self.created_at.isoformat(),
        }


class PerformanceMetrics(BaseModel):
    """System performance and technical metrics."""

    __tablename__ = "performance_metrics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    metric_type = Column(
        String(50), nullable=False
    )  # e.g., 'response_time', 'error_rate', 'cpu_usage'
    value = Column(Float, nullable=False)
    endpoint = Column(String(200), nullable=True)  # For API metrics
    component = Column(String(100), nullable=True)  # For system component metrics
    context = Column(JSON, nullable=True)  # Additional context
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            "id": self.id,
            "metric_type": self.metric_type,
            "value": self.value,
            "endpoint": self.endpoint,
            "component": self.component,
            "context": self.context,
            "created_at": self.created_at.isoformat(),
        }


class AggregatedMetrics(BaseModel):
    """Aggregated metrics for various dimensions."""

    __tablename__ = "aggregated_metrics"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    metric_type = Column(String(50), nullable=False)
    dimension = Column(String(50), nullable=False)  # e.g., 'user', 'venue', 'game'
    dimension_id = Column(Integer, nullable=True)  # ID of the dimension entity
    period = Column(String(20), nullable=False)  # 'daily', 'weekly', 'monthly'
    date = Column(Date, nullable=False)
    value = Column(Float, nullable=False)
    sample_size = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            "id": self.id,
            "metric_type": self.metric_type,
            "dimension": self.dimension,
            "dimension_id": self.dimension_id,
            "period": self.period,
            "date": self.date.isoformat(),
            "value": self.value,
            "sample_size": self.sample_size,
            "created_at": self.created_at.isoformat(),
        }
