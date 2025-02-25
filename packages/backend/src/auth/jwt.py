"""
JWT Authentication Configuration for DojoPool
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication
from rest_framework import exceptions

User = get_user_model()

class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT Authentication class for DRF
    """
    def authenticate(self, request):
        """
        Authenticate the request and return a tuple of (user, token).
        """
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        try:
            # Get the token from header
            token = auth_header.split(' ')[1]
            # Decode the token
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=['HS256']
            )
            
            # Get user from payload
            user = User.objects.get(id=payload['user_id'])
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')

    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the WWW-Authenticate header.
        """
        return 'Bearer'

def generate_token(user: User) -> Dict[str, Any]:
    """
    Generate JWT tokens for a user
    
    Args:
        user (User): User instance
        
    Returns:
        dict: Access and refresh tokens with expiry times
    """
    access_token_expiry = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_LIFETIME)
    refresh_token_expiry = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_LIFETIME)
    
    access_token = jwt.encode(
        {
            'user_id': str(user.id),
            'exp': access_token_expiry,
            'type': 'access'
        },
        settings.JWT_SECRET_KEY,
        algorithm='HS256'
    )
    
    refresh_token = jwt.encode(
        {
            'user_id': str(user.id),
            'exp': refresh_token_expiry,
            'type': 'refresh'
        },
        settings.JWT_SECRET_KEY,
        algorithm='HS256'
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'access_token_expiry': access_token_expiry.timestamp(),
        'refresh_token_expiry': refresh_token_expiry.timestamp()
    }

def refresh_token(token: str) -> Dict[str, Any]:
    """
    Generate new access token using refresh token
    
    Args:
        token (str): Refresh token
        
    Returns:
        dict: New access token with expiry time
        
    Raises:
        exceptions.AuthenticationFailed: If token is invalid or expired
    """
    try:
        # Decode the refresh token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=['HS256']
        )
        
        # Verify it's a refresh token
        if payload.get('type') != 'refresh':
            raise exceptions.AuthenticationFailed('Invalid token type')
            
        # Get user and generate new access token
        user = User.objects.get(id=payload['user_id'])
        return generate_token(user)
        
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('Refresh token has expired')
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed('Invalid refresh token')
    except User.DoesNotExist:
        raise exceptions.AuthenticationFailed('User not found')
    except Exception as e:
        raise exceptions.AuthenticationFailed(f'Token refresh failed: {str(e)}') 