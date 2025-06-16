import logging

from flask import Blueprint, current_app, request
from flask_login import current_user, login_required

from .qr import QRCodeManager

logger = logging.getLogger(__name__)
qr_bp = Blueprint("qr", __name__)
qr_manager = None


def init_qr_manager(app):
    """Initialize the QR code manager."""
    global qr_manager
    try:
        secret_key = app.config.get("QR_SECRET_KEY")
        expiry_minutes = app.config.get("QR_EXPIRY_MINUTES", 60)
        if secret_key:
            qr_manager = QRCodeManager(secret_key, expiry_minutes)
            logger.info("QR code manager initialized")
            return True
    except Exception as e:
        logger.error(f"Failed to initialize QR code manager: {str(e)}")
    return False


@qr_bp.route("/venues/<int:venue_id>/tables/<int:table_id>/qr", methods=["GET"])
@login_required
def generate_table_qr(venue_id: int, table_id: int):
    """Generate QR code for a specific table."""
    try:
        if not qr_manager:
            return {"error": "QR code manager not initialized"}, 500

        qr_code = qr_manager.generate_table_qr(table_id, venue_id)
        if qr_code:
            return {"qr_code": qr_code, "table_id": table_id, "venue_id": venue_id}, 200
        return {"error": "Failed to generate QR code"}, 400

    except Exception as e:
        logger.error(f"Failed to generate table QR code: {str(e)}")
        return {"error": "Failed to generate QR code"}, 500


@qr_bp.route("/venues/<int:venue_id>/qr/batch", methods=["GET"])
@login_required
def generate_venue_qr_codes(venue_id: int):
    """Generate QR codes for all tables in a venue."""
    try:
        if not qr_manager:
            return {"error": "QR code manager not initialized"}, 500

        qr_codes = qr_manager.generate_batch_qr_codes(venue_id)
        if qr_codes:
            return {"venue_id": venue_id, "qr_codes": qr_codes}, 200
        return {"error": "Failed to generate QR codes"}, 400

    except Exception as e:
        logger.error(f"Failed to generate venue QR codes: {str(e)}")
        return {"error": "Failed to generate QR codes"}, 500


@qr_bp.route("/tables/qr/verify", methods=["POST"])
@login_required
def verify_table_qr():
    """Verify a table QR code."""
    try:
        if not qr_manager:
            return {"error": "QR code manager not initialized"}, 500

        data = request.get_json()
        qr_data = data.get("qr_data")
        if not qr_data:
            return {"error": "QR data is required"}, 400

        table_info = qr_manager.verify_qr_code(qr_data)
        if table_info:
            return table_info, 200
        return {"error": "Invalid or expired QR code"}, 400

    except Exception as e:
        logger.error(f"Failed to verify QR code: {str(e)}")
        return {"error": "Failed to verify QR code"}, 500


@qr_bp.route("/tables/qr/action", methods=["POST"])
@login_required
def table_qr_action():
    """Perform an action using a table QR code."""
    try:
        if not qr_manager:
            return {"error": "QR code manager not initialized"}, 500

        data = request.get_json()
        qr_data = data.get("qr_data")
        action = data.get("action")

        if not qr_data or not action:
            return {"error": "QR data and action are required"}, 400

        if action not in ["check_in", "check_out", "report_maintenance"]:
            return {"error": "Invalid action"}, 400

        result = qr_manager.update_table_status_from_qr(qr_data, current_user.id, action)

        if result:
            return result, 200
        return {"error": "Failed to perform action"}, 400

    except Exception as e:
        logger.error(f"Failed to perform QR action: {str(e)}")
        return {"error": "Failed to perform action"}, 500


@qr_bp.route("/tables/qr/status", methods=["POST"])
@login_required
def get_table_status_from_qr():
    """Get table status using QR code."""
    try:
        if not qr_manager:
            return {"error": "QR code manager not initialized"}, 500

        data = request.get_json()
        qr_data = data.get("qr_data")
        if not qr_data:
            return {"error": "QR data is required"}, 400

        status = qr_manager.get_table_status_from_qr(qr_data)
        if status:
            return status, 200
        return {"error": "Failed to get table status"}, 400

    except Exception as e:
        logger.error(f"Failed to get table status: {str(e)}")
        return {"error": "Failed to get table status"}, 500


# Initialize QR manager when the application starts
@qr_bp.before_app_first_request
def initialize_qr_manager():
    """Initialize the QR code manager when the application starts."""
    try:
        if init_qr_manager(current_app):
            logger.info("QR code manager initialized")
        else:
            logger.error("Failed to initialize QR code manager")
    except Exception as e:
        logger.error(f"QR code manager initialization error: {str(e)}")


# Clean up when the application shuts down
@qr_bp.teardown_app_request
def cleanup_qr_manager(exception=None):
    """Clean up QR code manager resources."""
    pass  # Add cleanup if needed
