"""
System metrics collector for monitoring system resources.
"""

import threading
from typing import Any, Dict, Optional

import psutil

from ...utils.monitoring import MEMORY_USAGE, NETWORK_IO, SYSTEM_CPU_USAGE, SYSTEM_DISK_USAGE


class SystemMetricsCollector:
    """Collects and reports system metrics periodically."""

    def __init__(self, interval: int = 30):
        """Initialize the collector.

        Args:
            interval: Collection interval in seconds
        """
        self.interval = interval
        self._stop_event = threading.Event()
        self._collection_thread: Optional[threading.Thread] = None

    def start(self):
        """Start collecting metrics."""
        if self._collection_thread is not None:
            return

        self._stop_event.clear()
        self._collection_thread = threading.Thread(target=self._collect_metrics, daemon=True)
        self._collection_thread.start()

    def stop(self):
        """Stop collecting metrics."""
        if self._collection_thread is None:
            return

        self._stop_event.set()
        self._collection_thread.join()
        self._collection_thread = None

    def _collect_metrics(self):
        """Collect and report system metrics periodically."""
        while not self._stop_event.is_set():
            try:
                # Collect CPU metrics
                cpu_percent = psutil.cpu_percent(interval=1)
                SYSTEM_CPU_USAGE.labels(component="total").observe(cpu_percent)

                per_cpu = psutil.cpu_percent(interval=1, percpu=True)
                for i, cpu in enumerate(per_cpu):
                    SYSTEM_CPU_USAGE.labels(component=f"cpu{i}").observe(cpu)

                # Collect memory metrics
                memory = psutil.virtual_memory()
                MEMORY_USAGE.labels(component="total").observe(memory.total)
                MEMORY_USAGE.labels(component="available").observe(memory.available)
                MEMORY_USAGE.labels(component="used").observe(memory.used)

                # Collect disk metrics
                for partition in psutil.disk_partitions():
                    try:
                        usage = psutil.disk_usage(partition.mountpoint)
                        SYSTEM_DISK_USAGE.labels(mount_point=partition.mountpoint).observe(
                            usage.used
                        )
                    except (PermissionError, OSError):
                        continue

                # Collect network IO metrics
                net_io = psutil.net_io_counters()
                NETWORK_IO.labels(direction="in").inc(net_io.bytes_recv)
                NETWORK_IO.labels(direction="out").inc(net_io.bytes_sent)

            except Exception as e:
                # Log error but continue collecting
                from .error_logger import ErrorSeverity, error_logger

                error_logger.log_error(
                    error=e, severity=ErrorSeverity.WARNING, component="system_metrics_collector"
                )

            # Wait for next collection interval
            self._stop_event.wait(self.interval)

    def get_current_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get current system metrics.

        Returns:
            Dictionary containing current system metrics
        """
        metrics = {
            "cpu": {
                "total": psutil.cpu_percent(interval=1),
                "per_cpu": psutil.cpu_percent(interval=1, percpu=True),
            },
            "memory": dict(psutil.virtual_memory()._asdict()),
            "disk": {},
            "network": dict(psutil.net_io_counters()._asdict()),
        }

        # Add disk metrics
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                metrics["disk"][partition.mountpoint] = dict(usage._asdict())
            except (PermissionError, OSError):
                continue

        return metrics
