"""Basic metrics collectors for DojoPool performance monitoring."""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional

import psutil


@dataclass
class SystemMetrics:
    """System-level performance metrics."""

    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    disk_percent: float


class MetricsCollector:
    """Collects basic system and application metrics."""

    def collect_system_metrics(self) -> SystemMetrics:
        """Collect current system metrics."""
        return SystemMetrics(
            timestamp=datetime.now(),
            cpu_percent=psutil.cpu_percent(interval=1),
            memory_percent=psutil.virtual_memory().percent,
            disk_percent=psutil.disk_usage("/").percent,
        )

    def collect_game_metrics(self):
        """Collect game-specific metrics."""
        # Placeholder for game metrics
        return {
            "frame_rate": 60.0,  # Example value
            "latency": 50.0,  # Example value in ms
        }

    def collect_api_metrics(self) -> Dict[str, float]:
        """Collect API performance metrics."""
        # Placeholder for API metrics
        return {
            "response_time": 100.0,  # Example value in ms
            "error_rate": 0.1,  # Example value in percent
        }
