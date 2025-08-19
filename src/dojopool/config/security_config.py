"""Security configuration settings for DojoPool."""

from typing import Dict, List, Set, Optional


class SecurityConfig:
    # Debug and Environment Settings
    DEBUG: bool = False
    DEVELOPMENT: bool = False

    # Security Keys
    SECRET_KEY: Optional[str] = None  # Must be set in instance config

    # Project Settings
    PROJECT_ROOT: str = "src/dojopool"

    # Security Headers
    SECURE_HEADERS: Dict[str, str] = {
        "X-Frame-Options": "SAMEORIGIN",
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    }

    # CSRF Protection
    WTF_CSRF_ENABLED: bool = True

    # Vulnerability Scanning Settings
    VULNERABILITY_SCAN_SCHEDULE: str = "0 0 * * *"  # Daily at midnight
    VULNERABILITY_SCAN_PATHS: List[str] = ["src/dojopool", "tests"]

    # Excluded paths from vulnerability scanning
    VULNERABILITY_SCAN_EXCLUDE: Set[str] = {
        "tests/fixtures",
        "*.pyc",
        "__pycache__",
        "venv",
        "node_modules",
    }

    # Severity thresholds for different types of vulnerabilities
    SEVERITY_THRESHOLDS: Dict[str, str] = {
        "dependency": "medium",
        "code": "low",
        "configuration": "low",
    }

    # Notification settings for vulnerability alerts
    VULNERABILITY_NOTIFICATIONS: Dict[str, bool] = {"email": True, "slack": False, "sms": False}

    # Rate limiting for vulnerability scans
    MAX_SCANS_PER_HOUR: int = 2
    SCAN_COOLDOWN_MINUTES: int = 30

    @classmethod
    def init_app(cls, app) -> None:
        """Initialize security configuration for the application."""
        app.config.setdefault("SECRET_KEY", cls.SECRET_KEY or "dev-key-CHANGE-ME-in-production")
        app.config.setdefault("WTF_CSRF_ENABLED", cls.WTF_CSRF_ENABLED)
        app.config.setdefault("DEBUG", cls.DEBUG)

        # Apply secure headers
        @app.after_request
        def add_secure_headers(response):
            for header, value in cls.SECURE_HEADERS.items():
                response.headers[header] = value
            return response
