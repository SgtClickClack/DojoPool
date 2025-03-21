"""Route handlers for venue and QR code operations."""

from datetime import datetime
from functools import wraps
from io import BytesIO
from typing import Dict, List, Optional

from flask import Blueprint, jsonify, request, send_file, Response
from flask_login import current_user, login_required

from ...core.auth.dependencies import check_permissions
from ...core.extensions import db
from ...core.monitoring.metrics_monitor import metrics_monitor
from .models import PoolTable, Venue, VenueStaff, TableStatus
from .qr import qr_manager
from .qr_alerts import AlertSeverity, qr_alerts
from .qr_export import qr_export
from .qr_stats import qr_stats
from .rate_limit import rate_limit

venue_bp = Blueprint("venue", __name__)


def validate_venue_access(f):
    """Decorator to validate venue access."""

    @wraps(f)
    def decorated_function(venue_id, *args, **kwargs):
        venue = Venue.query.get_or_404(venue_id)
        if not venue:
            return jsonify({"error": "Venue not found"}), 404
        return f(venue_id, *args, **kwargs)

    return decorated_function


@venue_bp.route("/venues", methods=["GET"])
@login_required
def list_venues() -> Response:
    """List all venues."""
    try:
        venues = Venue.query.filter_by(is_active=True).all()
        return jsonify(
            [
                {
                    "id": venue.id,
                    "name": venue.name,
                    "address": venue.address,
                    "city": venue.city,
                    "state": venue.state,
                    "country": venue.country,
                    "phone": venue.phone,
                    "email": venue.email,
                    "website": venue.website,
                }
                for venue in venues
            ]
        )
    except Exception as e:
        metrics_monitor.record_error(
            game_id="list_venues",
            error_type="api_error",
            message=f"Error listing venues: {str(e)}",
            details={},
        )
        return jsonify({"error": str(e)}), 500


@venue_bp.route("/venues/<int:venue_id>", methods=["GET"])
@login_required
def get_venue(venue_id: int) -> Response:
    """Get venue details.

    Args:
        venue_id: ID of the venue

    Returns:
        Response: Venue details
    """
    try:
        venue = Venue.query.get_or_404(venue_id)
        return jsonify(
            {
                "id": venue.id,
                "name": venue.name,
                "address": venue.address,
                "city": venue.city,
                "state": venue.state,
                "country": venue.country,
                "phone": venue.phone,
                "email": venue.email,
                "website": venue.website,
                "tables": [
                    {
                        "id": table.id,
                        "name": table.name,
                        "type": table.table_type.value,
                        "status": table.status.value,
                    }
                    for table in venue.tables
                ],
            }
        )
    except Exception as e:
        metrics_monitor.record_error(
            game_id="get_venue",
            error_type="api_error",
            message=f"Error getting venue details: {str(e)}",
            details={"venue_id": venue_id},
        )
        return jsonify({"error": str(e)}), 500


@venue_bp.route("/venues/<int:venue_id>/tables", methods=["GET"])
@login_required
def list_tables(venue_id: int) -> Response:
    """List all tables in a venue.

    Args:
        venue_id: ID of the venue

    Returns:
        Response: List of tables
    """
    try:
        venue = Venue.query.get_or_404(venue_id)
        return jsonify(
            [
                {
                    "id": table.id,
                    "name": table.name,
                    "type": table.table_type.value,
                    "status": table.status.value,
                    "qr_code": table.qr_code,
                }
                for table in venue.tables
            ]
        )
    except Exception as e:
        metrics_monitor.record_error(
            game_id="list_tables",
            error_type="api_error",
            message=f"Error listing tables: {str(e)}",
            details={"venue_id": venue_id},
        )
        return jsonify({"error": str(e)}), 500


@venue_bp.route("/venues/<int:venue_id>/tables/<int:table_id>/qr", methods=["GET"])
@login_required
def get_table_qr(venue_id: int, table_id: int) -> Response:
    """Get QR code for a table.

    Args:
        venue_id: ID of the venue
        table_id: ID of the table

    Returns:
        Response: QR code image
    """
    try:
        table = PoolTable.query.get_or_404(table_id)
        if table.venue_id != venue_id:
            return jsonify({"error": "Table not found in venue"}), 404

        # Generate QR code
        qr_image = qr_manager.generate_table_qr(table_id, venue_id)

        # Convert to bytes
        img_bytes = BytesIO()
        qr_image.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        # Return as response
        return send_file(img_bytes, mimetype='image/png')

    except Exception as e:
        metrics_monitor.record_error(
            game_id="get_table_qr",
            error_type="api_error",
            message=f"Error getting table QR code: {str(e)}",
            details={"venue_id": venue_id, "table_id": table_id},
        )
        return jsonify({"error": str(e)}), 500


