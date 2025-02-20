"""Monitoring module for application performance and health."""

import logging
import os
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Union

import psutil
from flask import Blueprint, current_app, jsonify
from werkzeug.wrappers import Response

from dojopool.core.extensions import cache, db

logger = logging.getLogger(__name__)


@dataclass
class MetricData:
    """Data class for storing metric information."""

    timestamp: datetime
    value: float
    tags: Dict[str, str]


class PerformanceMonitor:
    """Monitor application performance metrics."""

    def __init__(self) -> None:
        """Initialize performance monitor."""
        self.metrics: Dict[str, List[MetricData]] = {}
        self._lock = threading.Lock()

    def record_metric(
        self, name: str, value: float, tags: Optional[Dict[str, str]] = None
    ):
        """Record a metric value.

        Args:
            name: Metric name
            value: Metric value
            tags: Optional metric tags
        """
        with self._lock:
            if name not in self.metrics:
                self.metrics[name] = []
            self.metrics[name].append(
                MetricData(timestamp=datetime.utcnow(), value=value, tags=tags or {})
            )

    def get_metrics(
        self,
        name: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        tags: Optional[Dict[str, str]] = None,
    ):
        """Get metrics within a time range.

        Args:
            name: Metric name
            start_time: Start of time range
            end_time: End of time range
            tags: Filter by tags

        Returns:
            List of metric data
        """
        if name not in self.metrics:
            return []

        metrics = self.metrics[name]
        if start_time:
            metrics = [m for m in metrics if m.timestamp >= start_time]
        if end_time:
            metrics = [m for m in metrics if m.timestamp <= end_time]
        if tags:
            metrics = [
                m for m in metrics if all(m.tags.get(k) == v for k, v in tags.items())
            ]

        return metrics


class ErrorTracker:
    """Track application errors."""

    def __init__(self) -> None:
        """Initialize error tracker."""
        self.errors: List[Dict[str, Any]] = []
        self._lock = threading.Lock()

    def record_error(self, error: Exception, context: Optional[Dict[str, Any]] = None):
        """Record an error.

        Args:
            error: The error that occurred
            context: Additional context about the error
        """
        with self._lock:
            self.errors.append(
                {
                    "timestamp": datetime.utcnow(),
                    "error_type": type(error).__name__,
                    "message": str(error),
                    "context": context or {},
                }
            )

    def get_recent_errors(self, limit: int = 100):
        """Get most recent errors.

        Args:
            limit: Maximum number of errors to return

        Returns:
            List of recent errors
        """
        with self._lock:
            return sorted(self.errors, key=lambda x: x["timestamp"], reverse=True)[
                :limit
            ]


class HealthChecker:
    """Check application health status."""

    def __init__(self):
        """Initialize health checker."""
        self.results: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def add_check(
        self,
        name: str,
        check_func: Callable[[], bool],
        description: Optional[str] = None,
    ) -> None:
        """Add a health check.

        Args:
            name: Check name
            check_func: Function that returns health status
            description: Optional check description
        """
        with self._lock:
            self.results[name] = {
                "check_func": check_func,
                "description": description,
                "last_run": None,
                "status": None,
                "message": None,
            }

    def run_checks(self):
        """Run all health checks.

        Returns:
            Dictionary of check results
        """
        with self._lock:
            for name, check in self.results.items():
                try:
                    status = check["check_func"]()
                    check["status"] = status
                    check["message"] = None
                except Exception as e:
                    check["status"] = False
                    check["message"] = str(e)
                check["last_run"] = datetime.utcnow()

            return {
                name: {
                    "status": check["status"],
                    "message": check["message"],
                    "last_run": check["last_run"],
                    "description": check["description"],
                }
                for name, check in self.results.items()
            }

    def is_healthy(self):
        """Check if all health checks pass.

        Returns:
            True if all checks pass, False otherwise
        """
        results = self.run_checks()
        return all(check["status"] for check in results.values())


def get_cpu_usage():
    """Get current CPU usage.

    Returns:
        CPU usage percentage
    """
    return psutil.cpu_percent(interval=1)


