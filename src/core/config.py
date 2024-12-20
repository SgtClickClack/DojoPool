"""Application configuration.

This module provides configuration classes for different environments.
"""

import os
from datetime import timedelta

class Config:
    """Base configuration."""
    
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev'
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    DEBUG = False
    TESTING = False
    
    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True
    }
    
    # Session/Cookie
    SESSION_COOKIE_NAME = 'session'
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # CSRF
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600
    
    # Mail
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', True)
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    
    # Auth
    LOGIN_DISABLED = False
    LOGIN_MESSAGE = 'Please log in to access this page.'
    LOGIN_MESSAGE_CATEGORY = 'info'
    
    # Password policy
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_MAX_LENGTH = 128
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_NUMBERS = True
    PASSWORD_REQUIRE_SPECIAL = True
    
    # 2FA
    TOTP_ISSUER = 'DojoPool'
    
    # Rate limiting
    RATELIMIT_DEFAULT = "100/hour"
    RATELIMIT_STORAGE_URL = "memory://"
    
    # Cache
    CACHE_TYPE = "simple"
    CACHE_DEFAULT_TIMEOUT = 300

class DevelopmentConfig(Config):
    """Development configuration."""
    
    DEBUG = True
    TESTING = False
    
    # Security
    SESSION_COOKIE_SECURE = False
    WTF_CSRF_ENABLED = True
    
    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'
    
    # Mail
    MAIL_DEBUG = True

class TestingConfig(Config):
    """Testing configuration."""
    
    DEBUG = False
    TESTING = True
    
    # Security
    WTF_CSRF_ENABLED = False
    LOGIN_DISABLED = True
    
    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Mail
    MAIL_SUPPRESS_SEND = True

class ProductionConfig(Config):
    """Production configuration."""
    
    DEBUG = False
    TESTING = False
    
    # Security
    SESSION_COOKIE_SECURE = True
    WTF_CSRF_ENABLED = True
    
    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    # Mail
    MAIL_DEBUG = False
    
    # Cache
    CACHE_TYPE = "redis"
    CACHE_REDIS_URL = os.environ.get('REDIS_URL') 