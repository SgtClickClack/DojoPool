"""
Health check endpoints for system monitoring.
"""

from flask import Blueprint, jsonify, Response, Flask
from typing import Dict, Any, Union, Tuple
import psutil
import time

# Use relative imports since we're within the dojopool package
from ..core.monitoring.system_metrics import SystemMetricsCollector
from ..core.monitoring.error_logger import error_logger, ErrorSeverity
from ..utils.monitoring import (
    REQUEST_COUNT,
    REQUEST_LATENCY,
    ERROR_COUNT,
    MEMORY_USAGE,
    SYSTEM_CPU_USAGE
)

health_bp = Blueprint('health', __name__)
metrics_collector = SystemMetricsCollector(interval=30)

def start_collector() -> None:
    """Start the system metrics collector."""
    metrics_collector.start()

# Register the start_collector function to run before first request
health_bp.record(lambda s: s.app.before_first_request(start_collector))

@health_bp.route('/health')
def health_check() -> Response:
    """Basic health check endpoint.
    
    Returns:
        Health status and basic metrics
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': int(time.time())
    })

@health_bp.route('/health/detailed')
def detailed_health() -> Union[Response, Tuple[Response, int]]:
    """Detailed health check endpoint.
    
    Returns:
        Detailed system health metrics
    """
    try:
        # Get current system metrics
        system_metrics = metrics_collector.get_current_metrics()
        
        # Get recent errors
        recent_errors = error_logger.get_recent_errors(limit=10)
        
        # Calculate request metrics
        total_requests = sum(
            float(v) for v in REQUEST_COUNT._metrics.values()
        )
        
        avg_latency = sum(
            float(v) for v in REQUEST_LATENCY._metrics.values()
        ) / len(REQUEST_LATENCY._metrics) if REQUEST_LATENCY._metrics else 0
        
        total_errors = sum(
            float(v) for v in ERROR_COUNT._metrics.values()
        )
        
        return jsonify({
            'status': 'healthy',
            'timestamp': int(time.time()),
            'system': system_metrics,
            'application': {
                'total_requests': total_requests,
                'average_latency': avg_latency,
                'total_errors': total_errors,
                'recent_errors': recent_errors
            }
        })
    except Exception as e:
        error_logger.log_error(
            error=e,
            severity=ErrorSeverity.ERROR,
            component='health_check'
        )
        return jsonify({
            'status': 'error',
            'timestamp': int(time.time()),
            'error': str(e)
        }), 500

@health_bp.route('/health/metrics')
def prometheus_metrics() -> Response:
    """Prometheus metrics endpoint.
    
    Returns:
        Prometheus formatted metrics
    """
    from prometheus_client import generate_latest
    return Response(
        generate_latest(),
        mimetype='text/plain; version=0.0.4; charset=utf-8'
    )

def init_app(app: Flask) -> None:
    """Initialize health check endpoints."""
    app.register_blueprint(health_bp, url_prefix='/api') 