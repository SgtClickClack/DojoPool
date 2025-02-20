"""Base configuration module for DojoPool application."""

import os
from datetime import timedelta
from typing import Any, Dict


class BaseConfig:
    """Base configuration class with common settings."""

    # Flask settings
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-key-please-change-in-production")
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    TESTING = False

    # Security settings
    SESSION_COOKIE_SECURE = (
        os.getenv("SESSION_COOKIE_SECURE", "False").lower() == "true"
    )
    SESSION_COOKIE_HTTPONLY = True
    PERMANENT_SESSION_LIFETIME = timedelta(days=31)
    WTF_CSRF_ENABLED = True

    # Database settings
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "sqlite:///instance/dojopool.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Mail settings
    MAIL_SERVER = os.getenv("MAIL_SERVER", "localhost")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "1025"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "False").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "test@example.com")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "test_password")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "test@dojopool.com")

    # OAuth settings
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

    # Redis settings
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = "uploads"

    # Security settings
    PASSWORD_SALT = os.getenv("PASSWORD_SALT", "secure-password-salt")
    TOKEN_SALT = os.getenv("TOKEN_SALT", "secure-token-salt")
    API_KEY_SALT = os.getenv("API_KEY_SALT", "secure-api-key-salt")

    # Rate limiting
    RATELIMIT_DEFAULT = "200 per day;50 per hour;1 per second"
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_STRATEGY = "fixed-window"

    # Cache settings
    CACHE_TYPE = "redis"
    CACHE_REDIS_URL = REDIS_URL
    CACHE_DEFAULT_TIMEOUT = 300

    # JWT settings
    JWT_SECRET_KEY = SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Socket.IO settings
    SOCKETIO_MESSAGE_QUEUE = REDIS_URL

    @staticmethod
    def init_app(app: Any) -> None:
        """Initialize application with this configuration.

        Args:
            app: Flask application instance
        """
        pass
