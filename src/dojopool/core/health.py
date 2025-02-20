"""Health check module for monitoring system health."""

import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import psutil
from flask import Blueprint, current_app, jsonify
from werkzeug.wrappers import Response

from dojopool.core.extensions import cache, db

logger = logging.getLogger(__name__)
bp = Blueprint("health", __name__)


@bp.route("/health")
def health_check() -> Response:
    """Check system health.

    Returns:
        Health check response
    """
    try:
        # Check database connection
        db.session.execute("SELECT 1")

        # Check Redis connection
        cache.ping()

        # Check disk usage
        disk = psutil.disk_usage("/")
        if disk.percent >= 90:  # More than 90% used
            raise RuntimeError("Disk usage critical")

        # Check memory usage
        memory = psutil.virtual_memory()
        if memory.percent >= 90:  # More than 90% used
            raise RuntimeError("Memory usage critical")

        # Check CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        if cpu_percent >= 90:  # More than 90% used
            raise RuntimeError("CPU usage critical")

        return jsonify({"status": "healthy", "message": "All systems operational"}), 200

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({"status": "unhealthy", "message": str(e)}), 503


@bp.route("/metrics")
def metrics() -> Response:
    """Get system metrics.

    Returns:
        System metrics response
    """
    try:
        # Get system metrics
        disk = psutil.disk_usage("/")
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)

        # Get process metrics
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info()

        return (
            jsonify(
                {
                    "system": {
                        "disk": {
                            "total": disk.total,
                            "used": disk.used,
                            "free": disk.free,
                            "percent": disk.percent,
                        },
                        "memory": {
                            "total": memory.total,
                            "available": memory.available,
                            "used": memory.used,
                            "percent": memory.percent,
                        },
                        "cpu": {"percent": cpu_percent},
                    },
                    "process": {
                        "memory": {
                            "rss": process_memory.rss,
                            "vms": process_memory.vms,
                        },
                        "cpu_percent": process.cpu_percent(),
                        "threads": process.num_threads(),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Metrics collection failed: {str(e)}")
        return jsonify({"error": "Failed to collect metrics", "message": str(e)}), 500
