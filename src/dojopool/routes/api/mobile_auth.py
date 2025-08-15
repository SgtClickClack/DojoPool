from typing import Any, Dict

from flask import Blueprint, jsonify, request

from services.mobile_auth_service import MobileAuthService
from utils.validation import validate_request_data

mobile_auth = Blueprint("mobile_auth", __name__)
auth_service = MobileAuthService()


@mobile_auth.route("/login", methods=["POST"])
def login() -> Dict[str, Any]:
    """
    Mobile app login endpoint
    """
    data = request.get_json()
    validation = validate_request_data(data, ["credentials", "device_info"])
    if validation.get("error"):
        return jsonify(validation), 400

    result = auth_service.authenticate(data["credentials"], data["device_info"])

    if result.get("error"):
        return jsonify(result), 401

    return jsonify(result)


@mobile_auth.route("/refresh", methods=["POST"])
def refresh_token() -> Dict[str, Any]:
    """
    Refresh access token endpoint
    """
    data = request.get_json()
    validation = validate_request_data(data, ["refresh_token", "device_info"])
    if validation.get("error"):
        return jsonify(validation), 400

    result = auth_service.refresh_token(data["refresh_token"], data["device_info"])

    if result.get("error"):
        return jsonify(result), 401

    return jsonify(result)


@mobile_auth.route("/validate", methods=["POST"])
def validate_token() -> Dict[str, Any]:
    """
    Validate token endpoint
    """
    data = request.get_json()
    validation = validate_request_data(data, ["token"])
    if validation.get("error"):
        return jsonify(validation), 400

    result = auth_service.validate_token(data["token"], data.get("device_info"))

    if result.get("error"):
        return jsonify(result), 401

    return jsonify(result)


@mobile_auth.route("/device/revoke", methods=["POST"])
def revoke_device() -> Dict[str, Any]:
    """
    Revoke device access endpoint
    """
    data = request.get_json()
    validation = validate_request_data(data, ["user_id", "device_id"])
    if validation.get("error"):
        return jsonify(validation), 400

    result = auth_service.revoke_device(data["user_id"], data["device_id"])

    if result.get("error"):
        return jsonify(result), 404

    return jsonify(result)


@mobile_auth.route("/biometric/enable", methods=["POST"])
def enable_biometric() -> Dict[str, Any]:
    """
    Enable biometric authentication for device
    """
    data = request.get_json()
    validation = validate_request_data(data, ["user_id", "device_id", "biometric_key"])
    if validation.get("error"):
        return jsonify(validation), 400

    # Store biometric key securely
    # This is a placeholder for actual biometric implementation
    return jsonify({"status": "success"})


@mobile_auth.route("/biometric/verify", methods=["POST"])
def verify_biometric() -> Dict[str, Any]:
    """
    Verify biometric authentication
    """
    data = request.get_json()
    validation = validate_request_data(data, ["user_id", "device_id", "biometric_data"])
    if validation.get("error"):
        return jsonify(validation), 400

    # Verify biometric data
    # This is a placeholder for actual biometric implementation
    return jsonify({"status": "success"})
