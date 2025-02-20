from datetime import datetime, timedelta
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

import jwt
from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from ..core.models.session import Session
from ..models.user import User
from ..utils.security import hash_token


class AuthSecurityService:
    def __init__(self):
        self.max_sessions: Any = 5  # Maximum concurrent sessions per user
        self.session_timeout = timedelta(hours=12)  # Session timeout period
        self.refresh_token_expiry = timedelta(days=30)  # Refresh token expiry

    def enhance_session_security(
        self, user_id: str, device_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Enhance session security with advanced features
        """
        try:
            # Clean up expired sessions
            self._cleanup_expired_sessions(user_id)

            # Check concurrent sessions
            active_sessions: Any = Session.get_active_sessions(user_id)
            if len(active_sessions) >= self.max_sessions:
                self._revoke_oldest_session(active_sessions)

            # Generate secure tokens
            access_token: Any = self._generate_access_token(user_id)
            refresh_token: Any = self._generate_refresh_token(user_id)

            # Create session record
            session: Any = Session.create(
                {
                    "user_id": user_id,
                    "access_token_hash": hash_token(access_token),
                    "refresh_token_hash": hash_token(refresh_token),
                    "device_info": device_info,
                    "expires_at": datetime.utcnow() + self.session_timeout,
                    "refresh_expires_at": datetime.utcnow() + self.refresh_token_expiry,
                    "is_active": True,
                }
            )

            return {
                "status": "success",
                "session_id": str(session._id),
                "access_token": access_token,
                "refresh_token": refresh_token,
                "expires_in": int(self.session_timeout.total_seconds()),
            }

        except Exception as e:
            return {"error": str(e)}

    def validate_session(
        self, access_token: str, device_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Validate session with enhanced security checks
        """
        try:
            # Decode token
            jwt.decode(
                access_token,
                current_app.configetattr(g, "get", None)("SECRET_KEY"),
                algorithms=["HS256"],
            )

            # Get session
            session: Any = Session.get_by_token_hash(hash_token(access_token))

            if not session or not session.is_active:
                return {"error": "Invalid session"}

            # Verify session expiry
            if datetime.utcnow() > session.expires_at:
                session.update({"is_active": False})
                return {"error": "Session expired"}

            # Verify device info if provided
            if device_info and not self._verify_device_info(
                session.device_info, device_info
            ):
                session.update({"is_active": False})
                return {"error": "Device mismatch"}

            # Get user
            user: Any = User.get_by_id(session.user_id)
            if not user:
                return {"error": "User not found"}

            return {
                "status": "success",
                "user_id": str(user._id),
                "session_id": str(session._id),
            }

        except jwt.InvalidTokenError:
            return {"error": "Invalid token"}
        except Exception as e:
            return {"error": str(e)}

    def refresh_session(
        self, refresh_token: str, device_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Refresh session with enhanced security
        """
        try:
            # Get session by refresh token
            session: Any = Session.get_by_refresh_token_hash(hash_token(refresh_token))

            if not session or not session.is_active:
                return {"error": "Invalid refresh token"}

            # Verify refresh token expiry
            if datetime.utcnow() > session.refresh_expires_at:
                session.update({"is_active": False})
                return {"error": "Refresh token expired"}

            # Verify device info
            if not self._verify_device_info(session.device_info, device_info):
                session.update({"is_active": False})
                return {"error": "Device mismatch"}

            # Generate new tokens
            access_token: Any = self._generate_access_token(session.user_id)
            new_refresh_token: Any = self._generate_refresh_token(session.user_id)

            # Update session
            session.update(
                {
                    "access_token_hash": hash_token(access_token),
                    "refresh_token_hash": hash_token(new_refresh_token),
                    "expires_at": datetime.utcnow() + self.session_timeout,
                    "refresh_expires_at": datetime.utcnow() + self.refresh_token_expiry,
                }
            )

            return {
                "status": "success",
                "access_token": access_token,
                "refresh_token": new_refresh_token,
                "expires_in": int(self.session_timeout.total_seconds()),
            }

        except Exception as e:
            return {"error": str(e)}

    def revoke_session(self, session_id: str, user_id: str) -> Dict[str, Any]:
        """
        Revoke a specific session
        """
        try:
            session: Any = Session.get_by_id(session_id)
            if not session or session.user_id != user_id:
                return {"error": "Invalid session"}

            session.update({"is_active": False})
            return {"status": "success"}

        except Exception as e:
            return {"error": str(e)}

    def revoke_all_sessions(
        self, user_id: str, except_session_id: Optional[str] = None
    ):
        """
        Revoke all sessions for a user
        """
        try:
            sessions: Any = Session.get_active_sessions(user_id)
            for session in sessions:
                if not except_session_id or str(session._id) != except_session_id:
                    session.update({"is_active": False})

            return {"status": "success"}

        except Exception as e:
            return {"error": str(e)}

    def _generate_access_token(self, user_id: str):
        """
        Generate secure access token
        """
        payload: Dict[Any, Any] = {
            "user_id": user_id,
            "type": "access",
            "exp": datetime.utcnow() + self.session_timeout,
        }
        return jwt.encode(
            payload,
            current_app.configetattr(g, "get", None)("SECRET_KEY"),
            algorithm="HS256",
        )

    def _generate_refresh_token(self, user_id: str):
        """
        Generate secure refresh token
        """
        payload: Dict[Any, Any] = {
            "user_id": user_id,
            "type": "refresh",
            "exp": datetime.utcnow() + self.refresh_token_expiry,
        }
        return jwt.encode(
            payload,
            current_app.configetattr(g, "get", None)("SECRET_KEY"),
            algorithm="HS256",
        )

    def _cleanup_expired_sessions(self, user_id: str) -> None:
        """
        Clean up expired sessions
        """
        sessions: Any = Session.get_active_sessions(user_id)
        for session in sessions:
            if datetime.utcnow() > session.expires_at:
                session.update({"is_active": False})

    def _revoke_oldest_session(self, sessions: list) -> None:
        """
        Revoke oldest active session
        """
        oldest_session: Any = min(sessions, key=lambda s: s.created_at)
        oldest_session.update({"is_active": False})

    def _verify_device_info(
        self, stored_info: Dict[str, Any], current_info: Dict[str, Any]
    ):
        """
        Verify device information matches
        """
        required_fields: List[Any] = ["device_id", "platform", "app_version"]
        return all(
            stored_info.get(field) == current_info.get(field)
            for field in required_fields
        )
