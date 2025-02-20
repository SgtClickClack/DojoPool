from flask_caching import Cache
from flask_caching import Cache
"""Route handlers for venue and QR code operations."""

from datetime import datetime
from functools import wraps
from io import BytesIO
from typing import Any, Callable, Dict, List, Optional, TypeVar, cast

from flask import Blueprint, jsonify, request, send_file
from flask.typing import ResponseReturnValue
from flask_login import current_user, login_required

from ..auth import require_permissions
from .models import PoolTable, Venue, VenueStaff, venue_manager
from .qr import QRCodeManager, qr_manager
from .qr_alerts import AlertSeverity, qr_alerts
from .qr_export import qr_export
from .qr_stats import qr_stats
from .rate_limit import rate_limit

F = TypeVar("F", bound=Callable[..., Any])

venue_bp = Blueprint("venue", __name__)
qr_manager = QRCodeManager()


def validate_venue_access(f: F) -> F:
    """Decorator to validate venue access.

    Args:
        f: Function to decorate

    Returns:
        Decorated function
    """

    @wraps(f)
    def decorated_function(venue_id: int, *args: Any, **kwargs: Any):
        # Check if user has access to venue
        venue = Venue.query.get_or_404(venue_id)

        if not current_user.is_authenticated:
            return jsonify({"error": "Authentication required"}), 401

        if not venue.has_access(current_user):
            return jsonify({"error": "Access denied"}), 403

        return f(venue_id, *args, **kwargs)

    return cast(F, decorated_function)


@venue_bp.route("/venues", methods=["GET"])
def list_venues():
    """List all venues."""
    venues = Venue.query.filter_by(is_active=True).all()
    return jsonify(
        {
            "venues": [
                {
                    "id": venue.id,
                    "name": venue.name,
                    "address": venue.address,
                    "phone": venue.phone,
                    "email": venue.email,
                    "website": venue.website,
                    "description": venue.description,
                    "hours": venue.hours,
                    "tables": len(venue.tables),
                    "rating": venue.average_rating,
                }
                for venue in venues
            ]
        }
    )


@venue_bp.route("/venues/<int:venue_id>", methods=["GET"])
def get_venue(venue_id: int) -> ResponseReturnValue:
    """Get venue details."""
    venue = Venue.query.get_or_404(venue_id)
    return jsonify(
        {
            "id": venue.id,
            "name": venue.name,
            "address": venue.address,
            "phone": venue.phone,
            "email": venue.email,
            "website": venue.website,
            "description": venue.description,
            "hours": venue.hours,
            "tables": [
                {
                    "id": table.id,
                    "name": table.name,
                    "type": table.type,
                    "status": table.status,
                }
                for table in venue.tables
            ],
            "rating": venue.average_rating,
            "reviews": [
                {
                    "id": review.id,
                    "rating": review.rating,
                    "comment": review.comment,
                    "created_at": review.created_at.isoformat(),
                }
                for review in venue.reviews
            ],
        }
    )


