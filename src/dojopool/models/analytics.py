"""Analytics models for tracking metrics and statistics."""

from datetime import datetime
from typing import Any, Dict

from dojopool.extensions import db


class UserMetrics(db.Model):
    """User activity and performance metrics."""

    __tablename__ = "user_metrics"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    metric_type = db.Column(
        db.String(50), nullable=False
    )  # e.g., 'games_played', 'win_rate', 'avg_score'
    value = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), nullable=False)  # 'daily', 'weekly', 'monthly', 'all_time'
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="user_metrics")

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


# Canonical GameMetrics model is defined elsewhere (core or analytics). This definition is commented out to prevent duplicate table errors.
# class GameMetrics(db.Model):
#     """Game-related metrics and statistics."""
# 
#     __tablename__ = "game_metrics"
# 
#     id = db.Column(db.Integer, primary_key=True)
#     game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
#     metric_type = db.Column(
#         db.String(50), nullable=False
#     )  # e.g., 'duration', 'shots_taken', 'accuracy'
#     value = db.Column(db.Float, nullable=False)
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)
# 
#     # Relationships
#     game = db.relationship("Game", backref="metrics")
# 
#     def to_dict(self) -> Dict[str, Any]:
#         """Convert metric to dictionary."""
#         return {
#             "id": self.id,
#             "game_id": self.game_id,
#             "metric_type": self.metric_type,
#             "value": self.value,
#             "created_at": self.created_at.isoformat(),
#         }


# Canonical VenueMetrics model is defined elsewhere (core or analytics). This definition is commented out to prevent duplicate table errors.
# class VenueMetrics(db.Model):
#     """Venue usage and performance metrics."""
# 
#     __tablename__ = "venue_metrics"
# 
#     id = db.Column(db.Integer, primary_key=True)
#     venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"), nullable=False)
#     metric_type = db.Column(
#         db.String(50), nullable=False
#     )  # e.g., 'occupancy_rate', 'revenue', 'games_played'
#     value = db.Column(db.Float, nullable=False)
#     period = db.Column(db.String(20), nullable=False)  # 'hourly', 'daily', 'weekly', 'monthly'
#     date = db.Column(db.Date, nullable=False)
#     hour = db.Column(db.Integer, nullable=True)  # For hourly metrics
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)
# 
#     # Relationships
#     venue = db.relationship("Venue", backref="metrics")
# 
#     def to_dict(self) -> Dict[str, Any]:
#         """Convert metric to dictionary."""
#         return {
#             "id": self.id,
#             "venue_id": self.venue_id,
#             "metric_type": self.metric_type,
#             "value": self.value,
#             "period": self.period,
#             "date": self.date.isoformat(),
#             "hour": self.hour,
#             "created_at": self.created_at.isoformat(),
#         }


# Canonical FeatureUsageMetrics model is defined elsewhere (core or analytics). This definition is commented out to prevent duplicate table errors.
# class FeatureUsageMetrics(db.Model):
#     """Feature usage metrics for tracking user engagement with platform features."""
#     __tablename__ = "feature_usage_metrics"
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
#     feature_name = db.Column(db.String(50), nullable=False)
#     usage_count = db.Column(db.Integer, nullable=False, default=0)
#     last_used = db.Column(db.DateTime, default=datetime.utcnow)
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)
#     user = db.relationship("User", backref="feature_metrics")
#     def to_dict(self) -> Dict[str, Any]:
#         return {
#             "id": self.id,
#             "user_id": self.user_id,
#             "feature_name": self.feature_name,
#             "usage_count": self.usage_count,
#             "last_used": self.last_used.isoformat() if self.last_used else None,
#             "created_at": self.created_at.isoformat(),
#         }


# Canonical PerformanceMetrics model is defined elsewhere (core or analytics). This definition is commented out to prevent duplicate table errors.
# class PerformanceMetrics(db.Model):
#     """Performance metrics for tracking system and user performance."""
#     __tablename__ = "performance_metrics"
#     id = db.Column(db.Integer, primary_key=True)
#     entity_id = db.Column(db.Integer, nullable=False)
#     entity_type = db.Column(db.String(50), nullable=False)  # e.g., 'user', 'venue', 'system'
#     metric_type = db.Column(db.String(50), nullable=False)
#     value = db.Column(db.Float, nullable=False)
#     recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
#     def to_dict(self) -> Dict[str, Any]:
#         return {
#             "id": self.id,
#             "entity_id": self.entity_id,
#             "entity_type": self.entity_type,
#             "metric_type": self.metric_type,
#             "value": self.value,
#             "recorded_at": self.recorded_at.isoformat(),
#         }


# Canonical AggregatedMetrics model is defined elsewhere (core or analytics). This definition is commented out to prevent duplicate table errors, following the established modular model pattern.
# class AggregatedMetrics(db.Model):
#     """Aggregated metrics for reporting and analytics dashboards."""
#     __tablename__ = "aggregated_metrics"
#     id = db.Column(db.Integer, primary_key=True)
#     aggregation_type = db.Column(db.String(50), nullable=False)  # e.g., 'daily', 'weekly', 'monthly'
#     metric_type = db.Column(db.String(50), nullable=False)
#     value = db.Column(db.Float, nullable=False)
#     start_date = db.Column(db.DateTime, nullable=False)
#     end_date = db.Column(db.DateTime, nullable=False)
#     created_at = db.Column(db.DateTime, default=datetime.utcnow)
#     def to_dict(self) -> Dict[str, Any]:
#         return {
#             "id": self.id,
#             "aggregation_type": self.aggregation_type,
#             "metric_type": self.metric_type,
#             "value": self.value,
#             "start_date": self.start_date.isoformat(),
#             "end_date": self.end_date.isoformat(),
#             "created_at": self.created_at.isoformat(),
#         }


__all__ = [
    "UserMetrics",
]
