"""JWT token management.

This module handles JWT token generation and validation.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Tuple
import jwt
from flask import current_app

class JWTManager:
    """JWT token manager."""
    
    def __init__(self):
        self.access_lifetime = timedelta(minutes=15)
        self.refresh_lifetime = timedelta(days=7)
        self.algorithm = 'HS256'
    
    def create_tokens(self, user_id: int, claims: Dict[str, Any] = None) -> Tuple[str, str]:
        """Create access and refresh tokens.
        
        Args:
            user_id: User ID
            claims: Additional claims
            
        Returns:
            (access_token, refresh_token)
        """
        now = datetime.utcnow()
        
        # Base claims
        base_claims = {
            'sub': user_id,
            'iat': now
        }
        
        if claims:
            base_claims.update(claims)
        
        # Access token
        access_claims = base_claims.copy()
        access_claims.update({
            'type': 'access',
            'exp': now + self.access_lifetime
        })
        
        # Refresh token
        refresh_claims = base_claims.copy()
        refresh_claims.update({
            'type': 'refresh',
            'exp': now + self.refresh_lifetime
        })
        
        return (
            self._encode(access_claims),
            self._encode(refresh_claims)
        )
    
    def verify_token(self, token: str, token_type: str) -> Dict[str, Any]:
        """Verify a token.
        
        Args:
            token: Token to verify
            token_type: Expected token type
            
        Returns:
            Token claims
            
        Raises:
            jwt.InvalidTokenError: If token is invalid
        """
        claims = self._decode(token)
        
        if claims.get('type') != token_type:
            raise jwt.InvalidTokenError('Invalid token type')
            
        return claims
    
    def _encode(self, claims: Dict[str, Any]) -> str:
        """Encode claims into a JWT.
        
        Args:
            claims: Claims to encode
            
        Returns:
            JWT string
        """
        return jwt.encode(
            claims,
            current_app.config['SECRET_KEY'],
            algorithm=self.algorithm
        )
    
    def _decode(self, token: str) -> Dict[str, Any]:
        """Decode and verify a JWT.
        
        Args:
            token: Token to decode
            
        Returns:
            Token claims
            
        Raises:
            jwt.InvalidTokenError: If token is invalid
        """
        return jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=[self.algorithm]
        )

# Global instance
jwt_manager = JWTManager() 