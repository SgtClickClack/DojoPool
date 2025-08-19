import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import jwt
from flask import current_app
from models.user import User

from src.models.device import Device
from utils.validation import validate_request_data


class MobileAuthService:
    def __init__(self):
        self.token_expiry = timedelta(days=30)  # Mobile tokens last longer
        self.refresh_token_expiry = timedelta(days=90)

    def authenticate(
        self, credentials: Dict[str, str], device_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Authenticate user and register device
        """
        # Validate credentials
        validation = validate_request_data(credentials, ["email", "password"])
        if validation.get("error"):
            return validation

        # Authenticate user
        user = User.authenticate(credentials["email"], credentials["password"])
        if not user:
            return {"error": "Invalid credentials"}

        # Register or update device
        device = self._register_device(user, device_info)
        if not device:
            return {"error": "Device registration failed"}

        # Generate tokens
        access_token = self._generate_access_token(user, device)
        refresh_token = self._generate_refresh_token(user, device)

        return {
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": int(self.token_expiry.total_seconds()),
        }

    def _register_device(self, user: User, device_info: Dict[str, Any]) -> Optional[Device]:
        """Register or update device for user"""
        device_id = device_info.get("device_id")
        if device_id:
            device = Device.query.filter_by(device_id=device_id, user_id=user.id).first()
            if device:
                device.update(device_info)
                return device

        device = Device(
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

    def _generate_access_token(self, user: User, device: Device) -> str:
        """Generate access token for user and device"""
        now = datetime.utcnow()
        payload = {
            "user_id": user.id,
            "device_id": device.device_id,
            "type": "access",
            "iat": now,
            "exp": now + self.token_expiry,
        }
        return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")

    def _generate_refresh_token(self, user: User, device: Device) -> str:
        """Generate refresh token for user and device"""
        now = datetime.utcnow()
        payload = {
            "user_id": user.id,
            "device_id": device.device_id,
            "type": "refresh",
            "iat": now,
            "exp": now + self.refresh_token_expiry,
        }
        return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")

    def refresh_tokens(self, refresh_token: str, device_info: Dict[str, Any]) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        try:
            payload = jwt.decode(
                refresh_token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )
            if payload["type"] != "refresh":
                return {"error": "Invalid token type"}

            user = User.query.get(payload["user_id"])
            if not user:
                return {"error": "User not found"}

            device = Device.query.filter_by(device_id=payload["device_id"], user_id=user.id).first()
            if not device:
                return {"error": "Device not found"}

            # Update device info if provided
            if device_info:
                device.update(device_info)

            # Generate new tokens
            access_token = self._generate_access_token(user, device)
            new_refresh_token = self._generate_refresh_token(user, device)

            return {
                "access_token": access_token,
                "refresh_token": new_refresh_token,
                "expires_in": int(self.token_expiry.total_seconds()),
            }

        except jwt.ExpiredSignatureError:
            return {"error": "Refresh token expired"}
        except jwt.InvalidTokenError:
            return {"error": "Invalid refresh token"}

    def revoke_device(self, user: User, device_id: str) -> bool:
        """Revoke device access"""
        device = Device.query.filter_by(device_id=device_id, user_id=user.id).first()
        if device:
            device.delete()
            return True
        return False
