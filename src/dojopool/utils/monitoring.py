"""
Monitoring utilities and base Prometheus metrics.
"""

from prometheus_client import Counter, Histogram

# Request metrics
REQUEST_COUNT = Counter(
    'app_request_count_total',
    'Total Request Count',
    ['method', 'endpoint', 'http_status']
)

REQUEST_LATENCY = Histogram(
    'app_request_latency_seconds',
    'Request Latency',
    ['method', 'endpoint']
)

# Image processing metrics
IMAGE_PROCESSING_COUNT = Counter(
    'app_image_processing_total',
    'Total Image Processing Count',
    ['format', 'status']
)

IMAGE_PROCESSING_DURATION = Histogram(
    'app_image_processing_duration_seconds',
    'Image Processing Duration',
    ['format']
)

IMAGE_SIZE_REDUCTION = Histogram(
    'app_image_size_reduction_bytes',
    'Image Size Reduction',
    ['format']
)

# Memory usage metrics
MEMORY_USAGE = Histogram(
    'app_memory_usage_bytes',
    'Memory Usage',
    ['component']
)

# Error metrics
ERROR_COUNT = Counter(
    'app_error_count_total',
    'Total Error Count',
    ['severity', 'component']
)

ERROR_HANDLING_DURATION = Histogram(
    'app_error_handling_duration_seconds',
    'Error Handling Duration',
    ['severity', 'component']
)

# Cache metrics
CACHE_HIT_COUNT = Counter(
    'app_cache_hit_total',
    'Cache Hit Count',
    ['cache_type']
)

CACHE_MISS_COUNT = Counter(
    'app_cache_miss_total',
    'Cache Miss Count',
    ['cache_type']
)

# Database metrics
DB_QUERY_DURATION = Histogram(
    'app_db_query_duration_seconds',
    'Database Query Duration',
    ['query_type']
)

DB_CONNECTION_COUNT = Counter(
    'app_db_connection_total',
    'Database Connection Count',
    ['status']
)

# System metrics
SYSTEM_CPU_USAGE = Histogram(
    'app_system_cpu_usage_percent',
    'System CPU Usage',
    ['component']
)

SYSTEM_DISK_USAGE = Histogram(
    'app_system_disk_usage_bytes',
    'System Disk Usage',
    ['mount_point']
)

# Network metrics
NETWORK_IO = Counter(
    'app_network_io_bytes_total',
    'Network IO',
    ['direction']  # in/out
)

NETWORK_LATENCY = Histogram(
    'app_network_latency_seconds',
    'Network Latency',
    ['endpoint']
)
