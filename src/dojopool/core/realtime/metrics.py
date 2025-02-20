"""WebSocket metrics module.

This module provides metrics collection for WebSocket connections and events.
"""

from collections import defaultdict
from datetime import datetime
from typing import Dict

from prometheus_client import Counter, Gauge, Histogram

from ...utils.monitoring import REGISTRY

# Metrics for connections
ws_connections = Gauge(
    "websocket_connections_current",
    "Number of current WebSocket connections",
    registry=REGISTRY,
)

ws_connections_total = Counter(
    "websocket_connections_total",
    "Total number of WebSocket connections",
    ["status"],  # 'connected' or 'disconnected'
    registry=REGISTRY,
)

# Metrics for events
ws_events = Counter(
    "websocket_events_total",
    "Total number of WebSocket events",
    ["event", "status"],  # event name and 'success' or 'error'
    registry=REGISTRY,
)

# Metrics for rooms
ws_rooms = Gauge(
    "websocket_rooms_current",
    "Number of current WebSocket rooms",
    ["type"],  # 'game' or 'tournament'
    registry=REGISTRY,
)

ws_room_members = Gauge(
    "websocket_room_members_current",
    "Number of current members in rooms",
    ["type"],  # 'game' or 'tournament'
    registry=REGISTRY,
)

# Metrics for errors
ws_errors = Counter(
    "websocket_errors_total",
    "Total number of WebSocket errors",
    ["type"],  # error type (e.g., 'auth', 'validation', etc.)
    registry=REGISTRY,
)

# Metrics for latency
ws_event_duration = Histogram(
    "websocket_event_duration_seconds",
    "Duration of WebSocket event handling",
    ["event"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0),
    registry=REGISTRY,
)

# Metrics for rate limiting
ws_rate_limits = Counter(
    "websocket_rate_limits_total",
    "Total number of rate limit hits",
    ["event"],
    registry=REGISTRY,
)


class MetricsCollector:
    """Collector for WebSocket metrics."""

    def __init__(self):
        # Store event timings for calculating latency
        self._event_starts: Dict[str, datetime] = {}
        # Store connection counts per user
        self._user_connections: Dict[str, int] = defaultdict(int)
        # Store room counts per type
        self._room_counts: Dict[str, int] = defaultdict(int)
        # Store member counts per room type
        self._member_counts: Dict[str, int] = defaultdict(int)

    def track_connection(self, user_id: str) -> None:
        """Track new WebSocket connection.

        Args:
            user_id: ID of the user.
        """
        self._user_connections[user_id] += 1
        ws_connections.inc()
        ws_connections_total.labels(status="connected").inc()

    def track_disconnection(self, user_id: str):
        """Track WebSocket disconnection.

        Args:
            user_id: ID of the user.
        """
        if self._user_connections[user_id] > 0:
            self._user_connections[user_id] -= 1
            ws_connections.dec()
            ws_connections_total.labels(status="disconnected").inc()

    def start_event(self, event_id: str) -> None:
        """Start tracking event timing.

        Args:
            event_id: ID of the event.
        """
        self._event_starts[event_id] = datetime.now()

    def end_event(self, event_id: str, event_name: str, success: bool = True):
        """End tracking event timing.

        Args:
            event_id: ID of the event.
            event_name: Name of the event.
            success: Whether event was successful.
        """
        if event_id in self._event_starts:
            duration = datetime.now() - self._event_starts[event_id]
            ws_event_duration.labels(event=event_name).observe(duration.total_seconds())
            ws_events.labels(
                event=event_name, status="success" if success else "error"
            ).inc()
            del self._event_starts[event_id]

    def track_room_change(self, room_type: str, count_change: int) -> None:
        """Track change in room count.

        Args:
            room_type: Type of room.
            count_change: Change in count (positive or negative).
        """
        self._room_counts[room_type] += count_change
        ws_rooms.labels(type=room_type).set(self._room_counts[room_type])

    def track_member_change(self, room_type: str, count_change: int):
        """Track change in room member count.

        Args:
            room_type: Type of room.
            count_change: Change in count (positive or negative).
        """
        self._member_counts[room_type] += count_change
        ws_room_members.labels(type=room_type).set(self._member_counts[room_type])

    def track_error(self, error_type: str):
        """Track WebSocket error.

        Args:
            error_type: Type of error.
        """
        ws_errors.labels(type=error_type).inc()

    def track_rate_limit(self, event_name: str):
        """Track rate limit hit.

        Args:
            event_name: Name of the event.
        """
        ws_rate_limits.labels(event=event_name).inc()


# Global metrics collector instance
metrics_collector = MetricsCollector()


def track_connection(user_id: str) -> None:
    """Track new WebSocket connection.

    Args:
        user_id: ID of the user.
    """
    metrics_collector.track_connection(user_id)


def track_disconnection(user_id: str):
    """Track WebSocket disconnection.

    Args:
        user_id: ID of the user.
    """
    metrics_collector.track_disconnection(user_id)


def start_event(event_id: str):
    """Start tracking event timing.

    Args:
        event_id: ID of the event.
    """
    metrics_collector.start_event(event_id)


def end_event(event_id: str, event_name: str, success: bool = True):
    """End tracking event timing.

    Args:
        event_id: ID of the event.
        event_name: Name of the event.
        success: Whether event was successful.
    """
    metrics_collector.end_event(event_id, event_name, success)


def track_room_change(room_type: str, count_change: int) -> None:
    """Track change in room count.

    Args:
        room_type: Type of room.
        count_change: Change in count (positive or negative).
    """
    metrics_collector.track_room_change(room_type, count_change)


def track_member_change(room_type: str, count_change: int):
    """Track change in room member count.

    Args:
        room_type: Type of room.
        count_change: Change in count (positive or negative).
    """
    metrics_collector.track_member_change(room_type, count_change)


def track_error(error_type: str):
    """Track WebSocket error.

    Args:
        error_type: Type of error.
    """
    metrics_collector.track_error(error_type)


def track_rate_limit(event_name: str):
    """Track rate limit hit.

    Args:
        event_name: Name of the event.
    """
    metrics_collector.track_rate_limit(event_name)
