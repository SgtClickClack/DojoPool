"""Celery configuration module."""

# Broker settings
broker_url = "memory://"  # Use in-memory broker for development
result_backend = "rpc://"

# Task settings
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]
timezone = "UTC"
enable_utc = True

# Task execution settings
task_always_eager = True  # Execute tasks immediately for development
task_eager_propagates = True

# Worker settings
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 1000
worker_disable_rate_limits = True

# Queue settings
task_default_queue = "default"
task_queues = {
    "default": {
        "exchange": "default",
        "routing_key": "default",
    }
}
