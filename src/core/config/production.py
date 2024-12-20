"""Production configuration."""

import os
import logging
from logging.handlers import RotatingFileHandler
from .config import Config

class ProductionConfig(Config):
    """Production environment configuration."""
    
    ENV = 'production'
    DEBUG = False
    
    # Production database - must be set via DATABASE_URL env var
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    
    # Production security settings
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    WTF_CSRF_SSL_STRICT = True
    
    # Production cache settings
    CACHE_TYPE = os.getenv('CACHE_TYPE', 'redis')
    CACHE_REDIS_URL = os.getenv('REDIS_URL')
    
    # Production rate limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL')
    
    # Production logging - rotate files
    LOG_FILE = '/var/log/dojopool/production.log'
    LOG_MAX_SIZE = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 5
    
    @classmethod
    def init_app(cls, app):
        """Production-specific initialization."""
        super().init_app(app)
        
        # Configure rotating file handler
        if not os.path.exists(os.path.dirname(cls.LOG_FILE)):
            os.makedirs(os.path.dirname(cls.LOG_FILE))
            
        file_handler = RotatingFileHandler(
            cls.LOG_FILE,
            maxBytes=cls.LOG_MAX_SIZE,
            backupCount=cls.LOG_BACKUP_COUNT
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(logging.Formatter(cls.LOG_FORMAT))
        app.logger.addHandler(file_handler)
        
        # Configure stderr logging
        stderr_handler = logging.StreamHandler()
        stderr_handler.setLevel(logging.INFO)
        stderr_handler.setFormatter(logging.Formatter(cls.LOG_FORMAT))
        app.logger.addHandler(stderr_handler)
        
        # Configure proxy headers if behind reverse proxy
        from werkzeug.middleware.proxy_fix import ProxyFix
        app.wsgi_app = ProxyFix(
            app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
        ) 