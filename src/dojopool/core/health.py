import os
from datetime import datetime

import psutil
from flask import Blueprint
from redis import Redis
from sqlalchemy import text

# Import db from the central extensions module
from dojopool.extensions import db
from .config.config import Config

health_bp = Blueprint("health", __name__)


def check_database():
    """Check database connection."""
    try:
        db.session.execute(text("SELECT 1"))
        return True, "Database is healthy"
    except Exception as e:
        return False, f"Database error: {str(e)}"


def check_redis():
    """Check Redis connection."""
    try:
        redis = Redis.from_url(Config.REDIS_URL)
        redis.ping()
        return True, "Redis is healthy"
    except Exception as e:
        return False, f"Redis not available: {str(e)}"


def check_disk_space():
    """Check available disk space."""
    disk = psutil.disk_usage("/")
    if disk.percent < 90:  # Less than 90% used
        return True, f"Disk usage: {disk.percent}%"
    return False, f"Disk usage critical: {disk.percent}%"


def check_memory():
    """Check memory usage."""
    memory = psutil.virtual_memory()
    if memory.percent < 90:  # Less than 90% used
        return True, f"Memory usage: {memory.percent}%"
    return False, f"Memory usage critical: {memory.percent}%"


@health_bp.route("/health")
def health_check():
    """Health check endpoint."""
    checks = {
        "database": check_database(),
        "redis": check_redis(),
        "disk": check_disk_space(),
        "memory": check_memory(),
        "timestamp": datetime.utcnow().isoformat(),
    }

    # Only database is critical for health
    critical_checks = ["database"]
    all_critical_healthy = all(
        checks[name][0] for name in critical_checks 
        if name in checks and isinstance(checks[name], tuple)
    )

    response = {
        "status": "healthy" if all_critical_healthy else "unhealthy",
        "checks": {
            name: (
                {"status": "healthy" if check[0] else "unhealthy", "message": check[1]}
                if isinstance(check, tuple)
                else check
            )
            for name, check in checks.items()
        },
    }

    return response, 200 if all_critical_healthy else 503


@health_bp.route("/metrics")
def metrics():
    """Prometheus metrics endpoint."""
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    metrics_text = f"""
# HELP dojopool_memory_usage_percent Memory usage percentage
# TYPE dojopool_memory_usage_percent gauge
dojopool_memory_usage_percent {memory.percent}

# HELP dojopool_disk_usage_percent Disk usage percentage
# TYPE dojopool_disk_usage_percent gauge
dojopool_disk_usage_percent {disk.percent}

# HELP dojopool_process_cpu_percent Process CPU usage percentage
# TYPE dojopool_process_cpu_percent gauge
dojopool_process_cpu_percent {psutil.Process(os.getpid()).cpu_percent()}
"""

    return metrics_text, 200, {"Content-Type": "text/plain"}
