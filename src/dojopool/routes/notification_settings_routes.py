"""Notification settings routes module."""

from flask import Blueprint, jsonify, render_template, request
from flask_login import current_user, login_required

from src.services.notification_service import NotificationService

notification_settings_bp = Blueprint("notification_settings", __name__)


@notification_settings_bp.route("/notification-settings")
@login_required
def settings():
    """Render the notification settings page."""
    return render_template("notification_settings.html")


@notification_settings_bp.route("/api/notification-settings", methods=["GET"])
@login_required
def get_settings():
    """Get notification settings for the current user."""
    try:
        settings = NotificationService.get_notification_settings(current_user.id)
        return jsonify(settings)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@notification_settings_bp.route("/api/notification-settings", methods=["PUT"])
@login_required
def update_settings():
    """Update notification settings for the current user."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        settings = NotificationService.update_notification_settings(current_user.id, data)
        return jsonify(settings)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
