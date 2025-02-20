"""Session management for DojoPool."""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from .utils import calculate_token_expiry, generate_session_id, is_token_expired

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages user sessions."""

    def __init__(self, session_duration: timedelta = timedelta(hours=24)):
        """Initialize SessionManager.

        Args:
            session_duration: Default session duration
        """
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.session_duration = session_duration

    def create_session(
        self, user_id: int, device_info: Optional[Dict[str, str]] = None
    ) -> str:
        """Create new session.

        Args:
            user_id: User ID
            device_info: Optional device information

        Returns:
            Session ID
        """
        session_id = generate_session_id()
        expiry = calculate_token_expiry(self.session_duration)

        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "expires_at": expiry,
            "device_info": device_info or {},
            "is_active": True,
        }

        self.sessions[session_id] = session_data
        logger.info(f"Created session {session_id} for user {user_id}")

        return session_id

    def get_session(self, session_id: str):
        """Get session data.

        Args:
            session_id: Session ID

        Returns:
            Session data if valid, None otherwise
        """
        session = self.sessions.get(session_id)
        if not session:
            return None

        if not session["is_active"]:
            logger.warning(f"Session {session_id} is inactive")
            return None

        if is_token_expired(session["expires_at"]):
            logger.warning(f"Session {session_id} has expired")
            self.invalidate_session(session_id)
            return None

        return session

    def extend_session(self, session_id: str, duration: Optional[timedelta] = None):
        """Extend session duration.

        Args:
            session_id: Session ID
            duration: Optional new duration

        Returns:
            True if session extended successfully
        """
        session = self.get_session(session_id)
        if not session:
            return False

        new_expiry = calculate_token_expiry(duration or self.session_duration)
        session["expires_at"] = new_expiry

        logger.info(f"Extended session {session_id} to {new_expiry}")
        return True

    def invalidate_session(self, session_id: str):
        """Invalidate session.

        Args:
            session_id: Session ID

        Returns:
            True if session invalidated successfully
        """
        session = self.sessions.get(session_id)
        if not session:
            return False

        session["is_active"] = False
        logger.info(f"Invalidated session {session_id}")

        return True

    def get_user_sessions(self, user_id: int) -> Dict[str, Dict[str, Any]]:
        """Get all active sessions for user.

        Args:
            user_id: User ID

        Returns:
            Dictionary of session ID to session data
        """
        user_sessions = {}

        for session_id, session in self.sessions.items():
            if (
                session["user_id"] == user_id
                and session["is_active"]
                and not is_token_expired(session["expires_at"])
            ):
                user_sessions[session_id] = session

        return user_sessions

    def invalidate_user_sessions(self, user_id: int):
        """Invalidate all sessions for user.

        Args:
            user_id: User ID

        Returns:
            Number of sessions invalidated
        """
        count = 0

        for _session_id, session in self.sessions.items():
            if session["user_id"] == user_id and session["is_active"]:
                session["is_active"] = False
                count += 1

        if count > 0:
            logger.info(f"Invalidated {count} sessions for user {user_id}")

        return count

    def cleanup_expired_sessions(self) -> int:
        """Remove expired sessions.

        Returns:
            Number of sessions removed
        """
        count = 0
        expired_sessions = []

        for session_id, session in self.sessions.items():
            if is_token_expired(session["expires_at"]):
                expired_sessions.append(session_id)
                count += 1

        for session_id in expired_sessions:
            del self.sessions[session_id]

        if count > 0:
            logger.info(f"Removed {count} expired sessions")

        return count
