import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from models.user import User
from services.token_service import TokenService
from src.models.device import Device
from utils.validation import validate_request_data
from werkzeug.wrappers import Response as WerkzeugResponse


class MobileAuthService:
    def __init__(self):
        self.token_service = TokenService()

    def authenticate(
        self, credentials: Dict[str, str], device_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Authenticate user and register device
        """
        # Validate credentials
        validation: validate_request_data = validate_request_data(
            credentials, ["email", "password"]
        )
        if validation.get("error"):
            return validation

        # Authenticate user
        user: Any = User.authenticate(credentials["email"], credentials["password"])
        if not user:
            return {"error": "Invalid credentials"}

        # Register or update device
        device: Any = self._register_device(user, device_info)
        if not device:
            return {"error": "Device registration failed"}

        # Generate tokens using token service
        access_token: Any = self.token_service.generate_access_token(
            user, device.device_id
        )
        refresh_token: Any = self.token_service.generate_refresh_token(
            user, device.device_id
        )

        return {
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": int(self.token_service.ACCESS_TOKEN_EXPIRY.total_seconds()),
        }

    def _register_device(self, user: User, device_info: Dict[str, Any]):
        """Register or update device for user"""
        device_id = device_info.get("device_id")
        if device_id:
            device: Any = Device.query.filter_by(
                device_id=device_id, user_id=user.id
            ).first()
            if device:
                device.update(device_info)
                return device

        device: Any = Device(
            user_id=user.id,
            device_id=device_info.get("device_id") or secrets.token_hex(16),
            device_type=device_info.get("device_type", "unknown"),
            device_name=device_info.get("device_name", "Unknown Device"),
            os_version=device_info.get("os_version"),
            app_version=device_info.get("app_version"),
            push_token=device_info.get("push_token"),
        )
        device.save()
        return device

    def refresh_tokens(self, refresh_token: str, device_info: Dict[str, Any]):
        """Refresh access token using refresh token"""
        # Use token service to refresh tokens
        tokens: Any = self.token_service.refresh_tokens(refresh_token)
        if not tokens:
            return {"error": "Invalid or expired refresh token"}

        # Update device info if provided
        payload: Any = self.token_service.verify_token(refresh_token, "refresh")
        if payload and device_info:
            device: Any = Device.query.filter_by(
                device_id=payload.get("did"), user_id=payload.get("uid")
            ).first()
            if device:
                device.update(device_info)

        return tokens

    def revoke_device(self, user: User, device_id: str):
        """Revoke device access"""
        device: Any = Device.query.filter_by(
            device_id=device_id, user_id=user.id
        ).first()
        if device:
            device.delete()
            return True
        return False
