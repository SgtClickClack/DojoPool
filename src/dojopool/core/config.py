"""Application configuration.

This module contains the configuration classes for different environments.
"""
from typing import Dict, Any
import os
from pathlib import Path

class BaseConfig:
    """Base configuration."""
    
    # Application
    PROJECT_ROOT = Path(__file__).parent.parent.parent
    APP_DIR = PROJECT_ROOT / 'src'
    
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-please-change')
    CSRF_ENABLED = True
    
    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///dojopool.db')
    
    # OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
    
    # Cache
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300
    
    # Mail
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "100/hour"
    RATELIMIT_STORAGE_URL = "memory://"

class DevelopmentConfig(BaseConfig):
    """Development configuration."""
    
    DEBUG = True
    TESTING = False
    
    # Development-specific settings
    SQLALCHEMY_ECHO = True
    TEMPLATES_AUTO_RELOAD = True
    
    # Development mail settings
    MAIL_SUPPRESS_SEND = True

class TestingConfig(BaseConfig):
    """Testing configuration."""
    
    DEBUG = False
    TESTING = True
    
    # Use in-memory SQLite for tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable CSRF tokens in testing
    WTF_CSRF_ENABLED = False
    
    # Test mail settings
    MAIL_SUPPRESS_SEND = True

class ProductionConfig(BaseConfig):
    """Production configuration."""
    
    DEBUG = False
    TESTING = False
    
    # Production security settings
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    
    # Production cache settings
    CACHE_TYPE = 'redis'
    
    # Production rate limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL')

# Configuration dictionary
config: Dict[str, Any] = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}