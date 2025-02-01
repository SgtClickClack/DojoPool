"""Default configuration."""

import os


class Config:
    """Base configuration."""

    # Flask settings
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-in-production")
    DEBUG = False
    TESTING = False

    # Database settings
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///dojopool.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Security settings
    WTF_CSRF_ENABLED = True

    # API keys
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

    @classmethod
    def init_app(cls, app):
        """Initialize application configuration."""
        # Create upload directory if it doesn't exist
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
