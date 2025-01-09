"""Session management module."""
import time
import secrets
from typing import Dict, Optional
from datetime import datetime, timedelta
import redis
from flask import current_app

class SessionManager:
    """Session management class."""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize session manager.
        
        Args:
            redis_client: Optional Redis client for session storage
        """
        self.redis = redis_client
        self.sessions: Dict[str, Dict] = {}
        
    def create_session(self, user_id: int, remember: bool = False) -> str:
        """Create a new session.
        
        Args:
            user_id: User ID
            remember: Whether to create a long-lived session
            
        Returns:
            str: Session token
        """
        token = secrets.token_urlsafe(32)
        expires = time.time() + (30 * 24 * 3600 if remember else 24 * 3600)
        
        session_data = {
            'user_id': user_id,
            'expires': expires,
            'created_at': time.time()
        }
        
        if self.redis:
            try:
                self.redis.setex(
                    f"session:{token}",
                    int(expires - time.time()),
                    str(session_data)
                )
            except redis.RedisError:
                # Fall back to in-memory storage
                self.sessions[token] = session_data
        else:
            self.sessions[token] = session_data
            
        return token
        
    def validate_session(self, token: str) -> Optional[Dict]:
        """Validate a session token.
        
        Args:
            token: Session token
            
        Returns:
            Optional[Dict]: Session data if valid, None otherwise
        """
        if not token:
            return None
            
        if self.redis:
            try:
                session_data = self.redis.get(f"session:{token}")
                if not session_data:
                    return None
                    
                session_data = eval(session_data)  # Safe since we control the data
                if time.time() > session_data['expires']:
                    self.delete_session(token)
                    return None
                    
                return session_data
            except redis.RedisError:
                # Fall back to in-memory storage
                session_data = self.sessions.get(token)
        else:
            session_data = self.sessions.get(token)
            
        if not session_data:
            return None
            
        if time.time() > session_data['expires']:
            self.delete_session(token)
            return None
            
        return session_data
        
    def delete_session(self, token: str) -> None:
        """Delete a session.
        
        Args:
            token: Session token
        """
        if self.redis:
            try:
                self.redis.delete(f"session:{token}")
            except redis.RedisError:
                pass
                
        if token in self.sessions:
            del self.sessions[token]
            
    def generate_reset_token(self, user_id: int, expires_in: int = 3600) -> str:
        """Generate a password reset token.
        
        Args:
            user_id: User ID
            expires_in: Token expiry time in seconds
            
        Returns:
            str: Reset token
        """
        token = secrets.token_urlsafe(32)
        expires = time.time() + expires_in
        
        token_data = {
            'user_id': user_id,
            'expires': expires,
            'type': 'reset'
        }
        
        if self.redis:
            try:
                self.redis.setex(
                    f"reset:{token}",
                    expires_in,
                    str(token_data)
                )
            except redis.RedisError:
                # Fall back to in-memory storage
                self.sessions[f"reset:{token}"] = token_data
        else:
            self.sessions[f"reset:{token}"] = token_data
            
        return token
        
    def verify_reset_token(self, token: str) -> Optional[int]:
        """Verify a password reset token.
        
        Args:
            token: Reset token
            
        Returns:
            Optional[int]: User ID if valid, None otherwise
        """
        if not token:
            return None
            
        if self.redis:
            try:
                token_data = self.redis.get(f"reset:{token}")
                if not token_data:
                    return None
                    
                token_data = eval(token_data)  # Safe since we control the data
                if time.time() > token_data['expires']:
                    self.redis.delete(f"reset:{token}")
                    return None
                    
                return token_data['user_id']
            except redis.RedisError:
                # Fall back to in-memory storage
                token_data = self.sessions.get(f"reset:{token}")
        else:
            token_data = self.sessions.get(f"reset:{token}")
            
        if not token_data:
            return None
            
        if time.time() > token_data['expires']:
            if f"reset:{token}" in self.sessions:
                del self.sessions[f"reset:{token}"]
            return None
            
        return token_data['user_id'] 