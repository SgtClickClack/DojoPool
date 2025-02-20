"""
Security monitoring configuration settings.
"""

import re
from typing import Dict, Pattern

# Rate limiting configuration
RATE_LIMIT_CONFIG = {
    "default": {"requests_per_minute": 100, "window_seconds": 60},
    "api": {"requests_per_minute": 1000, "window_seconds": 60},
    "auth": {"requests_per_minute": 10, "window_seconds": 60},
}

# Suspicious patterns for threat detection
SUSPICIOUS_PATTERNS: Dict[str, Pattern] = {
    "sql_injection": re.compile(
        r"(?i)(union\s+select|select\s+.*\s+from|insert\s+into|delete\s+from|drop\s+table)"
    ),
    "xss": re.compile(r"(?i)(<script|javascript:|on\w+\s*=|\balert\s*\(|\beval\s*\()"),
    "path_traversal": re.compile(r"(?i)(\.\.\/|\.\.\\|~\/|\x00)"),
    "command_injection": re.compile(r"(?i)(&|\||;|\$\(|\`|\bsh\b|\bbash\b|\bcmd\b)"),
    "file_inclusion": re.compile(
        r"(?i)(php://|zip://|phar://|file://|https?://|ftp://)"
    ),
}

# Protected paths that require additional security checks
PROTECTED_PATHS = [
    "/admin",
    "/api/admin",
    "/api/v1/admin",
    "/settings",
    "/users/manage",
    "/system",
    "/security",
]

# IP-based security settings
IP_SECURITY = {
    "max_failed_attempts": 5,
    "block_duration_minutes": 30,
    "whitelist": ["127.0.0.1", "localhost"],
    "blacklist": [],
}

# Authentication security settings
AUTH_SECURITY = {
    "max_login_attempts": 5,
    "lockout_duration_minutes": 30,
    "password_requirements": {
        "min_length": 12,
        "require_uppercase": True,
        "require_lowercase": True,
        "require_numbers": True,
        "require_special_chars": True,
        "max_repeated_chars": 3,
    },
    "session_timeout_minutes": 60,
    "require_2fa_for_paths": ["/admin", "/api/admin", "/settings", "/security"],
}

# Content security settings
CONTENT_SECURITY = {
    "max_upload_size_mb": 10,
    "allowed_file_types": [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "text/plain",
        "application/json",
    ],
    "scan_uploads": True,
    "sanitize_html": True,
}

# Alert configuration
ALERT_CONFIG = {
    "email": {"enabled": True, "recipients": [], "min_severity": "HIGH"},
    "slack": {
        "enabled": False,
        "webhook_url": "",
        "channel": "#security-alerts",
        "min_severity": "MEDIUM",
    },
    "sms": {"enabled": False, "recipients": [], "min_severity": "CRITICAL"},
}

# Logging configuration
LOGGING_CONFIG = {
    "log_file": "security_events.log",
    "log_level": "INFO",
    "max_file_size_mb": 100,
    "backup_count": 10,
    "include_request_body": False,
    "mask_sensitive_data": True,
    "sensitive_fields": [
        "password",
        "token",
        "api_key",
        "secret",
        "credit_card",
        "ssn",
    ],
}

# Headers security configuration
SECURITY_HEADERS = {
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "connect-src 'self'"
    ),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": (
        "accelerometer=(), "
        "camera=(), "
        "geolocation=(), "
        "gyroscope=(), "
        "magnetometer=(), "
        "microphone=(), "
        "payment=(), "
        "usb=()"
    ),
}

# CORS configuration
CORS_CONFIG = {
    "allowed_origins": ["https://dojopool.com", "https://*.dojopool.com"],
    "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allowed_headers": ["Content-Type", "Authorization", "X-Requested-With"],
    "expose_headers": ["X-Total-Count", "X-Page-Count"],
    "max_age": 3600,
    "supports_credentials": True,
}

# API security configuration
API_SECURITY = {
    "require_https": True,
    "api_key_header": "X-API-Key",
    "token_header": "Authorization",
    "token_prefix": "Bearer",
    "token_expiration_hours": 24,
    "rate_limit_by_ip": True,
    "rate_limit_by_user": True,
    "rate_limit_by_api_key": True,
}

# Monitoring thresholds
MONITORING_THRESHOLDS = {
    "high_cpu_usage_percent": 80,
    "high_memory_usage_percent": 80,
    "high_disk_usage_percent": 85,
    "slow_response_time_ms": 1000,
    "high_error_rate_percent": 5,
    "suspicious_traffic_multiplier": 3,
}
