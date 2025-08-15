import logging
from flask import Blueprint, request, jsonify

error_tracking_bp = Blueprint('error_tracking_bp', __name__, url_prefix='/api/error-tracking')

# Get a logger instance (assuming basicConfig or other configuration is done at app startup)
logger = logging.getLogger(__name__)

@error_tracking_bp.route('', methods=['POST'])
def handle_error_report():
    """
    Receives error reports from the client-side ErrorLoggingService
    and logs them to the server-side logs.
    """
    try:
        error_data = request.get_json()
        if not error_data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Log the received error data
        logger.error(f"Client-side error report: {error_data}")
        
        return jsonify({"status": "success", "message": "Error report received"}), 200
    except Exception as e:
        # Log the error that occurred while trying to log the client error
        logger.exception(f"Error in handle_error_report endpoint: {e}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500

def register_error_tracking_routes(app):
    """Registers the error tracking blueprint with the Flask app."""
    app.register_blueprint(error_tracking_bp) 