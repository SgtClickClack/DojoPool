"""Tests for rate limiting system."""

from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from flask import Flask, jsonify

from dojopool.core.venue.rate_limit import RateLimiter, rate_limit


@pytest.fixture
def rate_limiter():
    """Create a test instance of RateLimiter."""
    limiter = RateLimiter()
    # Stop the cleanup thread for testing
    limiter._stop_cleanup = True
    limiter._cleanup_thread.join()
    return limiter


@pytest.fixture
def app():
    """Create a test Flask application."""
    app = Flask(__name__)

    @app.route("/test")
    @rate_limit()
    def test_route():
        return jsonify({"success": True})

    @app.route("/test_custom")
    @rate_limit("custom")
    def test_custom_route():
        return jsonify({"success": True})

    return app


def test_basic_rate_limit(rate_limiter):
    """Test basic rate limiting functionality."""
    # Configure a test limit
    rate_limiter.configure_limit("test", 2, 60)  # 2 requests per minute

    # First request should be allowed
    allowed, error, retry = rate_limiter.check_limit("test_key", "test")
    assert allowed is True
    assert error is None
    assert retry is None

    # Second request should be allowed
    allowed, error, retry = rate_limiter.check_limit("test_key", "test")
    assert allowed is True
    assert error is None
    assert retry is None

    # Third request should be blocked
    allowed, error, retry = rate_limiter.check_limit("test_key", "test")
    assert allowed is False
    assert error == "Rate limit exceeded"
    assert retry is not None


def test_window_reset(rate_limiter):
    """Test rate limit window reset."""
    rate_limiter.configure_limit("test", 1, 60)  # 1 request per minute

    # First request
    allowed, _, _ = rate_limiter.check_limit("test_key", "test")
    assert allowed is True

    # Second request should be blocked
    allowed, _, _ = rate_limiter.check_limit("test_key", "test")
    assert allowed is False

    # Simulate window expiration
    with patch("datetime.datetime") as mock_datetime:
        mock_datetime.utcnow.return_value = datetime.utcnow() + timedelta(minutes=1)

        # Request after window reset should be allowed
        allowed, _, _ = rate_limiter.check_limit("test_key", "test")
        assert allowed is True


def test_blocking_duration(rate_limiter):
    """Test blocking duration functionality."""
    rate_limiter.configure_limit("test", 1, 60, block_duration=300)  # 1 request/min, 5 min block

    # First request
    allowed, _, _ = rate_limiter.check_limit("test_key", "test")
    assert allowed is True

    # Second request triggers block
    allowed, error, retry = rate_limiter.check_limit("test_key", "test")
    assert allowed is False
    assert error == "Rate limit exceeded"
    assert retry == 300  # 5 minutes

    # Request during block should be rejected
    with patch("datetime.datetime") as mock_datetime:
        mock_datetime.utcnow.return_value = datetime.utcnow() + timedelta(minutes=2)
        allowed, error, retry = rate_limiter.check_limit("test_key", "test")
        assert allowed is False
        assert "Too many requests" in error
        assert retry is not None


def test_multiple_keys(rate_limiter):
    """Test rate limiting with multiple keys."""
    rate_limiter.configure_limit("test", 1, 60)

    # First key
    allowed, _, _ = rate_limiter.check_limit("key1", "test")
    assert allowed is True
    allowed, _, _ = rate_limiter.check_limit("key1", "test")
    assert allowed is False

    # Second key should be independent
    allowed, _, _ = rate_limiter.check_limit("key2", "test")
    assert allowed is True


def test_default_limit(rate_limiter):
    """Test default rate limit."""
    # Default limit should be used when type not specified
    allowed, _, _ = rate_limiter.check_limit("test_key")
    assert allowed is True

    # Verify default limit configuration
    assert rate_limiter.default_limits["default"].requests == 100
    assert rate_limiter.default_limits["default"].window == 60


def test_cleanup_expired(rate_limiter):
    """Test cleanup of expired rate limits."""
    rate_limiter.configure_limit("test", 1, 60)

    # Create some limits
    rate_limiter.check_limit("key1", "test")
    rate_limiter.check_limit("key2", "test")

    assert len(rate_limiter._limits["test"]) == 2

    # Simulate time passing
    with patch("datetime.datetime") as mock_datetime:
        mock_datetime.utcnow.return_value = datetime.utcnow() + timedelta(minutes=2)
        rate_limiter._cleanup_expired()

        # Limits should be cleaned up
        assert "test" not in rate_limiter._limits or len(rate_limiter._limits["test"]) == 0


def test_route_decorator(app, client):
    """Test rate limit decorator on routes."""
    # First request should succeed
    response = client.get("/test")
    assert response.status_code == 200

    # Make many requests to exceed limit
    for _ in range(100):
        client.get("/test")

    # Next request should be rate limited
    response = client.get("/test")
    assert response.status_code == 429
    assert "Retry-After" in response.headers


def test_custom_limit_route(app, client):
    """Test route with custom rate limit."""
    # Configure custom limit
    app.rate_limiter.configure_limit("custom", 2, 60)

    # First two requests should succeed
    response = client.get("/test_custom")
    assert response.status_code == 200
    response = client.get("/test_custom")
    assert response.status_code == 200

    # Third request should be rate limited
    response = client.get("/test_custom")
    assert response.status_code == 429


def test_ip_based_limiting(app, client):
    """Test IP-based rate limiting."""
    # Configure test limit
    app.rate_limiter.configure_limit("test", 1, 60)

    # First request from IP1
    response = client.get("/test", environ_base={"REMOTE_ADDR": "1.1.1.1"})
    assert response.status_code == 200

    # Second request from IP1 should be limited
    response = client.get("/test", environ_base={"REMOTE_ADDR": "1.1.1.1"})
    assert response.status_code == 429

    # Request from IP2 should succeed
    response = client.get("/test", environ_base={"REMOTE_ADDR": "2.2.2.2"})
    assert response.status_code == 200


def test_limit_configuration_validation(rate_limiter):
    """Test validation of rate limit configuration."""
    # Valid configuration
    rate_limiter.configure_limit("test", 10, 60)
    assert rate_limiter.default_limits["test"].requests == 10
    assert rate_limiter.default_limits["test"].window == 60

    # Update existing configuration
    rate_limiter.configure_limit("test", 20, 120, 300)
    assert rate_limiter.default_limits["test"].requests == 20
    assert rate_limiter.default_limits["test"].window == 120
    assert rate_limiter.default_limits["test"].block_duration == 300


def test_concurrent_requests(rate_limiter):
    """Test rate limiting with concurrent requests."""
    rate_limiter.configure_limit("test", 3, 60)

    # Simulate concurrent requests
    results = []
    for _ in range(5):
        allowed, error, _ = rate_limiter.check_limit("test_key", "test")
        results.append(allowed)

    # First 3 should be allowed, last 2 blocked
    assert results.count(True) == 3
    assert results.count(False) == 2
