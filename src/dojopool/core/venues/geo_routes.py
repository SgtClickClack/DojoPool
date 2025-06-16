from flask import Blueprint, request

from ..auth.decorators import login_required
from .geo_service import GeoService

geo_bp = Blueprint("geo", __name__)
geo_service = GeoService()


@geo_bp.route("/nearby", methods=["GET"])
@login_required
def get_nearby_dojos():
    """Get nearby Dojos based on provided coordinates."""
    try:
        lat = float(request.args.get("lat"))
        lng = float(request.args.get("lng"))
        radius = request.args.get("radius")

        if radius:
            radius = float(radius)

        nearby = geo_service.find_nearby_dojos(lat, lng, radius)
        return {"status": "success", "dojos": nearby}, 200

    except (ValueError, TypeError):
        return {"status": "error", "message": "Invalid coordinates provided"}, 400
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500


@geo_bp.route("/leaderboard/regional", methods=["GET"])
@login_required
def get_regional_leaderboard():
    """Get the leaderboard for a specific region."""
    try:
        lat = float(request.args.get("lat"))
        lng = float(request.args.get("lng"))
        radius = request.args.get("radius")

        if radius:
            radius = float(radius)

        leaderboard = geo_service.get_regional_leaderboard(lat, lng, radius)
        return {"status": "success", "leaderboard": leaderboard}, 200

    except (ValueError, TypeError):
        return {"status": "error", "message": "Invalid coordinates provided"}, 400
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500


@geo_bp.route("/challenges/<int:venue_id>", methods=["GET"])
@login_required
def get_area_challenges(venue_id):
    """Get location-based challenges for a specific venue."""
    try:
        challenge = geo_service.generate_area_challenge(venue_id)
        if not challenge:
            return {"status": "error", "message": "Venue not found"}, 404

        return {"status": "success", "challenge": challenge}, 200

    except Exception as e:
        return {"status": "error", "message": str(e)}, 500


@geo_bp.route("/areas/<int:venue_id>/unlock-status", methods=["GET"])
@login_required
def get_area_unlock_status(venue_id):
    """Check if an area is unlocked for the current user."""
    try:
        is_unlocked = geo_service.is_area_unlocked(venue_id)
        visit_count = geo_service.get_visit_count(venue_id)
        threshold = geo_service.area_unlock_threshold

        return (
            {
                "status": "success",
                "is_unlocked": is_unlocked,
                "visit_count": visit_count,
                "visits_needed": max(0, threshold - visit_count),
            },
            200,
        )

    except Exception as e:
        return {"status": "error", "message": str(e)}, 500
