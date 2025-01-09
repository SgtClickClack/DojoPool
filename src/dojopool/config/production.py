"""Production configuration for DojoPool."""

from datetime import timedelta
import logging
from logging.handlers import SysLogHandler
from .default import Config

class ProductionConfig(Config):
    """Production configuration."""
    
    DEBUG = False
    TESTING = False
    OAUTHLIB_INSECURE_TRANSPORT = '0'  # Require HTTPS for OAuth in production
    CACHE_TYPE = 'redis'  # Use Redis cache in production
    SESSION_COOKIE_SECURE = True  # Require HTTPS for cookies
    WTF_CSRF_ENABLED = True  # Enable CSRF protection
    
    # Production-specific security settings
    PERMANENT_SESSION_LIFETIME = timedelta(hours=1)  # Shorter session lifetime
    WTF_CSRF_TIME_LIMIT = 1800  # 30 minutes
    RATELIMIT_DEFAULT = "60 per minute"  # Stricter rate limiting
    
    @classmethod
    def init_app(cls, app):
        """Production-specific initialization."""
        # Log to syslog
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.WARNING)
        app.logger.addHandler(syslog_handler) 