"""Monitoring module for DojoPool."""

import json
import logging
import threading
import time
import traceback
from dataclasses import dataclass
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Dict, List, Optional

import psutil
from flask import current_app, request

logger = logging.getLogger(__name__)


@dataclass
class MetricData:
    """Metric data structure."""

    value: float
    timestamp: datetime
    tags: Dict[str, str]


class PerformanceMonitor:
    """Monitors application performance."""

    def __init__(self, redis_client=None):
        """Initialize PerformanceMonitor.

        Args:
            redis_client: Optional Redis client for metric storage
        """
        self.redis_client = redis_client
        self.metrics: Dict[str, List[MetricData]] = {}
        self._lock = threading.Lock()

    def record_metric(self, name: str, value: float, tags: Optional[Dict[str, str]] = None):
        """Record a metric.

        Args:
            name: Metric name
            value: Metric value
            tags: Optional metric tags
        """
        metric = MetricData(value=value, timestamp=datetime.utcnow(), tags=tags or {})

        with self._lock:
            if name not in self.metrics:
                self.metrics[name] = []
            self.metrics[name].append(metric)

        # Store in Redis if available
        if self.redis_client:
            key = f"metric:{name}:{datetime.utcnow().isoformat()}"
            data = {"value": value, "timestamp": datetime.utcnow().isoformat(), "tags": tags or {}}
            self.redis_client.setex(key, 86400, json.dumps(data))  # Expire after 24h

    def get_metrics(self, name: str, start_time: Optional[datetime] = None) -> List[MetricData]:
        """Get metrics for a given name.

        Args:
            name: Metric name
            start_time: Optional start time filter

        Returns:
            List of metric data
        """
        with self._lock:
            metrics = self.metrics.get(name, [])
            if start_time:
                metrics = [m for m in metrics if m.timestamp >= start_time]
            return metrics

    def clear_old_metrics(self, max_age: timedelta):
        """Clear metrics older than max_age.

        Args:
            max_age: Maximum age of metrics to keep
        """
        cutoff = datetime.utcnow() - max_age
        with self._lock:
            for name in self.metrics:
                self.metrics[name] = [m for m in self.metrics[name] if m.timestamp >= cutoff]


