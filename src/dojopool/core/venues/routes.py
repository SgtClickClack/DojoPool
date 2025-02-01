"""Venue routes."""

from datetime import datetime

from flask import Blueprint, jsonify, request

from src.core.auth.utils import admin_required, token_required
from src.core.models import Venue, db

bp = Blueprint("venues", __name__, url_prefix="/venues")


@bp.route("/", methods=["GET"])
def list_venues():
    """List all active venues."""
    # Get pagination parameters
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("limit", 10, type=int)
    offset = request.args.get("offset", 0, type=int)

    # Get filter parameters
    name = request.args.get("name")
    active_param = request.args.get("active")
    active = True if active_param is None else active_param.lower() == "true"

    # Build query
    query = Venue.query

    # Apply filters
    if name:
        query = query.filter(Venue.name.ilike(f"%{name}%"))
    query = query.filter(Venue.is_active == active)

    # Get total count before pagination
    total_count = query.count()

    # Apply pagination
    if offset:
        query = query.offset(offset)
    if per_page:
        query = query.limit(per_page)

    venues = query.all()

    return jsonify(
        {
            "status": "success",
            "data": {
                "venues": [venue.to_dict() for venue in venues],
                "total_count": total_count,
                "page": page,
                "per_page": per_page,
                "offset": offset,
            },
        }
    )


@bp.route("/<int:venue_id>", methods=["GET"])
def get_venue(venue_id):
    """Get venue details."""
    try:
        venue = Venue.query.get_or_404(venue_id)
        return jsonify({"status": "success", "data": {"venue": venue.to_dict()}})
    except Exception:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Venue not found"}), 404


@bp.route("/", methods=["POST"])
@admin_required
def create_venue(admin_user):
    """Create a new venue."""
    data = request.get_json()

    # Validate required fields
    required_fields = ["name", "address"]
    if not all(field in data for field in required_fields):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    # Create venue
    venue = Venue(
        owner_id=admin_user.id,
        name=data["name"],
        address=data["address"],
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        description=data.get("description"),
        opening_hours=data.get("opening_hours", {}),
        contact_info=data.get("contact_info", {}),
        created_at=datetime.utcnow(),
        is_active=True,
    )

    try:
        db.session.add(venue)
        db.session.commit()
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Venue created successfully",
                    "data": {"venue": venue.to_dict()},
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/<int:venue_id>", methods=["PUT"])
@token_required
def update_venue(current_user, venue_id):
    """Update venue details."""
    venue = Venue.query.get_or_404(venue_id)

    # Only owner or admin can update
    if venue.owner_id != current_user.id and not current_user.is_admin:
        return jsonify({"status": "error", "message": "Not authorized to update this venue"}), 403

    data = request.get_json()

    # Update allowed fields
    allowed_fields = [
        "name",
        "address",
        "latitude",
        "longitude",
        "description",
        "opening_hours",
        "contact_info",
    ]
    for field in allowed_fields:
        if field in data:
            setattr(venue, field, data[field])

    try:
        db.session.commit()
        return jsonify(
            {
                "status": "success",
                "message": "Venue updated successfully",
                "data": {"venue": venue.to_dict()},
            }
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/<int:venue_id>", methods=["DELETE"])
@token_required
def delete_venue(current_user, venue_id):
    """Soft delete a venue."""
    venue = Venue.query.get_or_404(venue_id)

    # Only admin can delete
    if not current_user.is_admin:
        return jsonify({"status": "error", "message": "Admin privileges required"}), 403

    try:
        venue.is_active = False
        db.session.commit()
        return jsonify({"status": "success", "message": "Venue deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/<int:venue_id>/games", methods=["GET"])
def get_venue_games(venue_id):
    """Get all games at a venue."""
    venue = Venue.query.get_or_404(venue_id)
    return jsonify(
        {"status": "success", "data": {"games": [game.to_dict() for game in venue.games]}}
    )


@bp.route("/<int:venue_id>/tournaments", methods=["GET"])
def get_venue_tournaments(venue_id):
    """Get all tournaments at a venue."""
    venue = Venue.query.get_or_404(venue_id)
    return jsonify(
        {
            "status": "success",
            "data": {"tournaments": [tournament.to_dict() for tournament in venue.tournaments]},
        }
    )
