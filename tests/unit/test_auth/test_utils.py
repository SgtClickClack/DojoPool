"""Unit tests for authentication utilities."""
import pytest
from flask import url_for
from src.auth.utils import get_safe_redirect_url, verified_user_required

def test_get_safe_redirect_url_none(app, request_ctx):
    """Test safe redirect URL with None input."""
    with request_ctx:
        assert get_safe_redirect_url(None) == url_for('main.index')

def test_get_safe_redirect_url_empty(app, request_ctx):
    """Test safe redirect URL with empty input."""
    with request_ctx:
        assert get_safe_redirect_url('') == url_for('main.index')

def test_get_safe_redirect_url_external(app, request_ctx):
    """Test safe redirect URL with external URL."""
    with request_ctx:
        external_url = 'http://malicious.com'
        assert get_safe_redirect_url(external_url) == url_for('main.index')

def test_get_safe_redirect_url_valid(app, request_ctx):
    """Test safe redirect URL with valid internal URL."""
    with request_ctx:
        internal_url = url_for('auth.login')
        assert get_safe_redirect_url(internal_url) == internal_url

@pytest.mark.parametrize('endpoint', [
    'main.index',
    'auth.login',
    'auth.register'
])
def test_get_safe_redirect_url_endpoints(app, request_ctx, endpoint):
    """Test safe redirect URL with various endpoints."""
    with request_ctx:
        target = url_for(endpoint)
        assert get_safe_redirect_url(target) == target

def test_verified_user_required_verified(app, request_ctx, user):
    """Test verified_user_required with verified user."""
    with request_ctx:
        @verified_user_required
        def protected_route():
            return "Success"
        
        # Mock login
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = user.id
            
            response = protected_route()
            assert response == "Success"

def test_verified_user_required_unverified(app, request_ctx, unverified_user):
    """Test verified_user_required with unverified user."""
    with request_ctx:
        @verified_user_required
        def protected_route():
            return "Success"
        
        # Mock login
        with app.test_client() as client:
            with client.session_transaction() as session:
                session['user_id'] = unverified_user.id
            
            response = protected_route()
            assert response.status_code == 403

def test_verified_user_required_unauthenticated(app, request_ctx):
    """Test verified_user_required with no user."""
    with request_ctx:
        @verified_user_required
        def protected_route():
            return "Success"
        
        response = protected_route()
        assert response.status_code == 401 