@venue_bp.route("/venues", methods=["POST"])
@login_required
@require_permissions("create_venue")
def create_venue():
    """Create a new venue."""
    data = request.get_json()

    # Validate required fields
    required_fields = ["name", "address", "phone", "email"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    venue = Venue(
        name=data["name"],
        address=data["address"],
        phone=data["phone"],
        email=data["email"],
        website=data.get("website"),
        description=data.get("description"),
        hours=data.get("hours"),
        owner_id=current_user.id,
    )

    venue_manager.create_venue(venue)

    return jsonify({"id": venue.id, "name": venue.name, "address": venue.address}), 201


@venue_bp.route("/venues/<int:venue_id>", methods=["PUT"])
@login_required
@validate_venue_access
def update_venue(venue_id: int) -> ResponseReturnValue:
    """Update venue details."""
    venue = Venue.query.get_or_404(venue_id)
    data = request.get_json()

    # Update fields
    if "name" in data:
        venue.name = data["name"]
    if "address" in data:
        venue.address = data["address"]
    if "phone" in data:
        venue.phone = data["phone"]
    if "email" in data:
        venue.email = data["email"]
    if "website" in data:
        venue.website = data["website"]
    if "description" in data:
        venue.description = data["description"]
    if "hours" in data:
        venue.hours = data["hours"]

    venue_manager.update_venue(venue)

    return jsonify({"id": venue.id, "name": venue.name, "address": venue.address})


@venue_bp.route("/venues/<int:venue_id>/tables", methods=["POST"])
@login_required
@validate_venue_access
def add_table(venue_id: int) -> ResponseReturnValue:
    """Add a pool table to a venue."""
    venue = Venue.query.get_or_404(venue_id)
    data = request.get_json()

    # Validate required fields
    if "name" not in data or "type" not in data:
        return jsonify({"error": "Name and type are required"}), 400

    table = PoolTable(venue_id=venue_id, name=data["name"], type=data["type"])

    venue_manager.add_table(table)

    return jsonify({"id": table.id, "name": table.name, "type": table.type}), 201


@venue_bp.route("/venues/<int:venue_id>/tables/<int:table_id>", methods=["PUT"])
@login_required
@validate_venue_access
def update_table(venue_id: int, table_id: int) -> ResponseReturnValue:
    """Update pool table details."""
    table = PoolTable.query.get_or_404(table_id)

    # Verify table belongs to venue
    if table.venue_id != venue_id:
        return jsonify({"error": "Table not found in venue"}), 404

    data = request.get_json()

    # Update fields
    if "name" in data:
        table.name = data["name"]
    if "type" in data:
        table.type = data["type"]
    if "status" in data:
        table.status = data["status"]

    venue_manager.update_table(table)

    return jsonify(
        {"id": table.id, "name": table.name, "type": table.type, "status": table.status}
    )


@venue_bp.route("/venues/<int:venue_id>/staff", methods=["POST"])
@login_required
@validate_venue_access
def add_staff(venue_id: int) -> ResponseReturnValue:
    """Add staff member to venue."""
    data = request.get_json()

    # Validate required fields
    if "user_id" not in data or "role" not in data:
        return jsonify({"error": "User ID and role are required"}), 400

    staff = VenueStaff(venue_id=venue_id, user_id=data["user_id"], role=data["role"])

    venue_manager.add_staff(staff)

    return (
        jsonify({"venue_id": venue_id, "user_id": staff.user_id, "role": staff.role}),
        201,
    )


@venue_bp.route("/venues/<int:venue_id>/qr", methods=["GET"])
@login_required
@validate_venue_access
def get_venue_qr(venue_id: int) -> ResponseReturnValue:
    """Get QR code for venue."""
    venue = Venue.query.get_or_404(venue_id)

    # Generate QR code
    qr_data = qr_manager.generate_venue_qr(venue)

    # Track QR code generation
    qr_stats.track_generation(venue_id)

    # Create file-like object
    img_io = BytesIO()
    qr_data.save(img_io, "PNG")
    img_io.seek(0)

    return send_file(
        img_io,
        mimetype="image/png",
        as_attachment=True,
        download_name=f"venue_{venue_id}_qr.png",
    )


@venue_bp.route("/venues/<int:venue_id>/qr/stats", methods=["GET"])
@login_required
@validate_venue_access
def get_qr_stats(venue_id: int) -> ResponseReturnValue:
    """Get QR code usage statistics."""
    stats = qr_stats.get_venue_stats(venue_id)
    return jsonify(stats)


@venue_bp.route("/venues/<int:venue_id>/qr/export", methods=["POST"])
@login_required
@validate_venue_access
def export_qr_codes(venue_id: int) -> ResponseReturnValue:
    """Export all QR codes for a venue."""
    venue = Venue.query.get_or_404(venue_id)

    try:
        # Generate export
        export_data = qr_export.generate_export(venue)

        # Create file-like object
        export_io = BytesIO()
        export_data.save(export_io)
        export_io.seek(0)

        return send_file(
            export_io,
            mimetype="application/zip",
            as_attachment=True,
            download_name=f"venue_{venue_id}_qr_export.zip",
        )
    except Exception as e:
        qr_alerts.add_alert(
            venue_id, AlertSeverity.ERROR, f"Failed to export QR codes: {str(e)}"
        )
        return jsonify({"error": "Failed to generate export"}), 500


@venue_bp.route("/venues/<int:venue_id>/qr/alerts", methods=["GET"])
@login_required
@validate_venue_access
def get_qr_alerts(venue_id: int) -> ResponseReturnValue:
    """Get QR code related alerts."""
    alerts = qr_alerts.get_venue_alerts(venue_id)
    return jsonify(
        {
            "alerts": [
                {
                    "id": alert.id,
                    "severity": alert.severity.value,
                    "message": alert.message,
                    "created_at": alert.created_at.isoformat(),
                }
                for alert in alerts
            ]
        }
    )
