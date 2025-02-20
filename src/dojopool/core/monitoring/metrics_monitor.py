import gc
import gc
"""Unified game metrics monitoring system."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


@dataclass
class Alert:
    id: str
    severity: AlertSeverity
    message: str
    timestamp: datetime
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    details: Dict[str, Any] = None


@dataclass
class GameMetrics:
    active_players: int = 0
    active_games: int = 0
    total_games_completed: int = 0
    completion_rate: float = 0.0
    average_completion_time: float = 0.0
    average_score: float = 0.0
    player_retention: float = 0.0
    error_count: int = 0
    warning_count: int = 0
    error_rate: float = 0.0
    last_error: Optional[Dict[str, Any]] = None


class GameMetricsMonitor:
    """Unified game metrics monitoring system."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GameMetricsMonitor, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initialize the metrics monitor."""
        self.metrics: Dict[str, GameMetrics] = {}
        self.alerts: List[Alert] = []
        self.error_history: Dict[str, List[Dict[str, Any]]] = {}
        self.RATE_WINDOW = 5 * 60  # 5 minutes in seconds

    def add_alert(
        self,
        severity: AlertSeverity,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> Alert:
        """Add a new alert to the system.

        Args:
            severity: Alert severity level
            message: Alert message
            details: Optional additional details

        Returns:
            Alert: The created alert
        """
        alert = Alert(
            id=f"alert-{datetime.utcnow().timestamp()}",
            severity=severity,
            message=message,
            timestamp=datetime.utcnow(),
            details=details or {},
        )
        self.alerts.append(alert)
        return alert

    def acknowledge_alert(self, alert_id: str, user_id: str) -> bool:
        """Acknowledge an alert.

        Args:
            alert_id: ID of the alert to acknowledge
            user_id: ID of the user acknowledging the alert

        Returns:
            bool: True if alert was found and acknowledged
        """
        alert = next((a for a in self.alerts if a.id == alert_id), None)
        if alert:
            alert.acknowledged = True
            alert.acknowledged_by = user_id
            alert.acknowledged_at = datetime.utcnow()
            return True
        return False

    def get_alerts(self, severity: Optional[AlertSeverity] = None):
        """Get alerts, optionally filtered by severity.

        Args:
            severity: Optional severity filter

        Returns:
            List[Alert]: List of matching alerts
        """
        if severity:
            return [a for a in self.alerts if a.severity == severity]
        return list(self.alerts)

    def record_game_completion(self, game_id: str, score: float, time: float):
        """Record a game completion.

        Args:
            game_id: ID of the completed game
            score: Game score
            time: Time taken to complete the game
        """
        metrics = self.metrics.get(game_id, GameMetrics())
        metrics.total_games_completed += 1
        metrics.completion_rate = metrics.total_games_completed / max(
            metrics.active_games, 1
        )
        metrics.average_completion_time = (
            metrics.average_completion_time * (metrics.total_games_completed - 1) + time
        ) / metrics.total_games_completed
        metrics.average_score = (
            metrics.average_score * (metrics.total_games_completed - 1) + score
        ) / metrics.total_games_completed
        self.metrics[game_id] = metrics

    def record_error(
        self,
        game_id: str,
        error_type: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Record an error occurrence.

        Args:
            game_id: ID of the game where error occurred
            error_type: Type of error
            message: Error message
            details: Optional additional details
        """
        metrics = self.metrics.get(game_id, GameMetrics())
        metrics.error_count += 1
        metrics.last_error = {
            "timestamp": datetime.utcnow(),
            "type": error_type,
            "message": message,
            "details": details or {},
        }

        # Update error history
        if game_id not in self.error_history:
            self.error_history[game_id] = []

        self.error_history[game_id].append(
            {
                "timestamp": datetime.utcnow(),
                "type": error_type,
                "message": message,
                "details": details or {},
            }
        )

        # Calculate error rate (errors per minute in the last 5 minutes)
        recent_errors = [
            e
            for e in self.error_history[game_id]
            if (datetime.utcnow() - e["timestamp"]).total_seconds() <= self.RATE_WINDOW
        ]
        metrics.error_rate = len(recent_errors) / (self.RATE_WINDOW / 60)

        self.metrics[game_id] = metrics

        # Add alert for errors
        self.add_alert(
            AlertSeverity.ERROR,
            f"Error in game {game_id}: {message}",
            {"error_type": error_type, "details": details},
        )

    def get_metrics(self, game_id: str) -> GameMetrics:
        """Get metrics for a specific game.

        Args:
            game_id: ID of the game

        Returns:
            GameMetrics: Metrics for the specified game
        """
        return self.metrics.get(game_id, GameMetrics())

    def clear_metrics(self, game_id: str):
        """Clear metrics for a specific game.

        Args:
            game_id: ID of the game to clear metrics for
        """
        self.metrics.pop(game_id, None)
        self.error_history.pop(game_id, None)


# Global instance
metrics_monitor = GameMetricsMonitor()
