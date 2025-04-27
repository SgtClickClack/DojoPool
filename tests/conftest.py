import sys
import os
import pytest
from flask import Flask
import fakeredis

# Add the src directory to sys.path so that dojopool package is available
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import your Flask app instance here.
from dojopool.app import create_app # Use the actual factory
from dojopool.config.testing import TestingConfig # Import TestingConfig

@pytest.fixture(scope='session')
def app():
    """Session-wide test Flask application."""
    # Use the actual app factory and testing config
    app = create_app(config_name='testing') # Pass 'testing' or use TestingConfig directly

    # Ensure TestingConfig settings are applied (create_app should handle this if using get_config)
    # Alternatively, explicitly pass TestingConfig instance or dictionary:
    # app = create_app(test_config=TestingConfig().to_dict()) # Example if needed

    # Added: Use app context for setup/teardown if needed by TestingConfig.init_app/cleanup
    with app.app_context():
        # TestingConfig.init_app(app) # No longer needed explicitly if create_app calls it
        yield app
        TestingConfig.cleanup() # Call the cleanup method from TestingConfig


@pytest.fixture(scope='function')
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture(scope='function')
def redis_client():
    """Provides a mock Redis client using fakeredis."""
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