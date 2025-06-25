import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
import pytest
from flask import Flask

# Try to import fakeredis, but make it optional
try:
    import fakeredis
    FAKEREDIS_AVAILABLE = True
except ImportError:
    FAKEREDIS_AVAILABLE = False

# Import your Flask app instance here.
try:
    from dojopool import create_app  # Changed: Import directly from dojopool package
    from dojopool.config.testing import TestingConfig  # Import TestingConfig
    FLASK_APP_AVAILABLE = True
except ImportError:
    FLASK_APP_AVAILABLE = False

@pytest.fixture(scope='session')
def app():
    """Session-wide test Flask application."""
    if not FLASK_APP_AVAILABLE:
        pytest.skip("Flask app not available")
    
    # Use the actual app factory and testing config
    app = create_app(config_name='testing') # Pass 'testing' or use TestingConfig directly

    # Ensure TestingConfig settings are applied (create_app should handle this if using get_config)
    # Alternatively, explicitly pass TestingConfig instance or dictionary:
    # app = create_app(test_config=TestingConfig().to_dict()) # Example if needed

    # Added: Use app context for setup/teardown if needed by TestingConfig.init_app/cleanup
    with app.app_context():
        from dojopool.core.extensions import db
        db.create_all()  # Create all tables before tests
        yield app
        db.drop_all()  # Drop all tables after tests
        TestingConfig.cleanup() # Call the cleanup method from TestingConfig


@pytest.fixture(scope='function')
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture(scope='function')
def redis_client():
    """Provides a mock Redis client using fakeredis."""
    if not FAKEREDIS_AVAILABLE:
        pytest.skip("fakeredis not available")
    
    # Use FakeStrictRedis for compatibility with redis-py's StrictRedis
    # Add decode_responses=True if your application code expects decoded strings
    fake_redis = fakeredis.FakeStrictRedis(decode_responses=True)
    yield fake_redis
    # Clear the fake redis database after each test function
    fake_redis.flushall()

# You might need to patch the Redis connection used by your app
# Example using monkeypatch in your specific test file:
# def test_some_feature(client, redis_client, monkeypatch):
#     # Adjust 'dojopool.module.where.redis.is.used.redis_instance' to the actual path
#     monkeypatch.setattr('dojopool.module.where.redis.is.used.redis_instance', redis_client)
#     # ... rest of your test ...
# OR patch the function that returns the client:
#     monkeypatch.setattr('dojopool.core.utils.redis.get_redis_client', lambda: redis_client)
#     # ... rest of your test ... 