"""Development configuration."""

from .config import Config
import os


class DevelopmentConfig(Config):
    """Development environment configuration."""

    DEBUG = True
    ENV = "development"

    # Development database
    # Construct an absolute path to the database file
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
    DB_NAME = "dojopool_dev.db"
    INSTANCE_FOLDER_PATH = os.path.join(PROJECT_ROOT, "src", "instance")
    
    # Ensure instance folder exists
    if not os.path.exists(INSTANCE_FOLDER_PATH):
        os.makedirs(INSTANCE_FOLDER_PATH)
        
    ABSOLUTE_DB_PATH = os.path.join(INSTANCE_FOLDER_PATH, DB_NAME)
    
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DEV_DATABASE_URL", f"sqlite:///{ABSOLUTE_DB_PATH.replace(os.sep, '/')}"
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
