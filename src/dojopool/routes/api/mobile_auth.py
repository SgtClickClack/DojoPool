from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from services.mobile_auth_service import MobileAuthService
from utils.validation import validate_request_data
from werkzeug.wrappers import Response as WerkzeugResponse

mobile_auth: Blueprint = BResponsele_auth", __name__)
auth_service: MobileAuthService = MobileAuthService()


@mobile_auth.route("/login", methods=["POST"])
def login() -> Dict[str, Any]:
    """
    Mobile app login endpoint
    """
    data: Any = request.get_json()
    validation: validate_request_data: Any = validate_request_data(data, ["credentials", "device_info"])
    if validation.get("error"):
        return jsonify(validation), 400

    result: Any = auth_service.authenticate(data["credentials"], data["device_info"])

    if result.get("error"):
        return jsonify(result), 401

    return jsonify(result)


@mobile_auth.route("/refresh", methods=["POST"])
def refresh_token() :
    """
    Refresh access token endpoint
    """
    data: Any = request.get_json()
    validation: validate_request_data: Any = validate_request_data(data, ["refresh_token", "device_info"])
    if validation.get("error"):
        return jsonify(validation), 400

    result: Any = auth_service.refresh_token(data["refresh_token"], data["device_info"])

    if result.get("error"):
        return jsonify(result), 401

    return jsonify(result)


@mobile_auth.route("/validate", methods=["POST"])
def validate_token() :
    """
    Validate token endpoint
    """
    data: Any = request.get_json()
    validation: validate_request_data: Any = validate_request_data(data, ["token"])
    if validation.get("error"):
        return jsonify(validation), 400

    result: Any = auth_service.validate_token(data["token"], data.get("device_info"))

    if result.get("error"):
        return jsonify(result), 401

    return jsonify(result)


@mobile_auth.route("/device/revoke", methods=["POST"])
def revoke_device() :
    """
    Revoke device access endpoint
    """
    data: Any = request.get_json()
    validation: validate_request_data: Any = validate_request_data(data, ["user_id", "device_id"])
    if validation.get("error"):
        return jsonify(validation), 400

    result: Any = auth_service.revoke_device(data["user_id"], data["device_id"])

    if result.get("error"):
        return jsonify(result), 404

    return jsonify(result)


@mobile_auth.route("/biometric/enable", methods=["POST"])
def enable_biometric() -> Dict[str, Any]:
    """
    Enable biometric authentication for device
    """
    data: Any = request.get_json()
    validation: validate_request_data: Any = validate_request_data(data, ["user_id", "device_id", "biometric_key"])
    if validation.get("error"):
        return jsonify(validation), 400

    # Store biometric key securely
    # This is a placeholdeResponseiometric implementation
    return jsonify({"status": "success"})


@mobile_auth.route("/biometric/verify", methods=["POST"])
def verify_biometric() :
    """
    Verify biometric authentication
    """
    data: Any = request.get_json()
    validation: validate_request_data: Any = validate_request_data(data, ["user_id", "device_id", "biometric_data"])
    if validation.get("error"):
        return jsonify(validation), 400

    # Verify biometric data
    # This is a placeholdeResponseiometric implementation
    return jsonify({"status": "success"})
