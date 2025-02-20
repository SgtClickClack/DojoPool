#!/usr/bin/env python3
"""Initialize security metrics collection."""

import logging
import os
import sys
from pathlib import Path

import redis

from dojopool.core.cache import SecureCache
from dojopool.services.security_metrics_service import SecurityMetricsService

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


def init_redis_connection() -> redis.Redis:
    """Initialize Redis connection for metrics storage."""
    try:
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        redis_db = int(os.getenv("REDIS_METRICS_DB", 1))
        redis_password = os.getenv("REDIS_PASSWORD")

        client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            password=redis_password,
            decode_responses=True,
            ssl=True,
        )

        # Test connection
        client.ping()
        logger.info("Successfully connected to Redis")
        return client

    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
        sys.exit(1)


def setup_metrics_service(redis_client: redis.Redis) :
    """Set up the security metrics service."""
    try:
        metrics_service = SecurityMetricsService(redis_client)
        logger.info("Successfully initialized SecurityMetricsService")
        return metrics_service

    except Exception as e:
        logger.error(f"Failed to initialize SecurityMetricsService: {str(e)}")
        sys.exit(1)


def initialize_default_metrics(metrics_service: SecurityMetricsService) :
    """Initialize default security metrics."""
    try:
        # Set initial security score
        metrics_service.update_security_score(100.0)

        # Initialize counters for different severity levels
        for severity in ["high", "medium", "low"]:
            metrics_service.vulnerability_count.labels(severity=severity).set(0)

        logger.info("Successfully initialized default metrics")

    except Exception as e:
        logger.error(f"Failed to initialize default metrics: {str(e)}")
        sys.exit(1)


def main():
    """Main execution function."""
    try:
        logger.info("Starting security metrics initialization")

        # Initialize Redis connection
        redis_client = init_redis_connection()

        # Set up metrics service
        metrics_service = setup_metrics_service(redis_client)

        # Initialize default metrics
        initialize_default_metrics(metrics_service)

        logger.info("Security metrics initialization completed successfully")

    except Exception as e:
        logger.error(f"Security metrics initialization failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
