"""Testing configuration module."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from fakeredis import FakeRedis
from flask import current_app
from sqlalchemy import ForeignKey, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.pool import StaticPool

from ..core.extensions import db
from .default import Config


class TestingConfig(Config):
    """Testing configuration."""

    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "poolclass": StaticPool,
        "connect_args": {"check_same_thread": False},
    }

    # Use fake Redis for testing
    REDIS_URL = "redis://localhost:6379/0"
    REDIS_CLIENT = FakeRedis()

    # Disable CSRF protection in testing
    WTF_CSRF_ENABLED = False

    # Use a random secret key for testing
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"

    # OAuth settings
    GOOGLE_CLIENT_ID = "test-google-client-id"
    GOOGLE_CLIENT_SECRET = "test-google-client-secret"

    # Email settings
    MAIL_SERVER = "localhost"
    MAIL_PORT = 25
    MAIL_USE_TLS = False
    MAIL_USE_SSL = False
    MAIL_USERNAME = None
    MAIL_PASSWORD = None
    MAIL_DEFAULT_SENDER = "testing@dojopool.com"

    # Celery settings
    CELERY_BROKER_URL = "memory://"
    CELERY_RESULT_BACKEND = "cache"
    CELERY_CACHE_BACKEND = "memory"
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

    # Monitoring settings
    SENTRY_DSN = None
    PROMETHEUS_ENABLED = False

    # Cache settings
    CACHE_TYPE = "simple"
    CACHE_DEFAULT_TIMEOUT = 300

    # Security settings
    SESSION_COOKIE_SECURE = False
    REMEMBER_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"

    # Upload settings
    UPLOAD_FOLDER = "/tmp/dojopool-test-uploads"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

    # Game settings
    GAME_RECORDING_ENABLED = False
    AI_ANALYSIS_ENABLED = False
    MATCHMAKING_ENABLED = False

    # Feature flags
    FEATURES = {
        "tournaments": True,
        "achievements": True,
        "social": True,
        "analytics": False,
        "premium": False,
    }


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection: Any, connection_record: Any) -> None:
    """Enable foreign key support for SQLite."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
