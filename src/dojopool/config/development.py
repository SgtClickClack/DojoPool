"""Development configuration."""

import os
from pathlib import Path

from dojopool.config import BaseConfig


class DevelopmentConfig(BaseConfig):
    """Development configuration."""

    DEBUG = True
    TESTING = False

    # Database
    SQLALCHEMY_DATABASE_URI = "sqlite:///dojopool.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security
    SECRET_KEY = "dev-key-please-change-in-production"
    WTF_CSRF_ENABLED = True

    # Redis
    REDIS_URL = "redis://localhost:6379/0"

    # CORS
    CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3100", "http://localhost:3101"]

    # Session
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development

    # JWT
    JWT_SECRET_KEY = "jwt-dev-key-please-change-in-production"

    @classmethod
    def init_app(cls, app):
        """Initialize application with development settings."""
        BaseConfig.init_app(app)

        # Create instance folder if it doesn't exist
        instance_path = Path(app.instance_path)
        instance_path.mkdir(parents=True, exist_ok=True)

        # Create database file if it doesn't exist
        db_path = Path("dojopool.db")
        if not db_path.exists():
            db_path.touch()
