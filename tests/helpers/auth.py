"""Authentication helpers for tests."""

from typing import Dict
from src.core.models import User

def login_user_and_get_token(client, user: User) -> str:
    """Log in a user and get their authentication token.
    
    Args:
        client: Flask test client
        user: User to log in
    
    Returns:
        str: Authentication token
    """
    response = client.post('/api/v1/auth/login', json={
        'email': user.email,
        'password': 'password123'  # Default test password from UserFactory
    })
    return response.json['token']

def get_auth_headers(token: str) -> Dict[str, str]:
    """Get headers for authenticated requests.
    
    Args:
        token: Authentication token
    
    Returns:
        Dict[str, str]: Headers with authentication token
    """
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    } 