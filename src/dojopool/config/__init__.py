"""Application configuration with enhanced security settings."""

import os
from datetime import timedelta

from .base import BaseConfig


class Config(BaseConfig):
    """Default configuration."""

    DEBUG = False
    TESTING = False
    ENV = "production"

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "postgresql://postgres:postgres@db:5432/dojopool"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security
    SECRET_KEY = os.environ.get("SECRET_KEY", "3996efd780a84a9cb2bbac6d5893a030")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "3996efd780a84a9cb2bbac6d5893a030")

    # Redis
    REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")

    # Session
    SESSION_TYPE = "redis"
    SESSION_REDIS = None  # Will be set in create_app

    # Mail
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", True)
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")

    # Celery
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

    # File Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = "uploads"

    # API
    API_TITLE = "DojoPool API"
    API_VERSION = "v1"
    OPENAPI_VERSION = "3.0.2"

    # Monitoring
    PROMETHEUS_METRICS = True


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    ENV = "development"


class TestingConfig(Config):
    """Testing configuration."""

    TESTING = True
    ENV = "testing"


class ProductionConfig(Config):
    """Production configuration."""

    ENV = "production"


config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}

__all__ = ["Config", "DevelopmentConfig", "TestingConfig", "ProductionConfig", "config"]
