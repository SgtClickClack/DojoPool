"""Metrics data structures and utilities."""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional


@dataclass
class MetricsSnapshot:
    """A snapshot of system metrics at a point in time."""

    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_io: Dict[str, float]
    gpu_usage: Optional[float] = None
    custom_metrics: Optional[Dict[str, float]] = None

    def to_dict(self) -> Dict:
        """Convert snapshot to dictionary.

        Returns:
            Dict: Snapshot data
        """
        return {
            "timestamp": self.timestamp.isoformat(),
            "cpu_usage": self.cpu_usage,
            "memory_usage": self.memory_usage,
            "disk_usage": self.disk_usage,
            "network_io": self.network_io,
            "gpu_usage": self.gpu_usage,
            "custom_metrics": self.custom_metrics,
        }

    @classmethod
    def from_dict(cls, data: Dict):
        """Create snapshot from dictionary.

        Args:
            data: Dictionary containing snapshot data

        Returns:
            MetricsSnapshot: Created snapshot
        """
        return cls(
            timestamp=datetime.fromisoformat(data["timestamp"]),
            cpu_usage=data["cpu_usage"],
            memory_usage=data["memory_usage"],
            disk_usage=data["disk_usage"],
            network_io=data["network_io"],
            gpu_usage=data.get("gpu_usage"),
            custom_metrics=data.get("custom_metrics"),
        )
