"""Monitoring and logging configuration for DojoPool."""

import logging
import os
from dataclasses import dataclass
from typing import Any, Dict

import structlog
from prometheus_client import Counter, Gauge, Histogram
from pythonjsonlogger import jsonlogger


@dataclass
class MetricsConfig:
    """Configuration for metrics collection."""

    namespace: str = "dojopool"
    subsystem: str = "core"
    labels: Dict[str, str] = None

    def __post_init__(self):
        self.labels = self.labels or {}


class MetricsRegistry:
    """Registry for Prometheus metrics."""

    def __init__(self, config: MetricsConfig):
        self.config = config

        # Request metrics
        self.request_counter = Counter(
            f"{config.namespace}_requests_total",
            "Total number of requests",
            ["method", "endpoint", "status"],
        )

        self.request_latency = Histogram(
            f"{config.namespace}_request_latency_seconds",
            "Request latency in seconds",
            ["method", "endpoint"],
            buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
        )

        # Game metrics
        self.active_games = Gauge(
            f"{config.namespace}_active_games", "Number of currently active games"
        )

        self.game_duration = Histogram(
            f"{config.namespace}_game_duration_seconds",
            "Game duration in seconds",
            ["game_type"],
            buckets=(300, 600, 900, 1200, 1800, 2700, 3600),
        )

        # System metrics
        self.system_memory = Gauge(
            f"{config.namespace}_system_memory_bytes", "System memory usage in bytes", ["type"]
        )

        self.cpu_usage = Gauge(
            f"{config.namespace}_cpu_usage_percent", "CPU usage percentage", ["core"]
        )

        # Error metrics
        self.error_counter = Counter(
            f"{config.namespace}_errors_total", "Total number of errors", ["type", "component"]
        )


def setup_logging(log_level: str = "INFO", json_logs: bool = True, log_file: str = None) -> None:
    """Set up structured logging.

    Args:
        log_level: Logging level
        json_logs: Whether to output logs in JSON format
        log_file: Optional log file path
    """
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.stdlib.render_to_log_kwargs,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Console handler
    console_handler = logging.StreamHandler()

    if json_logs:
        formatter = jsonlogger.JsonFormatter(
            fmt="%(asctime)s %(name)s %(levelname)s %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
        )
    else:
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File handler if log file specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)


class HealthCheck:
    """Health check implementation."""

    @staticmethod
    def check_database() -> Dict[str, Any]:
        """Check database health."""
        from sqlalchemy import create_engine
        from sqlalchemy.exc import SQLAlchemyError

        try:
            engine = create_engine(os.getenv("DATABASE_URL"))
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            return {"status": "healthy", "message": "Database connection successful"}
        except SQLAlchemyError as e:
            return {"status": "unhealthy", "message": str(e)}

    @staticmethod
    def check_redis() -> Dict[str, Any]:
        """Check Redis health."""
        import redis
        from redis.exceptions import RedisError

        try:
            client = redis.Redis.from_url(os.getenv("REDIS_URL"))
            client.ping()
            return {"status": "healthy", "message": "Redis connection successful"}
        except RedisError as e:
            return {"status": "unhealthy", "message": str(e)}

    @staticmethod
    def check_disk_space() -> Dict[str, Any]:
        """Check disk space."""
        import shutil

        total, used, free = shutil.disk_usage("/")
        percent_used = (used / total) * 100

        return {
            "status": "healthy" if percent_used < 90 else "warning",
            "message": f"Disk usage: {percent_used:.1f}%",
            "details": {
                "total_gb": total // (2**30),
                "used_gb": used // (2**30),
                "free_gb": free // (2**30),
            },
        }

    @classmethod
    def check_all(cls) -> Dict[str, Any]:
        """Run all health checks."""
        checks = {
            "database": cls.check_database(),
            "redis": cls.check_redis(),
            "disk": cls.check_disk_space(),
        }

        overall_status = all(check["status"] == "healthy" for check in checks.values())

        return {
            "status": "healthy" if overall_status else "unhealthy",
            "checks": checks,
            "timestamp": structlog.get_timestamp(),
        }
