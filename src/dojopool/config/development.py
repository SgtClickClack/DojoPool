"""Development configuration."""

import os

from .default import Config


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    DEVELOPMENT = True
    SQLALCHEMY_DATABASE_URI = (
        "postgresql://postgres:postgres@localhost:5432/dojopool_dev"
    )

    # Disable CSRF in development for easier testing
    WTF_CSRF_ENABLED = False

    # Development Firebase configuration
    FIREBASE_CREDENTIALS_PATH = os.path.join(
        os.path.dirname(__file__), "..", "..", "firebase-credentials.json"
    )

    # Development cache configuration
    CACHE_TYPE = "simple"  # Use simple cache in development
