"""Token management for DojoPool."""

import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging
from .utils import calculate_token_expiry, is_token_expired

logger = logging.getLogger(__name__)

class TokenManager:
    """Manages JWT tokens for authentication."""
    
    def __init__(self, secret_key: str, algorithm: str = 'HS256'):
        """Initialize TokenManager.
        
        Args:
            secret_key: Secret key for token signing
            algorithm: JWT algorithm to use
        """
        self.secret_key = secret_key
        self.algorithm = algorithm
        
    def generate_access_token(self, user_id: int, duration: timedelta = timedelta(hours=1)) -> str:
        """Generate access token.
        
        Args:
            user_id: User ID
            duration: Token duration
            
        Returns:
            JWT access token
        """
        expiry = calculate_token_expiry(duration)
        payload = {
            'user_id': user_id,
            'type': 'access',
            'exp': expiry
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        
    def generate_refresh_token(self, user_id: int, duration: timedelta = timedelta(days=7)) -> str:
        """Generate refresh token.
        
        Args:
            user_id: User ID
            duration: Token duration
            
        Returns:
            JWT refresh token
        """
        expiry = calculate_token_expiry(duration)
        payload = {
            'user_id': user_id,
            'type': 'refresh',
            'exp': expiry
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        
    def generate_reset_token(self, user_id: int, duration: timedelta = timedelta(hours=24)) -> str:
        """Generate password reset token.
        
        Args:
            user_id: User ID
            duration: Token duration
            
        Returns:
            JWT reset token
        """
        expiry = calculate_token_expiry(duration)
        payload = {
            'user_id': user_id,
            'type': 'reset',
            'exp': expiry
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        
    def generate_verification_token(self, user_id: int, email: str, duration: timedelta = timedelta(hours=24)) -> str:
        """Generate email verification token.
        
        Args:
            user_id: User ID
            email: Email to verify
            duration: Token duration
            
        Returns:
            JWT verification token
        """
        expiry = calculate_token_expiry(duration)
        payload = {
            'user_id': user_id,
            'email': email,
            'type': 'verification',
            'exp': expiry
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        
    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate token.
        
        Args:
            token: JWT token
            
        Returns:
            Token payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check expiry
            if is_token_expired(datetime.fromtimestamp(payload['exp'])):
                logger.warning('Token expired')
                return None
                
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning('Token expired')
            return None
            
        except jwt.InvalidTokenError as e:
            logger.warning(f'Invalid token: {str(e)}')
            return None
            
    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """Generate new access token from refresh token.
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New access token if refresh token valid, None otherwise
        """
        payload = self.decode_token(refresh_token)
        if not payload:
            return None
            
        if payload.get('type') != 'refresh':
            logger.warning('Invalid token type for refresh')
            return None
            
        return self.generate_access_token(payload['user_id'])
        
    def verify_token_type(self, token: str, expected_type: str) -> bool:
        """Verify token is of expected type.
        
        Args:
            token: JWT token
            expected_type: Expected token type
            
        Returns:
            True if token is valid and of expected type
        """
        payload = self.decode_token(token)
        if not payload:
            return False
            
        return payload.get('type') == expected_type
