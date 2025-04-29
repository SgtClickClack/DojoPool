"""Development configuration."""

from .config import Config
import os


class DevelopmentConfig(Config):
    """Development environment configuration."""

    DEBUG = True
    ENV = "development"

    # Development database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DEV_DATABASE_URL", "sqlite:///../instance/dojopool_dev.db"
    )
    SQLALCHEMY_ECHO = True  # Log SQL queries
    SQLALCHEMY_RECORD_QUERIES = True # Record queries for debugging
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    # Disable secure cookies in development
    SESSION_COOKIE_SECURE = False
    REMEMBER_COOKIE_SECURE = False

    # Development-specific logging
    LOG_LEVEL = "DEBUG"
    LOG_FILE = "logs/development.log"

    # Use simple cache in development
    CACHE_TYPE = "simple"

    # Development-specific game settings
    COIN_SPAWN_INTERVAL = 2  # Faster spawning for testing

    # Development mail settings
    MAIL_SUPPRESS_SEND = True  # Don't actually send emails
    MAIL_DEFAULT_SENDER = "dev@dojopool.local"

    # Development API settings
    SWAGGER_UI_DOC_EXPANSION = "list"  # Expand API documentation by default
