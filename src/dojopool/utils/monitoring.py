"""
Monitoring utilities and base Prometheus metrics.
"""

from prometheus_client import CollectorRegistry, Counter, Histogram

# Create a custom registry
REGISTRY = CollectorRegistry()

# Request metrics
REQUEST_COUNT = Counter(
    "app_request_count_total",
    "Total Request Count",
    ["method", "endpoint", "http_status"],
    registry=REGISTRY,
)

REQUEST_LATENCY = Histogram(
    "app_request_latency_seconds",
    "Request Latency",
    ["method", "endpoint"],
    registry=REGISTRY,
)

# Image processing metrics
IMAGE_PROCESSING_COUNT = Counter(
    "app_image_processing_total",
    "Total Image Processing Count",
    ["format", "status"],
    registry=REGISTRY,
)

IMAGE_PROCESSING_DURATION = Histogram(
    "app_image_processing_duration_seconds",
    "Image Processing Duration",
    ["format"],
    registry=REGISTRY,
)

IMAGE_SIZE_REDUCTION = Histogram(
    "app_image_size_reduction_bytes",
    "Image Size Reduction",
    ["format"],
    registry=REGISTRY,
)

# Memory usage metrics
MEMORY_USAGE = Histogram(
    "app_memory_usage_bytes", "Memory Usage", ["component"], registry=REGISTRY
)

# Error metrics
ERROR_COUNT = Counter(
    "app_error_count_total",
    "Total Error Count",
    ["severity", "component"],
    registry=REGISTRY,
)

ERROR_HANDLING_DURATION = Histogram(
    "app_error_handling_duration_seconds",
    "Error Handling Duration",
    ["severity", "component"],
    registry=REGISTRY,
)

# Cache metrics
CACHE_HIT_COUNT = Counter(
    "app_cache_hit_total", "Cache Hit Count", ["cache_type"], registry=REGISTRY
)

CACHE_MISS_COUNT = Counter(
    "app_cache_miss_total", "Cache Miss Count", ["cache_type"], registry=REGISTRY
)

# Database metrics
DB_QUERY_DURATION = Histogram(
    "app_db_query_duration_seconds",
    "Database Query Duration",
    ["query_type"],
    registry=REGISTRY,
)

DB_CONNECTION_COUNT = Counter(
    "app_db_connection_total",
    "Database Connection Count",
    ["status"],
    registry=REGISTRY,
)

# System metrics
SYSTEM_CPU_USAGE = Histogram(
    "app_system_cpu_usage_percent", "System CPU Usage", ["component"], registry=REGISTRY
)

SYSTEM_DISK_USAGE = Histogram(
    "app_system_disk_usage_bytes",
    "System Disk Usage",
    ["mount_point"],
    registry=REGISTRY,
)

# Network metrics
NETWORK_IO = Counter(
    "app_network_io_bytes_total",
    "Network IO",
    ["direction"],
    registry=REGISTRY,  # in/out
)

NETWORK_LATENCY = Histogram(
    "app_network_latency_seconds", "Network Latency", ["endpoint"], registry=REGISTRY
)


# Export the registry
def get_registry():
    """Get the metrics registry."""
    return REGISTRY
