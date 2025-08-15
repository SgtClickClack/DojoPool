"""Example usage of the metrics collection system."""

import os
import time
import random
from .collectors import MetricsCollector


def random_metric() -> float:
    """Example custom metric that returns a random value."""
    return random.random() * 100


def main():
    """Run example metrics collection."""
    # Create collector with a custom metric
    collector = MetricsCollector({"random_value": random_metric})

    # Register another custom metric
    collector.register_custom_metric("timestamp", lambda: time.time())

    print("Collecting basic metrics...")
    snapshot = collector.collect()
    print("\nBasic Metrics:")
    print(f"Timestamp: {snapshot.timestamp}")
    print(f"CPU Usage: {snapshot.cpu_usage:.1f}%")
    print(f"Memory Usage: {snapshot.memory_usage:.1f}%")
    print(f"Disk Usage: {snapshot.disk_usage:.1f}%")
    print(f"Network I/O (bytes):")
    print(f"  Sent: {snapshot.network_io['bytes_sent']:.0f}")
    print(f"  Received: {snapshot.network_io['bytes_recv']:.0f}")

    print("\nCustom Metrics:")
    if snapshot.custom_metrics:
        for name, value in snapshot.custom_metrics.items():
            print(f"{name}: {value:.1f}")

    print("\nCollecting metrics with GPU...")
    snapshot = collector.collect_with_gpu()
    if snapshot.gpu_usage is not None:
        print(f"GPU Usage: {snapshot.gpu_usage:.1f}%")
    else:
        print("GPU metrics not available")

    print("\nProcess Metrics:")
    # Get metrics for the current process
    process_metrics = collector.get_process_metrics()
    print(f"Current Process (PID {os.getpid()}):")
    print(f"CPU Usage: {process_metrics['cpu_percent']:.1f}%")
    print(f"Memory Usage: {process_metrics['memory']['percent']:.1f}%")
    print(f"Memory RSS: {process_metrics['memory']['rss'] / 1024 / 1024:.1f} MB")
    print(f"Memory VMS: {process_metrics['memory']['vms'] / 1024 / 1024:.1f} MB")
    print(f"I/O Read: {process_metrics['io']['read_bytes'] / 1024:.1f} KB")
    print(f"I/O Write: {process_metrics['io']['write_bytes'] / 1024:.1f} KB")
    print(f"Threads: {process_metrics['threads']:.0f}")


if __name__ == "__main__":
    main()