class ErrorTracker:
    """Tracks application errors."""

    def __init__(self, redis_client=None):
        """Initialize ErrorTracker.

        Args:
            redis_client: Optional Redis client for error storage
        """
        self.redis_client = redis_client
        self.errors: List[Dict[str, Any]] = []
        self._lock = threading.Lock()

    def record_error(self, error: Exception, context: Optional[Dict[str, Any]] = None):
        """Record an error.

        Args:
            error: Exception object
            context: Optional error context
        """
        error_data = {
            "type": type(error).__name__,
            "message": str(error),
            "traceback": traceback.format_exc(),
            "timestamp": datetime.utcnow().isoformat(),
            "context": context or {},
        }

        with self._lock:
            self.errors.append(error_data)

        # Store in Redis if available
        if self.redis_client:
            key = f"error:{datetime.utcnow().isoformat()}"
            self.redis_client.setex(key, 86400, json.dumps(error_data))  # Expire after 24h

        logger.error(
            f"Error tracked: {error_data['type']} - {error_data['message']}",
            extra={"error_data": error_data},
        )

    def get_recent_errors(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent errors.

        Args:
            limit: Maximum number of errors to return

        Returns:
            List of error data
        """
        with self._lock:
            return sorted(self.errors, key=lambda x: x["timestamp"], reverse=True)[:limit]

    def clear_old_errors(self, max_age: timedelta):
        """Clear errors older than max_age.

        Args:
            max_age: Maximum age of errors to keep
        """
        cutoff = datetime.utcnow() - max_age
        with self._lock:
            self.errors = [
                e for e in self.errors if datetime.fromisoformat(e["timestamp"]) >= cutoff
            ]


class HealthChecker:
    """System health checker."""

    def __init__(self, checks: Optional[Dict[str, Callable[[], bool]]] = None):
        """Initialize HealthChecker.

        Args:
            checks: Dictionary of health check functions
        """
        self.checks = checks or {}
        self.results: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def add_check(self, name: str, check_func: Callable[[], bool]):
        """Add a health check.

        Args:
            name: Check name
            check_func: Check function
        """
        self.checks[name] = check_func

    def run_checks(self) -> Dict[str, Dict[str, Any]]:
        """Run all health checks.

        Returns:
            Dictionary of check results
        """
        with self._lock:
            for name, check_func in self.checks.items():
                try:
                    start_time = time.time()
                    success = check_func()
                    duration = time.time() - start_time

                    self.results[name] = {
                        "success": success,
                        "timestamp": datetime.utcnow().isoformat(),
                        "duration": duration,
                    }
                except Exception as e:
                    logger.error(f"Health check '{name}' failed: {str(e)}")
                    self.results[name] = {
                        "success": False,
                        "timestamp": datetime.utcnow().isoformat(),
                        "error": str(e),
                    }

            return self.results

    def is_healthy(self) -> bool:
        """Check if all health checks pass.

        Returns:
            True if all checks pass
        """
        return all(result.get("success", False) for result in self.results.values())


class SystemMetrics:
    """System metrics collector."""

    @staticmethod
    def get_cpu_usage() -> float:
        """Get CPU usage percentage.

        Returns:
            CPU usage percentage
        """
        return psutil.cpu_percent(interval=1)

    @staticmethod
    def get_memory_usage() -> Dict[str, float]:
        """Get memory usage statistics.

        Returns:
            Dictionary of memory statistics
        """
        mem = psutil.virtual_memory()
        return {
            "total": mem.total,
            "available": mem.available,
            "used": mem.used,
            "percent": mem.percent,
        }

    @staticmethod
    def get_disk_usage() -> Dict[str, float]:
        """Get disk usage statistics.

        Returns:
            Dictionary of disk statistics
        """
        disk = psutil.disk_usage("/")
        return {"total": disk.total, "used": disk.used, "free": disk.free, "percent": disk.percent}

    @staticmethod
    def get_network_io() -> Dict[str, float]:
        """Get network I/O statistics.

        Returns:
            Dictionary of network statistics
        """
        net = psutil.net_io_counters()
        return {
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv,
            "packets_sent": net.packets_sent,
            "packets_recv": net.packets_recv,
        }


def monitor_performance(name: str):
    """Decorator to monitor function performance.

    Args:
        name: Metric name

    Returns:
        Decorated function
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time

                # Record metric
                if hasattr(current_app, "performance_monitor"):
                    tags = {
                        "endpoint": request.endpoint or "unknown",
                        "method": request.method,
                        "status": "success",
                    }
                    current_app.performance_monitor.record_metric(name, duration, tags)

                return result

            except Exception as e:
                duration = time.time() - start_time

                # Record error metric
                if hasattr(current_app, "performance_monitor"):
                    tags = {
                        "endpoint": request.endpoint or "unknown",
                        "method": request.method,
                        "status": "error",
                        "error_type": type(e).__name__,
                    }
                    current_app.performance_monitor.record_metric(name, duration, tags)

                raise

        return wrapper

    return decorator


def track_error(func):
    """Decorator to track function errors.

    Args:
        func: Function to decorate

    Returns:
        Decorated function
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # Record error
            if hasattr(current_app, "error_tracker"):
                context = {
                    "endpoint": request.endpoint or "unknown",
                    "method": request.method,
                    "args": str(args),
                    "kwargs": str(kwargs),
                }
                current_app.error_tracker.record_error(e, context)
            raise

    return wrapper


def init_monitoring(app, redis_client=None):
    """Initialize monitoring for Flask application.

    Args:
        app: Flask application instance
        redis_client: Optional Redis client
    """
    # Initialize components
    app.performance_monitor = PerformanceMonitor(redis_client)
    app.error_tracker = ErrorTracker(redis_client)
    app.health_checker = HealthChecker()

    # Add default health checks
    app.health_checker.add_check("redis", lambda: bool(redis_client and redis_client.ping()))
    app.health_checker.add_check("database", lambda: bool(app.db and app.db.is_connected()))

    # Start metric cleanup task
    def cleanup_metrics():
        while True:
            app.performance_monitor.clear_old_metrics(timedelta(days=7))
            app.error_tracker.clear_old_errors(timedelta(days=30))
            time.sleep(3600)  # Run every hour

    cleanup_thread = threading.Thread(target=cleanup_metrics, daemon=True)
    cleanup_thread.start()

    # Add monitoring endpoints
    @app.route("/health")
    def health_check():
        results = app.health_checker.run_checks()
        status = 200 if app.health_checker.is_healthy() else 503
        return {"status": "healthy" if status == 200 else "unhealthy", "checks": results}, status

    @app.route("/metrics")
    def metrics():
        system_metrics = {
            "cpu": SystemMetrics.get_cpu_usage(),
            "memory": SystemMetrics.get_memory_usage(),
            "disk": SystemMetrics.get_disk_usage(),
            "network": SystemMetrics.get_network_io(),
        }
        return {"system": system_metrics}
