"""
Table Availability API Routes

This module provides API endpoints for managing table availability and maintenance.
"""

from datetime import datetime
from flask import Blueprint, jsonify, request
from typing import Dict, List

from ..services.table_availability_service import TableAvailabilityService
from ..utils.auth import venue_owner_required
from ..utils.validation import validate_request_data

table_availability_bp = Blueprint("table_availability", __name__)
table_service = TableAvailabilityService()

@table_availability_bp.route("/availability/<int:venue_id>", methods=["GET"])
def get_availability(venue_id: int):
    """Get table availability for a venue."""
    try:
        # Get query parameters
        start_time = request.args.get("start_time")
        end_time = request.args.get("end_time")

        if not start_time or not end_time:
            return jsonify({"error": "Start time and end time are required"}), 400

        # Parse datetime strings
        start_time = datetime.fromisoformat(start_time)
        end_time = datetime.fromisoformat(end_time)

        # Get availability
        availability = table_service.get_table_availability(venue_id, start_time, end_time)
        return jsonify(availability)

    except ValueError as e:
        return jsonify({"error": "Invalid datetime format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@table_availability_bp.route("/peak-hours/<int:venue_id>", methods=["GET"])
def get_peak_hours(venue_id: int):
    """Get peak hours analysis for a venue."""
    try:
        # Get query parameter
        days = request.args.get("days", default=30, type=int)

        # Get peak hours
        peak_hours = table_service.get_peak_hours(venue_id, days)
        return jsonify(peak_hours)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@table_availability_bp.route("/maintenance", methods=["POST"])
@venue_owner_required
def schedule_maintenance():
    """Schedule maintenance for a table."""
    try:
        data = request.get_json()
        validate_request_data(data, ["table_id", "start_time", "end_time", "reason"])

        # Parse datetime strings
        start_time = datetime.fromisoformat(data["start_time"])
        end_time = datetime.fromisoformat(data["end_time"])

        # Schedule maintenance
        success = table_service.schedule_maintenance(
            data["table_id"],
            start_time,
            end_time,
            data["reason"]
        )

        if success:
            return jsonify({"message": "Maintenance scheduled successfully"})
        else:
            return jsonify({"error": "Failed to schedule maintenance"}), 400

    except ValueError as e:
        return jsonify({"error": "Invalid datetime format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@table_availability_bp.route("/maintenance/<int:venue_id>", methods=["GET"])
def get_maintenance_schedule(venue_id: int):
    """Get maintenance schedule for a venue."""
    try:
        schedule = table_service.get_maintenance_schedule(venue_id)
        return jsonify(schedule)

    except Exception as e:
        return jsonify({"error": str(e)}), 500 