"""Analytics models for tracking metrics and statistics."""
from datetime import datetime
from typing import Dict, Any, List
from dojopool.core.extensions import db

class UserMetrics(db.Model):
    """User activity and performance metrics."""
    __tablename__ = 'user_metrics'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    metric_type = db.Column(db.String(50), nullable=False)  # e.g., 'games_played', 'win_rate', 'avg_score'
    value = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), nullable=False)  # 'daily', 'weekly', 'monthly', 'all_time'
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='metrics')

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'metric_type': self.metric_type,
            'value': self.value,
            'period': self.period,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat()
        }

class GameMetrics(db.Model):
    """Game-related metrics and statistics."""
    __tablename__ = 'game_metrics'

    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    metric_type = db.Column(db.String(50), nullable=False)  # e.g., 'duration', 'shots_taken', 'accuracy'
    value = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    game = db.relationship('Game', backref='metrics')

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            'id': self.id,
            'game_id': self.game_id,
            'metric_type': self.metric_type,
            'value': self.value,
            'created_at': self.created_at.isoformat()
        }

class VenueMetrics(db.Model):
    """Venue usage and performance metrics."""
    __tablename__ = 'venue_metrics'

    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    metric_type = db.Column(db.String(50), nullable=False)  # e.g., 'occupancy_rate', 'revenue', 'games_played'
    value = db.Column(db.Float, nullable=False)
    period = db.Column(db.String(20), nullable=False)  # 'hourly', 'daily', 'weekly', 'monthly'
    date = db.Column(db.Date, nullable=False)
    hour = db.Column(db.Integer, nullable=True)  # For hourly metrics
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    venue = db.relationship('Venue', backref='metrics')

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            'id': self.id,
            'venue_id': self.venue_id,
            'metric_type': self.metric_type,
            'value': self.value,
            'period': self.period,
            'date': self.date.isoformat(),
            'hour': self.hour,
            'created_at': self.created_at.isoformat()
        }

class FeatureUsageMetrics(db.Model):
    """Feature usage and engagement metrics."""
    __tablename__ = 'feature_usage_metrics'

    id = db.Column(db.Integer, primary_key=True)
    feature_name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # e.g., 'view', 'click', 'complete'
    context = db.Column(db.JSON, nullable=True)  # Additional context about the action
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='feature_usage')

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            'id': self.id,
            'feature_name': self.feature_name,
            'user_id': self.user_id,
            'action': self.action,
            'context': self.context,
            'created_at': self.created_at.isoformat()
        }

class PerformanceMetrics(db.Model):
    """System performance and technical metrics."""
    __tablename__ = 'performance_metrics'

    id = db.Column(db.Integer, primary_key=True)
    metric_type = db.Column(db.String(50), nullable=False)  # e.g., 'response_time', 'error_rate', 'cpu_usage'
    value = db.Column(db.Float, nullable=False)
    endpoint = db.Column(db.String(200), nullable=True)  # For API metrics
    component = db.Column(db.String(100), nullable=True)  # For system component metrics
    context = db.Column(db.JSON, nullable=True)  # Additional context
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            'id': self.id,
            'metric_type': self.metric_type,
            'value': self.value,
            'endpoint': self.endpoint,
            'component': self.component,
            'context': self.context,
            'created_at': self.created_at.isoformat()
        }

class AggregatedMetrics(db.Model):
    """Pre-aggregated metrics for faster dashboard loading."""
    __tablename__ = 'aggregated_metrics'

    id = db.Column(db.Integer, primary_key=True)
    metric_type = db.Column(db.String(50), nullable=False)
    dimension = db.Column(db.String(50), nullable=False)  # e.g., 'user', 'venue', 'game'
    dimension_id = db.Column(db.Integer, nullable=True)
    period = db.Column(db.String(20), nullable=False)  # 'daily', 'weekly', 'monthly'
    date = db.Column(db.Date, nullable=False)
    count = db.Column(db.Integer, nullable=False, default=0)
    sum = db.Column(db.Float, nullable=False, default=0)
    avg = db.Column(db.Float, nullable=False, default=0)
    min = db.Column(db.Float, nullable=True)
    max = db.Column(db.Float, nullable=True)
    percentile_90 = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert aggregated metric to dictionary."""
        return {
            'id': self.id,
            'metric_type': self.metric_type,
            'dimension': self.dimension,
            'dimension_id': self.dimension_id,
            'period': self.period,
            'date': self.date.isoformat(),
            'count': self.count,
            'sum': self.sum,
            'avg': self.avg,
            'min': self.min,
            'max': self.max,
            'percentile_90': self.percentile_90,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

__all__ = [
    'UserMetrics',
    'GameMetrics',
    'VenueMetrics',
    'FeatureUsageMetrics',
    'PerformanceMetrics',
    'AggregatedMetrics'
] 