@venue_bp.route("/venues/<int:venue_id>/tables/<int:table_id>/status", methods=["PUT"])
@login_required
@check_permissions("manage_tables")
def update_table_status(venue_id: int, table_id: int) -> Response:
    """Update table status.

    Args:
        venue_id: ID of the venue
        table_id: ID of the table

    Returns:
        Response: Updated table details
    """
    try:
        table = PoolTable.query.get_or_404(table_id)
        if table.venue_id != venue_id:
            return jsonify({"error": "Table not found in venue"}), 404

        data = request.get_json()
        if "status" not in data:
            return jsonify({"error": "Status not provided"}), 400

        table.status = TableStatus(data["status"])
        table.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify(
            {
                "id": table.id,
                "name": table.name,
                "type": table.table_type.value,
                "status": table.status.value,
            }
        )

    except Exception as e:
        metrics_monitor.record_error(
            game_id=str(table_id),
            error_type="api_error",
            message=f"Error updating table status: {str(e)}",
            details={"venue_id": venue_id, "table_id": table_id},
        )
        return jsonify({"error": str(e)}), 500


@venue_bp.route("/venues/<int:venue_id>/staff", methods=["GET"])
@login_required
@check_permissions("manage_staff")
def list_staff(venue_id: int) -> Response:
    """List venue staff.

    Args:
        venue_id: ID of the venue

    Returns:
        Response: List of staff members
    """
    try:
        venue = Venue.query.get_or_404(venue_id)
        return jsonify(
            [
                {
                    "id": staff.id,
                    "username": staff.username,
                    "email": staff.email,
                    "role": VenueStaff.query.filter_by(venue_id=venue_id, user_id=staff.id)
                    .first()
                    .role,
                }
                for staff in venue.staff
            ]
        )
    except Exception as e:
        metrics_monitor.record_error(
            game_id="list_staff",
            error_type="api_error",
            message=f"Error listing staff: {str(e)}",
            details={"venue_id": venue_id},
        )
        return jsonify({"error": str(e)}), 500


@venue_bp.route("/venues/<int:venue_id>/staff", methods=["POST"])
@login_required
@check_permissions("manage_staff")
def add_staff(venue_id: int) -> Response:
    """Add staff member to venue.

    Args:
        venue_id: ID of the venue

    Returns:
        Response: Added staff member details
    """
    try:
        data = request.get_json()
        if not all(key in data for key in ["user_id", "role"]):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if already staff
        existing = VenueStaff.query.filter_by(venue_id=venue_id, user_id=data["user_id"]).first()
        if existing:
            return jsonify({"error": "User is already staff"}), 400

        # Add staff member
        staff = VenueStaff(venue_id=venue_id, user_id=data["user_id"], role=data["role"])
        db.session.add(staff)
        db.session.commit()

        return (
            jsonify({"venue_id": staff.venue_id, "user_id": staff.user_id, "role": staff.role}),
            201,
        )

    except Exception as e:
        metrics_monitor.record_error(
            game_id="add_staff",
            error_type="api_error",
            message=f"Error adding staff: {str(e)}",
            details={"venue_id": venue_id},
        )
        return jsonify({"error": str(e)}), 500


@venue_bp.route("/venues/<venue_id>/qr/stats", methods=["GET"])
@login_required
@validate_venue_access
@rate_limit()
def get_venue_qr_stats(venue_id):
    """Get QR code statistics for a venue.

    Args:
        venue_id: ID of the venue

    Returns:
        JSON response with venue statistics
    """
    days = request.args.get("days", default=30, type=int)
    stats = qr_stats.get_venue_stats(venue_id, days)

    if not stats:
        return jsonify({"error": "No statistics available"}), 404

    return jsonify(stats)


@venue_bp.route("/tables/<table_id>/qr/stats", methods=["GET"])
@login_required
@rate_limit()
def get_table_qr_stats(table_id):
    """Get QR code statistics for a table.

    Args:
        table_id: ID of the table

    Returns:
        JSON response with table statistics
    """
    days = request.args.get("days", default=30, type=int)
    stats = qr_stats.get_table_stats(table_id, days)

    if not stats:
        return jsonify({"error": "No statistics available"}), 404

    return jsonify(stats)


