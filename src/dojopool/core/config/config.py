"""Base configuration class for DojoPool."""

import os
from datetime import timedelta
from pathlib import Path
from typing import Dict


class Config:
    """Base configuration class with core settings."""

    # Application root directory
    BASE_DIR = Path(__file__).resolve().parent.parent.parent

    # Basic Flask configuration
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-key-please-change-in-production")
    DEBUG = False
    TESTING = False
    ENV = "production"

    # Database configuration
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security settings
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    WTF_CSRF_ENABLED = True

    # Rate limiting
    RATELIMIT_ENABLED = True
    LOGIN_RATE_LIMIT = "5 per minute"
    API_RATE_LIMIT = "100 per minute"

    # Session management
    SESSION_LIFETIME = int(os.getenv("SESSION_LIFETIME", "24"))  # hours
    PERMANENT_SESSION_LIFETIME = timedelta(
        days=int(os.getenv("PERMANENT_SESSION_LIFETIME_DAYS", "7"))
    )
    SESSION_REFRESH_EACH_REQUEST = True

    # OAuth settings
    OAUTH_PROVIDERS = {
        "google": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        },
        "github": {
            "client_id": os.getenv("GITHUB_CLIENT_ID"),
            "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
        },
    }

    # Game settings
    MAX_PLAYERS_PER_GAME = int(os.getenv("MAX_PLAYERS_PER_GAME", "4"))
    COIN_SPAWN_INTERVAL = int(os.getenv("COIN_SPAWN_INTERVAL", "5"))

    # Logging configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Cache configuration
    CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_TIMEOUT", "300"))

    # API configuration
    API_TITLE = "DojoPool API"
    API_VERSION = "1.0"
    OPENAPI_VERSION = "3.0.2"

    # Mail configuration
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "noreply@dojopool.com")

    @classmethod
    def init_app(cls, app):
        """Initialize application with this configuration."""
        os.makedirs(app.instance_path, exist_ok=True)

    @classmethod
    def validate(cls) -> Dict[str, str]:
        """Validate configuration settings.

        Returns:
            Dict of validation errors if any
        """
        errors = {}

        # Validate required environment variables
        if cls.ENV == "production":
            if cls.SECRET_KEY == "dev-key-please-change-in-production":
                errors["SECRET_KEY"] = "Production requires a secure SECRET_KEY"

        # Validate OAuth settings if enabled
        for provider, config in cls.OAUTH_PROVIDERS.items():
            if config["client_id"] or config["client_secret"]:
                if not config["client_id"]:
                    errors[f"{provider.upper()}_CLIENT_ID"] = (
                        f"{provider} OAuth enabled but client_id missing"
                    )
                if not config["client_secret"]:
                    errors[f"{provider.upper()}_CLIENT_SECRET"] = (
                        f"{provider} OAuth enabled but client_secret missing"
                    )

        # Validate mail settings if not in development
        if cls.ENV != "development" and not cls.MAIL_SUPPRESS_SEND:
            if not cls.MAIL_USERNAME or not cls.MAIL_PASSWORD:
                errors["MAIL_CREDENTIALS"] = (
                    "Mail username and password required for sending emails"
                )

        return errors
