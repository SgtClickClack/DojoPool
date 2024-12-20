"""Development configuration."""
from src.config.default import Config

class DevelopmentConfig(Config):
    """Development configuration."""
    
    DEBUG = True
    DEVELOPMENT = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dojopool_dev.db'
    
    # Disable CSRF in development for easier testing
    WTF_CSRF_ENABLED = False