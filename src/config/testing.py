"""Testing configuration."""

import os
from datetime import timedelta
from fakeredis import FakeRedis
from sqlalchemy.pool import StaticPool

class TestingConfig:
    """Testing configuration."""
    
    # Flask settings
    TESTING = True
    DEBUG = False
    WTF_CSRF_ENABLED = False
    
    # Database settings - Use in-memory SQLite by default
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # Configure SQLite for testing
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'check_same_thread': False,
            'timeout': 30
        },
        'poolclass': StaticPool,  # Use a single connection for all threads
        'pool_pre_ping': True,  # Check connection validity before using
        'pool_recycle': -1  # Disable connection recycling
    }
    
    # Security settings
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-jwt-secret'
    
    # API keys
    MAIL_DEFAULT_SENDER = 'test@example.com'
    SENDGRID_API_KEY = 'test-sendgrid-key'
    GOOGLE_CLIENT_ID = 'test-google-client-id'
    GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    OPENAI_API_KEY = 'test-openai-key'
    
    # Cache settings
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300
    
    # Redis settings
    REDIS_URL = None  # Will use FakeRedis for testing
    redis_client = FakeRedis()
    
    # Rate limiting settings
    RATELIMIT_ENABLED = False
    
    # Session settings
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = 3600
    
    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tests', 'uploads')
    
    @classmethod
    def init_app(cls, app):
        """Initialize the test configuration."""
        # Set SQLite to use WAL mode for better concurrency
        from sqlalchemy import event
        from sqlalchemy.engine import Engine
        from src.core.database import db
        
        @event.listens_for(Engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        
        # Initialize database tables
        with app.app_context():
            db.create_all()
    
    @classmethod
    def cleanup(cls):
        """Clean up test resources."""
        from flask import current_app
        from src.core.database import db
        
        if current_app:
            with current_app.app_context():
                try:
                    # Close all database connections
                    if hasattr(db, 'session'):
                        db.session.remove()
                    if hasattr(db, 'engine'):
                        db.engine.dispose()
                except:
                    pass  # Ignore errors during cleanup
                finally:
                    try:
                        # Drop all tables
                        db.drop_all()
                    except:
                        pass  # Ignore errors during cleanup
        
        # Clear Redis
        try:
            cls.redis_client.flushall()
        except:
            pass  # Ignore errors during cleanup