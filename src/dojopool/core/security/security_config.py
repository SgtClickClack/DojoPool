"""
Security and threat detection configuration for DojoPool.
"""

import os
from pathlib import Path

# Base paths
SECURITY_ROOT = Path("/var/dojopool/security")
ML_MODEL_PATH = SECURITY_ROOT / "models" / "threat_detection.joblib"
NORMAL_BEHAVIOR_DATA_PATH = SECURITY_ROOT / "data" / "normal_behavior.npy"
THREAT_PATTERNS_PATH = SECURITY_ROOT / "config" / "threat_patterns.json"

# Redis configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_SECURITY_DB", "1"))

# Logging configuration
LOGGING_CONFIG = {
    "log_file": SECURITY_ROOT / "logs" / "security.log",
    "max_file_size_mb": 100,
    "backup_count": 10,
    "log_level": "INFO",
}

# Threat detection thresholds
ANOMALY_THRESHOLD = float(os.getenv("ANOMALY_THRESHOLD", "0.8"))
HIGH_RISK_THRESHOLD = float(os.getenv("HIGH_RISK_THRESHOLD", "0.9"))
MEDIUM_RISK_THRESHOLD = float(os.getenv("MEDIUM_RISK_THRESHOLD", "0.7"))

# Cache TTLs (in seconds)
THREAT_CACHE_TTL = 3600  # 1 hour
IP_BLOCK_DURATION = 3600  # 1 hour
INCREASED_MONITORING_DURATION = 7200  # 2 hours

# Rate limiting
RATE_LIMITS = {
    "api": {"requests_per_minute": 60, "burst": 100},
    "auth": {"requests_per_minute": 10, "burst": 20},
    "default": {"requests_per_minute": 30, "burst": 50},
}

# Notification settings
SECURITY_NOTIFICATION_EMAIL = os.getenv("SECURITY_NOTIFICATION_EMAIL")
SECURITY_SLACK_WEBHOOK = os.getenv("SECURITY_SLACK_WEBHOOK")

# Default threat patterns
DEFAULT_THREAT_PATTERNS = {
    "SQL_INJECTION": {
        "description": "SQL injection attempt",
        "conditions": {
            "path": "/api/.*",
            "method": "POST",
            "payload_pattern": r"(?i)(union|select|insert|delete|update|drop|;|--)",
        },
        "confidence": 0.9,
    },
    "BRUTE_FORCE": {
        "description": "Authentication brute force attempt",
        "conditions": {
            "path": "/auth/login",
            "method": "POST",
            "error_rate": ">0.8",
            "request_rate": ">10/minute",
        },
        "confidence": 0.85,
    },
    "PATH_TRAVERSAL": {
        "description": "Directory traversal attempt",
        "conditions": {
            "path_pattern": r"(?i)(\.\./|\.\.\\|~\/|~\\)",
        },
        "confidence": 0.95,
    },
    "XSS_ATTEMPT": {
        "description": "Cross-site scripting attempt",
        "conditions": {
            "payload_pattern": r"(?i)(<script|javascript:|data:text/html|base64)",
        },
        "confidence": 0.8,
    },
    "API_ABUSE": {
        "description": "API endpoint abuse",
        "conditions": {"path": "/api/.*", "request_rate": ">100/minute"},
        "confidence": 0.75,
    },
    "SUSPICIOUS_ACCESS": {
        "description": "Suspicious resource access pattern",
        "conditions": {"path_diversity": ">20/minute", "error_rate": ">0.5"},
        "confidence": 0.7,
    },
}

# Feature extraction settings
FEATURE_SETTINGS = {
    "request_pattern_window": 300,  # 5 minutes
    "error_rate_window": 600,  # 10 minutes
    "session_timeout": 1800,  # 30 minutes
    "action_window": 300,  # 5 minutes
    "max_request_size": 1048576,  # 1MB
    "max_session_duration": 86400,  # 24 hours
}

# Response thresholds
RESPONSE_THRESHOLDS = {
    "block_ip_score": 0.9,
    "increase_monitoring_score": 0.7,
    "alert_score": 0.5,
    "max_failed_attempts": 5,
    "suspicious_countries": {"XX", "T1"},  # Unknown  # Tor exit nodes
}

# ML model settings
ML_SETTINGS = {
    "retrain_interval": 86400,  # 24 hours
    "min_samples_for_training": 1000,
    "contamination_factor": 0.1,
    "n_estimators": 100,
    "max_features": 8,
}


# Create required directories
def setup_directories():
    """Create required security directories."""
    for path in [
        SECURITY_ROOT,
        SECURITY_ROOT / "models",
        SECURITY_ROOT / "data",
        SECURITY_ROOT / "config",
        SECURITY_ROOT / "logs",
    ]:
        path.mkdir(parents=True, exist_ok=True)


# Initialize directories
setup_directories()
