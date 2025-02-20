from typing import Dict, List

# Alert thresholds for different metrics
PERFORMANCE_THRESHOLDS = {
    "system": {
        "cpu_usage": {"warning": 70.0, "critical": 85.0},  # Percentage
        "memory_usage": {"warning": 75.0, "critical": 90.0},  # Percentage
        "disk_usage": {"warning": 80.0, "critical": 90.0},  # Percentage
    },
    "game": {
        "frame_rate": {"warning": 45.0, "critical": 30.0},  # FPS
        "latency": {"warning": 100.0, "critical": 200.0},  # Milliseconds
        "animation_time": {
            "warning": 16.0,  # Milliseconds (targeting 60fps)
            "critical": 33.0,  # Milliseconds (below 30fps)
        },
    },
    "api": {
        "response_time": {"warning": 500.0, "critical": 1000.0},  # Milliseconds
        "error_rate": {"warning": 1.0, "critical": 5.0},  # Percentage
        "request_rate": {"warning": 800.0, "critical": 1000.0},  # Requests per minute
    },
    "network": {
        "bandwidth_usage": {
            "warning": 80.0,  # Percentage of available
            "critical": 90.0,
        },
        "packet_loss": {"warning": 1.0, "critical": 5.0},  # Percentage
    },
}

# Alert channel configurations
NOTIFICATION_CHANNELS = {
    "email": {
        "enabled": True,
        "priority_threshold": "warning",  # Send email for warning and above
        "throttle_duration": 300,  # 5 minutes between similar alerts
        "recipients": {
            "default": ["admin@dojopool.com"],
            "critical": ["admin@dojopool.com", "oncall@dojopool.com"],
        },
    },
    "slack": {
        "enabled": True,
        "priority_threshold": "info",  # Send all alerts to Slack
        "throttle_duration": 60,  # 1 minute between similar alerts
        "channels": {"default": "#dojopool-monitoring", "critical": "#dojopool-alerts"},
    },
    "in_app": {
        "enabled": True,
        "priority_threshold": "info",  # Show all alerts in-app
        "throttle_duration": 0,  # No throttling for in-app notifications
        "retention_period": 604800,  # Keep alerts for 7 days
    },
}

# Alert message templates
ALERT_TEMPLATES: Dict[str, Dict[str, str]] = {
    "high_cpu_usage": {
        "title": "High CPU Usage Detected",
        "message": "CPU usage has reached {value}%, exceeding the {threshold}% threshold. This may impact system performance.",
    },
    "high_memory_usage": {
        "title": "High Memory Usage Alert",
        "message": "Memory usage has reached {value}%, exceeding the {threshold}% threshold. Consider optimizing memory usage.",
    },
    "low_frame_rate": {
        "title": "Low Frame Rate Warning",
        "message": "Frame rate has dropped to {value} FPS, below the {threshold} FPS target. This may affect game smoothness.",
    },
    "high_latency": {
        "title": "High Latency Detected",
        "message": "Network latency has increased to {value}ms, exceeding the {threshold}ms threshold. This may affect game responsiveness.",
    },
    "api_performance": {
        "title": "API Performance Issue",
        "message": "API response time has increased to {value}ms, exceeding the {threshold}ms threshold. This may affect application responsiveness.",
    },
    "error_rate": {
        "title": "High Error Rate Alert",
        "message": "Error rate has reached {value}%, exceeding the {threshold}% threshold. Please investigate the cause.",
    },
}

# Alert grouping and correlation rules
ALERT_CORRELATION_RULES = {
    "group_by": ["metric_type", "severity"],
    "time_window": 300,  # 5 minutes
    "min_occurrences": 3,  # Minimum occurrences to group alerts
    "correlation_patterns": [
        {
            "name": "cascading_failure",
            "metrics": ["cpu_usage", "memory_usage", "error_rate"],
            "window": 600,  # 10 minutes
            "pattern": "increasing",
        },
        {
            "name": "network_degradation",
            "metrics": ["latency", "packet_loss", "error_rate"],
            "window": 300,  # 5 minutes
            "pattern": "threshold_breach",
        },
    ],
}

# Notification formatting preferences
FORMATTING_PREFERENCES = {
    "email": {
        "format": "html",
        "include_graphs": True,
        "max_graph_points": 20,
        "color_scheme": {
            "info": "#2196F3",
            "warning": "#FFA000",
            "critical": "#D32F2F",
        },
    },
    "slack": {
        "use_blocks": True,
        "include_graphs": True,
        "max_graph_points": 10,
        "use_threading": True,
        "thread_updates": True,
    },
    "in_app": {
        "show_graphs": True,
        "auto_dismiss": False,
        "dismiss_after": 0,  # 0 means never auto-dismiss
        "stack_similar": True,
        "max_visible": 5,
    },
}
