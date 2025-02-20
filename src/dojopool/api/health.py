"""
Health check endpoints for system monitoring.
"""

import time
from typing import Any, Dict, List, Optional, Tuple, Union

from flask import Blueprint, Flask, Response, current_app, jsonify
from werkzeug.wrappers import Response as WerkzeugResponse

from ..core.monitoring import ErrorSeverity, error_logger
from ..core.system_metrics import SystemMetricsCollector
from ..utils.monitoring import (
    ERROR_COUNT,
    REQUEST_COUNT,
    REQUEST_LATENCY,
)

health_bp: Blueprint = Blueprint("health", __name__)
metrics_collector: SystemMetricsCollector = SystemMetricsCollector(interval=30)


def start_collector() -> None:
    """Start the system metrics collector."""
    metrics_collector.start()


# Register the start_collector function to run before first request
health_bp.record(lambda s: s.app.before_first_request(start_collector))


@health_bp.route("/health")
def health_check():
    """Basic health check endpoint.

    Returns:
        Health status and basic metrics
    """
    return jsonify({"status": "healthy", "timestamp": int(time.time())})


@health_bp.route("/health/detailed")
def detailed_health():
    """Detailed health check endpoint.

    Returns:
        Detailed system health metrics
    """
    try:
        # Get current system metrics
        system_metrics: Dict[str, Any] = metrics_collector.get_current_metrics()

        # Get recent errors
        recent_errors: List[Dict[str, Any]] = error_logger.get_recent_errors(limit=10)

        # Calculate request metrics
        total_requests: float = sum(float(v) for v in REQUEST_COUNT._metrics.values())

        avg_latency: float = (
            sum(float(v) for v in REQUEST_LATENCY._metrics.values())
            / len(REQUEST_LATENCY._metrics)
            if REQUEST_LATENCY._metrics
            else 0
        )

        total_errors: float = sum(float(v) for v in ERROR_COUNT._metrics.values())

        return jsonify(
            {
                "status": "healthy",
                "timestamp": int(time.time()),
                "system": system_metrics,
                "application": {
                    "total_requests": total_requests,
                    "average_latency": avg_latency,
                    "total_errors": total_errors,
                    "recent_errors": recent_errors,
                },
            }
        )
    except Exception as e:
        error_logger.log_error(
            error=e, severity=ErrorSeverity.ERROR, component="health_check"
        )
        return jsonify(
            {"status": "error", "timestamp": int(time.time()), "error": str(e)}
        )


@health_bp.route("/health/metrics")
def prometheus_metrics():
    """Prometheus metrics endpoint.

    Returns:
        Prometheus formatted metrics
    """
    from prometheus_client import generate_latest

    return Response(
        generate_latest(), mimetype="text/plain; version=0.0.4; charset=utf-8"
    )


def init_app(app: Flask) -> None:
    """Initialize health check endpoints."""
    app.register_blueprint(health_bp, url_prefix="/api")
