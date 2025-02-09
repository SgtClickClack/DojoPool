"""Token management service with enhanced security.

This module provides secure token management with key rotation and separate keys for different token types.
"""

import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

import jwt
from flask import current_app
from models.user import User

class TokenService:
    """Service for secure token management with key rotation."""
    
    # Token expiration times
    ACCESS_TOKEN_EXPIRY = timedelta(minutes=15)  # Shorter lived access tokens
    REFRESH_TOKEN_EXPIRY = timedelta(days=7)     # 7 days for refresh tokens
    
    # Key rotation intervals
    KEY_ROTATION_INTERVAL = timedelta(days=1)  # Rotate keys daily
    
    def __init__(self):
        """Initialize the token service."""
        self._access_keys: Dict[str, Tuple[str, datetime]] = {}
        self._refresh_keys: Dict[str, Tuple[str, datetime]] = {}
        self._rotate_keys()
    
    def _rotate_keys(self) -> None:
        """Rotate encryption keys and clean up old ones."""
        now = datetime.utcnow()
        
        # Generate new keys
        new_access_key = secrets.token_hex(32)
        new_refresh_key = secrets.token_hex(32)
        
        # Add new keys
        key_id = secrets.token_hex(8)
        self._access_keys[key_id] = (new_access_key, now)
        self._refresh_keys[key_id] = (new_refresh_key, now)
        
        # Remove old keys (keep last 2 for validation)
        self._clean_old_keys(self._access_keys)
        self._clean_old_keys(self._refresh_keys)
    
    def _clean_old_keys(self, keys: Dict[str, Tuple[str, datetime]]) -> None:
        """Remove old keys, keeping only the 2 most recent."""
        if len(keys) <= 2:
            return
            
        sorted_keys = sorted(keys.items(), key=lambda x: x[1][1], reverse=True)
        for key_id, _ in sorted_keys[2:]:
            keys.pop(key_id)
    
    def _get_current_key(self, keys: Dict[str, Tuple[str, datetime]]) -> Tuple[str, str]:
        """Get the current key and its ID."""
        now = datetime.utcnow()
        
        # Check if we need to rotate keys
        if not keys or (now - list(keys.values())[0][1]) > self.KEY_ROTATION_INTERVAL:
            self._rotate_keys()
        
        # Get most recent key
        key_id = max(keys.keys(), key=lambda k: keys[k][1])
        return key_id, keys[key_id][0]
    
    def generate_access_token(self, user: User, device_id: Optional[str] = None) -> str:
        """Generate a short-lived access token."""
        now = datetime.utcnow()
        key_id, key = self._get_current_key(self._access_keys)
        
        payload = {
            "typ": "access",
            "uid": user.id,
            "kid": key_id,
            "did": device_id,
            "iat": now,
            "exp": now + self.ACCESS_TOKEN_EXPIRY
        }
        
        return jwt.encode(payload, key, algorithm="HS256")
    
    def generate_refresh_token(self, user: User, device_id: Optional[str] = None) -> str:
        """Generate a longer-lived refresh token."""
        now = datetime.utcnow()
        key_id, key = self._get_current_key(self._refresh_keys)
        
        payload = {
            "typ": "refresh",
            "uid": user.id,
            "kid": key_id,
            "did": device_id,
            "iat": now,
            "exp": now + self.REFRESH_TOKEN_EXPIRY
        }
        
        return jwt.encode(payload, key, algorithm="HS256")
    
    def verify_token(self, token: str, token_type: str = "access") -> Optional[dict]:
        """Verify a token and return its payload if valid."""
        try:
            # Decode without verification to get key ID
            unverified = jwt.decode(token, options={"verify_signature": False})
            key_id = unverified.get("kid")
            token_keys = self._access_keys if token_type == "access" else self._refresh_keys
            
            if not key_id or key_id not in token_keys:
                return None
                
            # Verify token with correct key
            key = token_keys[key_id][0]
            payload = jwt.decode(token, key, algorithms=["HS256"])
            
            # Verify token type
            if payload.get("typ") != token_type:
                return None
                
            return payload
            
        except jwt.InvalidTokenError:
            return None
    
    def refresh_tokens(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """Generate new access and refresh tokens using a valid refresh token."""
        payload = self.verify_token(refresh_token, "refresh")
        if not payload:
            return None
            
        user = User.query.get(payload["uid"])
        if not user:
            return None
            
        return {
            "access_token": self.generate_access_token(user, payload.get("did")),
            "refresh_token": self.generate_refresh_token(user, payload.get("did")),
            "expires_in": int(self.ACCESS_TOKEN_EXPIRY.total_seconds())
        } 