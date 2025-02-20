from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from src.models.device import Device
from src.models.notification_settings import NotificationSettings
from src.services.push_notification_service import PushNotificationService
from src.utils.auth import get_current_user, login_required
from werkzeug.wrappers import Response as WerkzeugResponse

notifications_bp: Blueprint = Blueprint("notifications", __name__)
notification_service: PushNotificationService = PushNotificationService()


@notifications_bp.route("/register", methods=["POST"])
@login_required
def register_device() -> Response :
    """Register a device for push notifications."""
    try:
        data: Any = request.get_json()
        validate_request_data(data, ["device_token", "platform"])

        user: get_current_user: get_current_user: get_current_user: get_current_user: get_current_user = get_current_user()
        device: Device = Device(
            user_id=user.id,
            token=data["device_token"],
            platform=data["platform"],
            app_version=data.get("app_version"),
            os_version=data.get("os_version"),
        )

        db.session.add(device)
        db.session.commit()

        return jsonify(
            {"status": "success", "message": "Device registered successfully"}
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "error": str(e)}), 400


@notifications_bp.route("/settings", methods=["GET"])
@login_required
def get_notification_settings():
    """Get user's notification settings."""
    try:
        user: get_current_user: get_current_user: get_current_user: get_current_user: get_current_user = get_current_user()
        settings: Any = NotificationSettings.query.filter_by(user_id=user.id).first()

        if not settings:
            settings: Any = NotificationSettings(user_id=user.id)
            db.session.add(settings)
            db.session.commit()

        return jsonify(settings.to_dict())
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 400


@notifications_bp.route("/settings", methods=["PUT"])
@login_required
def update_notification_settings():
    """Update user's notification settings."""
    try:
        data: Any = request.get_json()
        user: get_current_user: get_current_user: get_current_user: get_current_user: get_current_user = get_current_user()
        settings: Any = NotificationSettings.query.filter_by(user_id=user.id).first()

        if not settings:
            settings: Any = NotificationSettings(user_id=user.id)
            db.session.add(settings)

        # Update settings
        for field in [
            "match_updates",
            "achievements",
            "friend_activity",
            "venue_updates",
            "promotions",
            "system_updates",
        ]:
            if field in data:
                setattr(settings, field, data[field])

        db.session.commit()

        return jsonify(
            {
                "status": "success",
                "message": "Settings updated successfully",
                "settings": settings.to_dict(),
            }
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "error": str(e)}), 400


@notifications_bp.route("/unregister", methods=["POST"])
@login_required
def unregister_device():
    """Unregister a device from push notifications."""
    try:
        data: Any = request.get_json()
        validate_request_data(data, ["device_token"])

        user: get_current_user: get_current_user: get_current_user: get_current_user: get_current_user = get_current_user()
        device: Device = Device.query.filter_by(
            user_id=user.id, token=data["device_token"]
        ).first()

        if device:
            db.session.delete(device)
            db.session.commit()

        return jsonify(
            {"status": "success", "message": "Device unregistered successfully"}
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "error": str(e)}), 400


@notifications_bp.route("/test", methods=["POST"])
@login_required
def send_test_notification():
    """Send a test notification to the user's devices."""
    try:
        user: get_current_user: get_current_user: get_current_user: get_current_user: get_current_user = get_current_user()
        notification_service.send_test_notification(user.id)

        return jsonify(
            {"status": "success", "message": "Test notification sent successfully"}
        )
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 400
