import gc
import gc
"""Performance monitoring system."""

import threading
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, List, Optional

import psutil

from .metrics_monitor import AlertSeverity, metrics_monitor


@dataclass
class PerformanceMetrics:
    """Performance metrics data."""

    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    memory_available: float = 0.0
    disk_usage: float = 0.0
    network_sent: float = 0.0
    network_received: float = 0.0
    process_count: int = 0
    thread_count: int = 0
    timestamp: datetime = datetime.utcnow()


class PerformanceMonitor:
    """System performance monitoring."""

    def __init__(self, interval: int = 60):
        """Initialize performance monitor.

        Args:
            interval: Monitoring interval in seconds
        """
        self.interval = interval
        self.running = False
        self.metrics_history: List[PerformanceMetrics] = []
        self.max_history_size = 1440  # 24 hours at 1-minute intervals
        self.alert_thresholds = {
            "cpu_usage": 80.0,
            "memory_usage": 80.0,
            "disk_usage": 90.0,
        }
        self.on_metrics_update: Optional[Callable[[PerformanceMetrics], None]] = None

    def start(self):
        """Start performance monitoring."""
        if self.running:
            return

        self.running = True
        threading.Thread(target=self._monitor_loop, daemon=True).start()

    def stop(self):
        """Stop performance monitoring."""
        self.running = False

    def _monitor_loop(self):
        """Main monitoring loop."""
        while self.running:
            try:
                metrics = self._collect_metrics()
                self._process_metrics(metrics)
                time.sleep(self.interval)
            except Exception as e:
                metrics_monitor.add_alert(
                    AlertSeverity.ERROR,
                    "Performance monitoring error",
                    {"error": str(e)},
                )

    def _collect_metrics(self) -> PerformanceMetrics:
        """Collect current performance metrics.

        Returns:
            PerformanceMetrics: Current system metrics
        """
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")
        network = psutil.net_io_counters()

        return PerformanceMetrics(
            cpu_usage=cpu_usage,
            memory_usage=memory.percent,
            memory_available=memory.available / (1024 * 1024 * 1024),  # GB
            disk_usage=disk.percent,
            network_sent=network.bytes_sent / (1024 * 1024),  # MB
            network_received=network.bytes_recv / (1024 * 1024),  # MB
            process_count=len(psutil.pids()),
            thread_count=threading.active_count(),
            timestamp=datetime.utcnow(),
        )

    def _process_metrics(self, metrics: PerformanceMetrics):
        """Process collected metrics.

        Args:
            metrics: Collected performance metrics
        """
        # Add to history
        self.metrics_history.append(metrics)
        if len(self.metrics_history) > self.max_history_size:
            self.metrics_history.pop(0)

        # Check thresholds
        self._check_thresholds(metrics)

        # Notify listeners
        if self.on_metrics_update:
            self.on_metrics_update(metrics)

    def _check_thresholds(self, metrics: PerformanceMetrics):
        """Check metrics against alert thresholds.

        Args:
            metrics: Current performance metrics
        """
        if metrics.cpu_usage > self.alert_thresholds["cpu_usage"]:
            metrics_monitor.add_alert(
                AlertSeverity.WARNING,
                f"High CPU usage: {metrics.cpu_usage:.1f}%",
                {"metric": "cpu_usage", "value": metrics.cpu_usage},
            )

        if metrics.memory_usage > self.alert_thresholds["memory_usage"]:
            metrics_monitor.add_alert(
                AlertSeverity.WARNING,
                f"High memory usage: {metrics.memory_usage:.1f}%",
                {"metric": "memory_usage", "value": metrics.memory_usage},
            )

        if metrics.disk_usage > self.alert_thresholds["disk_usage"]:
            metrics_monitor.add_alert(
                AlertSeverity.WARNING,
                f"High disk usage: {metrics.disk_usage:.1f}%",
                {"metric": "disk_usage", "value": metrics.disk_usage},
            )

    def get_metrics(
        self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
    ) -> List[PerformanceMetrics]:
        """Get historical metrics within time range.

        Args:
            start_time: Optional start time filter
            end_time: Optional end time filter

        Returns:
            List[PerformanceMetrics]: Filtered metrics history
        """
        if not start_time and not end_time:
            return list(self.metrics_history)

        filtered = self.metrics_history
        if start_time:
            filtered = [m for m in filtered if m.timestamp >= start_time]
        if end_time:
            filtered = [m for m in filtered if m.timestamp <= end_time]

        return filtered

    def get_current_metrics(self) -> PerformanceMetrics:
        """Get current performance metrics.

        Returns:
            PerformanceMetrics: Current system metrics
        """
        return self._collect_metrics()

    def set_alert_threshold(self, metric: str, value: float):
        """Set alert threshold for a metric.

        Args:
            metric: Name of the metric
            value: Threshold value
        """
        if metric in self.alert_thresholds:
            self.alert_thresholds[metric] = value


# Global instance
performance_monitor = PerformanceMonitor()
performance_monitor.start()