@venue_bp.route("/qr/errors", methods=["GET"])
@login_required
@rate_limit()
def get_qr_errors():
    """Get QR code error report.

    Query parameters:
        venue_id: Optional venue ID to filter by
        table_id: Optional table ID to filter by
        days: Optional number of days to limit report to

    Returns:
        JSON response with error report
    """
    venue_id = request.args.get("venue_id")
    table_id = request.args.get("table_id")
    days = request.args.get("days", default=30, type=int)

    report = qr_stats.get_error_report(venue_id=venue_id, table_id=table_id, days=days)

    return jsonify(report)


@venue_bp.route("/qr/alerts", methods=["GET"])
@login_required
@rate_limit()
def get_qr_alerts():
    """Get QR code alerts.

    Query parameters:
        venue_id: Optional venue ID to filter by
        table_id: Optional table ID to filter by
        severity: Optional severity level to filter by
        include_acknowledged: Whether to include acknowledged alerts
        days: Optional number of days to limit to

    Returns:
        JSON response with alerts
    """
    venue_id = request.args.get("venue_id")
    table_id = request.args.get("table_id")
    severity = request.args.get("severity")
    include_acknowledged = request.args.get("include_acknowledged", type=bool)
    days = request.args.get("days", default=30, type=int)

    if severity:
        try:
            severity = AlertSeverity(severity)
        except ValueError:
            return jsonify({"error": "Invalid severity level"}), 400

    alerts = qr_alerts.get_alerts(
        venue_id=venue_id,
        table_id=table_id,
        severity=severity,
        include_acknowledged=include_acknowledged,
        days=days,
    )

    return jsonify(
        [
            {
                "id": i,
                "type": alert.type.value,
                "severity": alert.severity.value,
                "message": alert.message,
                "venue_id": alert.venue_id,
                "table_id": alert.table_id,
                "timestamp": alert.timestamp.isoformat(),
                "details": alert.details,
                "acknowledged": alert.acknowledged,
                "acknowledged_by": alert.acknowledged_by,
                "acknowledged_at": (
                    alert.acknowledged_at.isoformat() if alert.acknowledged_at else None
                ),
            }
            for i, alert in enumerate(alerts)
        ]
    )


@venue_bp.route("/qr/alerts/<int:alert_id>/acknowledge", methods=["POST"])
@login_required
@rate_limit()
def acknowledge_qr_alert(alert_id):
    """Acknowledge a QR code alert.

    Args:
        alert_id: ID of alert to acknowledge

    Returns:
        JSON response with acknowledgment status
    """
    user_id = getattr(request, "user_id", None)
    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    success = qr_alerts.acknowledge_alert(alert_id, user_id)
    if not success:
        return jsonify({"error": "Failed to acknowledge alert"}), 400

    return jsonify({"success": True})


@venue_bp.route("/qr/export", methods=["GET"])
@login_required
@rate_limit("export")
def export_qr_stats():
    """Export QR code statistics.

    Query parameters:
        venue_id: Optional venue ID to filter by
        table_id: Optional table ID to filter by
        days: Optional number of days to limit export to
        format: Export format (csv, excel, json)
        include_errors: Whether to include error details

    Returns:
        File download response
    """
    venue_id = request.args.get("venue_id")
    table_id = request.args.get("table_id")
    days = request.args.get("days", default=30, type=int)
    format = request.args.get("format", default="csv")
    include_errors = request.args.get("include_errors", default=True, type=bool)

    if format not in ["csv", "excel", "json"]:
        return jsonify({"error": "Invalid export format"}), 400

    # Generate export data
    if format == "csv":
        data = qr_export.export_stats_csv(
            venue_id=venue_id, table_id=table_id, days=days, include_errors=include_errors
        )
        if not data:
            return jsonify({"error": "Failed to generate export"}), 500

        return send_file(
            BytesIO(data.encode()),
            mimetype="text/csv",
            as_attachment=True,
            download_name=f"qr_stats_{datetime.utcnow().date()}.csv",
        )

    elif format == "excel":
        data = qr_export.export_stats_excel(
            venue_id=venue_id, table_id=table_id, days=days, include_errors=include_errors
        )
        if not data:
            return jsonify({"error": "Failed to generate export"}), 500

        return send_file(
            BytesIO(data),
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name=f"qr_stats_{datetime.utcnow().date()}.xlsx",
        )

    else:  # JSON
        data = qr_export.export_stats_json(
            venue_id=venue_id, table_id=table_id, days=days, include_errors=include_errors
        )
        if not data:
            return jsonify({"error": "Failed to generate export"}), 500

        return send_file(
            BytesIO(data.encode()),
            mimetype="application/json",
            as_attachment=True,
            download_name=f"qr_stats_{datetime.utcnow().date()}.json",
        )
