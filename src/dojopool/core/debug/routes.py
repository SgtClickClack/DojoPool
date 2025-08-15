"""
Debug API routes for system monitoring and diagnostics.
"""

import logging
from datetime import datetime
from functools import wraps

import psutil
from flask import Blueprint, current_app, jsonify

from ..auth import is_admin, require_auth

bp = Blueprint("debug", __name__, url_prefix="/api/debug")
logger = logging.getLogger(__name__)


def admin_required(f):
    """Decorator to require admin access."""

    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_admin():
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)

    return decorated


@bp.route("/metrics", methods=["GET"])
@require_auth
@admin_required
def get_metrics():
    """Get system performance metrics."""
    try:
        # Get memory usage
        process = psutil.Process()
        memory_info = process.memory_info()

        # Get network latency (simplified)
        psutil.net_io_counters()

        # Get application metrics
        metrics = {
            "loadTime": current_app.config.get("average_load_time", 0),
            "memoryUsage": memory_info.rss,  # Resident Set Size in bytes
            "networkLatency": current_app.config.get("average_latency", 0),
            "errors": _get_recent_errors(),
            "warnings": _get_recent_warnings(),
        }

        return jsonify(metrics)
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return jsonify({"error": "Failed to get metrics"}), 500


@bp.route("/status", methods=["GET"])
@require_auth
@admin_required
def get_status():
    """Get system status information."""
    try:
        # Get CPU usage
        cpu_percent = psutil.cpu_percent(interval=0.1)

        # Get memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent

        # Get network status
        network_status = _get_network_status()

        status = {
            "cpu": cpu_percent,
            "memory": memory_percent,
            "network": network_status,
            "lastUpdate": datetime.now().isoformat(),
        }

        return jsonify(status)
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        return jsonify({"error": "Failed to get status"}), 500


def _get_recent_errors() -> list:
    """Get recent error messages from the log."""
    try:
        with open(current_app.config["ERROR_LOG_PATH"], "r") as f:
            # Get last 10 error messages
            errors = []
            for line in f.readlines()[-100:]:  # Read last 100 lines
                if "ERROR" in line:
                    errors.append(line.strip())
                if len(errors) >= 10:
                    break
            return errors
    except Exception as e:
        logger.error(f"Error reading error log: {str(e)}")
        return []


def _get_recent_warnings() -> list:
    """Get recent warning messages from the log."""
    try:
        with open(current_app.config["ERROR_LOG_PATH"], "r") as f:
            # Get last 10 warning messages
            warnings = []
            for line in f.readlines()[-100:]:  # Read last 100 lines
                if "WARNING" in line:
                    warnings.append(line.strip())
                if len(warnings) >= 10:
                    break
            return warnings
    except Exception as e:
        logger.error(f"Error reading error log: {str(e)}")
        return []


def _get_network_status() -> str:
    """Determine network status based on latency and packet loss."""
    try:
        # Get network counters
        counters = psutil.net_io_counters()

        # Calculate packet loss ratio
        packets_sent = counters.packets_sent
        packets_recv = counters.packets_recv
        if packets_sent == 0:
            return "good"  # No traffic yet

        loss_ratio = (packets_sent - packets_recv) / packets_sent

        # Get current latency
        latency = current_app.config.get("average_latency", 0)

        # Determine status based on loss ratio and latency
        if loss_ratio < 0.01 and latency < 100:  # Less than 1% loss and 100ms latency
            return "good"
        elif loss_ratio < 0.05 and latency < 300:  # Less than 5% loss and 300ms latency
            return "fair"
        else:
            return "poor"
    except Exception as e:
        logger.error(f"Error calculating network status: {str(e)}")
        return "poor"  # Default to poor if we can't calculate
