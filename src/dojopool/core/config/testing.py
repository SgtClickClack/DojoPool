"""Testing configuration."""

from .config import Config

class TestingConfig(Config):
    """Testing environment configuration."""
    
    TESTING = True
    DEBUG = True
    ENV = 'testing'
    
    # Use in-memory SQLite database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable CSRF protection in testing
    WTF_CSRF_ENABLED = False
    
    # Test-specific logging
    LOG_LEVEL = 'DEBUG'
    LOG_FILE = None  # Don't write logs to file in testing
    
    # Disable rate limiting in tests
    RATELIMIT_ENABLED = False
    
    # Test-specific cache settings
    CACHE_TYPE = 'simple'
    CACHE_NO_NULL_WARNING = True
    
    # Test mail settings
    MAIL_SUPPRESS_SEND = True
    
    # Test-specific game settings
    COIN_SPAWN_INTERVAL = 1  # Fast spawning for tests
    MAX_PLAYERS_PER_GAME = 2  # Smaller games for faster tests
    
    # Disable OAuth in testing
    OAUTH_PROVIDERS = {} 