def get_memory_usage() -> Dict[str, float]:
    """Get current memory usage.

    Returns:
        Dictionary of memory usage statistics
    """
    mem = psutil.virtual_memory()
    return {
        "total": mem.total / (1024 * 1024 * 1024),  # GB
        "available": mem.available / (1024 * 1024 * 1024),  # GB
        "percent": mem.percent,
    }


def get_disk_usage():
    """Get current disk usage.

    Returns:
        Dictionary of disk usage statistics
    """
    disk = psutil.disk_usage("/")
    return {
        "total": disk.total / (1024 * 1024 * 1024),  # GB
        "used": disk.used / (1024 * 1024 * 1024),  # GB
        "free": disk.free / (1024 * 1024 * 1024),  # GB
        "percent": disk.percent,
    }


def get_network_io():
    """Get current network I/O statistics.

    Returns:
        Dictionary of network I/O statistics
    """
    net = psutil.net_io_counters()
    return {
        "bytes_sent": net.bytes_sent / (1024 * 1024),  # MB
        "bytes_recv": net.bytes_recv / (1024 * 1024),  # MB
        "packets_sent": net.packets_sent,
        "packets_recv": net.packets_recv,
        "errin": net.errin,
        "errout": net.errout,
    }


def track_performance(metric_name: str, tags: Optional[Dict[str, str]] = None):
    """Decorator to track function performance.

    Args:
        metric_name: Name of the metric to record
        tags: Optional tags to add to the metric

    Returns:
        Decorated function
    """

    def decorator(func: Callable) -> Callable:
        def wrapper(*args: Any, **kwargs: Any):
            start_time = time.time()
            result = func(*args, **kwargs)
            duration = time.time() - start_time

            monitor = current_app.extensions.get("performance_monitor")
            if monitor:
                monitor.record_metric(metric_name, duration, tags)

            return result

        return wrapper

    return decorator


def track_error(func: Callable) -> Callable:
    """Decorator to track function errors.

    Args:
        func: Function to track

    Returns:
        Decorated function
    """

    def wrapper(*args: Any, **kwargs: Any):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            tracker = current_app.extensions.get("error_tracker")
            if tracker:
                tracker.record_error(
                    e,
                    {
                        "function": func.__name__,
                        "args": str(args),
                        "kwargs": str(kwargs),
                    },
                )
            raise

    return wrapper


def init_monitoring(app: Any, redis_client: Optional[Any] = None):
    """Initialize application monitoring.

    Args:
        app: Flask application instance
        redis_client: Optional Redis client for caching
    """
    # Initialize monitors
    app.extensions["performance_monitor"] = PerformanceMonitor()
    app.extensions["error_tracker"] = ErrorTracker()
    app.extensions["health_checker"] = HealthChecker()

    # Add health checks
    health_checker = app.extensions["health_checker"]
    health_checker.add_check(
        "redis",
        lambda: bool(redis_client and redis_client.ping()),
        "Check Redis connection",
    )
    health_checker.add_check(
        "database",
        lambda: bool(db and db.session.is_active),
        "Check database connection",
    )

    # Start cleanup thread
    def cleanup_metrics():
        while True:
            time.sleep(3600)  # Run every hour
            monitor = app.extensions["performance_monitor"]
            # Keep last 24 hours of metrics
            cutoff = datetime.utcnow() - timedelta(hours=24)
            for name in monitor.metrics:
                monitor.metrics[name] = [
                    m for m in monitor.metrics[name] if m.timestamp >= cutoff
                ]

    cleanup_thread = threading.Thread(target=cleanup_metrics, daemon=True)
    cleanup_thread.start()


bp = Blueprint("monitoring", __name__)


@bp.route("/health")
def health_check() -> Response:
    """Health check endpoint.

    Returns:
        Health check response
    """
    checker = current_app.extensions["health_checker"]
    status = 200 if checker.is_healthy() else 503
    return (
        jsonify(
            {
                "status": "healthy" if status == 200 else "unhealthy",
                "checks": checker.run_checks(),
            }
        ),
        status,
    )
