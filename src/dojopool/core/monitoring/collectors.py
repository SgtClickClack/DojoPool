"""System metrics collection utilities."""

from datetime import datetime
from typing import Callable, Dict, Optional, Union

import psutil

try:
    import GPUtil

    HAS_GPU = True
except ImportError:
    HAS_GPU = False

from .metrics import MetricsSnapshot

MetricCallback = Callable[[], float]
ProcessMetrics = Dict[str, Union[float, Dict[str, float]]]


class MetricsCollector:
    """Collects system metrics."""

    def __init__(
        self, custom_metrics_callbacks: Optional[Dict[str, MetricCallback]] = None
    ):
        """Initialize collector.

        Args:
            custom_metrics_callbacks: Dictionary mapping metric names to callback functions
        """
        self._prev_net_io = psutil.net_io_counters()
        self._custom_metrics_callbacks = custom_metrics_callbacks or {}

    def collect(self) -> MetricsSnapshot:
        """Collect current system metrics.

        Returns:
            MetricsSnapshot: Current metrics
        """
        # Get CPU usage
        cpu_usage = psutil.cpu_percent(interval=1)

        # Get memory usage
        memory = psutil.virtual_memory()
        memory_usage = memory.percent

        # Get disk usage
        disk = psutil.disk_usage("/")
        disk_usage = disk.percent

        # Get network I/O
        net_io = psutil.net_io_counters()
        network_io = {
            "bytes_sent": float(net_io.bytes_sent - self._prev_net_io.bytes_sent),
            "bytes_recv": float(net_io.bytes_recv - self._prev_net_io.bytes_recv),
        }
        self._prev_net_io = net_io

        # Collect custom metrics
        custom_metrics = None
        if self._custom_metrics_callbacks:
            custom_metrics = {
                name: callback()
                for name, callback in self._custom_metrics_callbacks.items()
            }

        # Create snapshot
        return MetricsSnapshot(
            timestamp=datetime.now(),
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            disk_usage=disk_usage,
            network_io=network_io,
            custom_metrics=custom_metrics,
        )

    def collect_with_gpu(self) -> MetricsSnapshot:
        """Collect system metrics including GPU usage if available.

        Returns:
            MetricsSnapshot: Current metrics including GPU
        """
        snapshot = self.collect()
        if HAS_GPU:
            gpus = GPUtil.getGPUs()
            if gpus:
                # Use first GPU if multiple are available
                gpu = gpus[0]
                snapshot.gpu_usage = gpu.load * 100
        return snapshot

    def get_process_metrics(self, pid: Optional[int] = None):
        """Get metrics for a specific process or the current process.

        Args:
            pid: Process ID to monitor. If None, monitors the current process.

        Returns:
            Dict containing process metrics
        """
        process = psutil.Process(pid) if pid else psutil.Process()

        with process.oneshot():
            cpu_percent = process.cpu_percent(interval=1)
            memory_info = process.memory_info()
            memory_percent = process.memory_percent()
            io_counters = process.io_counters()
            num_threads = process.num_threads()

            return {
                "cpu_percent": cpu_percent,
                "memory": {
                    "rss": float(memory_info.rss),
                    "vms": float(memory_info.vms),
                    "percent": memory_percent,
                },
                "io": {
                    "read_bytes": float(io_counters.read_bytes),
                    "write_bytes": float(io_counters.write_bytes),
                },
                "threads": float(num_threads),
            }

    def register_custom_metric(self, name: str, callback: MetricCallback):
        """Register a new custom metric.

        Args:
            name: Name of the metric
            callback: Function that returns a float value
        """
        self._custom_metrics_callbacks[name] = callback

    def unregister_custom_metric(self, name: str):
        """Unregister a custom metric.

        Args:
            name: Name of the metric to remove
        """
        self._custom_metrics_callbacks.pop(name, None)
