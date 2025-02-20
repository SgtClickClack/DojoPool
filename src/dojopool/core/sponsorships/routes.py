from flask_caching import Cache
from flask_caching import Cache
from typing import Any, Dict, List

from flask import Blueprint, jsonify, request

from ..database import db
from ..exceptions import ValidationError
from ..models.sponsorship import Sponsorship, SponsorshipTier
from ..models.user import User
from ..security import login_required

sponsorships_bp = Blueprint("sponsorships", __name__)


@sponsorships_bp.route("/tiers", methods=["GET"])
def get_sponsorship_tiers() -> Dict[str, List[Dict[str, Any]]]:
    """Get all available sponsorship tiers."""
    tiers = SponsorshipTier.query.all()
    return jsonify(
        {
            "tiers": [
                {
                    "id": tier.id,
                    "name": tier.name,
                    "description": tier.description,
                    "price": float(tier.price),
                    "benefits": tier.benefits,
                    "duration_days": tier.duration_days,
                }
                for tier in tiers
            ]
        }
    )


@sponsorships_bp.route("/sponsorships", methods=["GET"])
@login_required
def get_user_sponsorships():
    """Get all sponsorships for the current user."""
    user_id = request.user.id
    sponsorships = Sponsorship.query.filter_by(user_id=user_id).all()

    return jsonify(
        {
            "sponsorships": [
                {
                    "id": s.id,
                    "tier": {"id": s.tier.id, "name": s.tier.name},
                    "start_date": s.start_date.isoformat(),
                    "end_date": s.end_date.isoformat(),
                    "status": s.status,
                    "auto_renew": s.auto_renew,
                }
                for s in sponsorships
            ]
        }
    )


@sponsorships_bp.route("/sponsorships", methods=["POST"])
@login_required
def create_sponsorship():
    """Create a new sponsorship for the current user."""
    data = request.get_json()
    tier_id = data.get("tier_id")
    auto_renew = data.get("auto_renew", False)

    if not tier_id:
        return jsonify({"error": "Tier ID is required"}), 400

    tier = SponsorshipTier.query.get(tier_id)
    if not tier:
        return jsonify({"error": "Invalid tier ID"}), 400

    # Create new sponsorship
    sponsorship = Sponsorship.create(
        user_id=request.user.id, tier_id=tier_id, auto_renew=auto_renew
    )

    return jsonify(
        {
            "sponsorship": {
                "id": sponsorship.id,
                "tier": {"id": sponsorship.tier.id, "name": sponsorship.tier.name},
                "start_date": sponsorship.start_date.isoformat(),
                "end_date": sponsorship.end_date.isoformat(),
                "status": sponsorship.status,
                "auto_renew": sponsorship.auto_renew,
            }
        }
    )


@sponsorships_bp.route("/sponsorships/<int:sponsorship_id>", methods=["PATCH"])
@login_required
def update_sponsorship(sponsorship_id: int) -> Dict[str, Any]:
    """Update an existing sponsorship."""
    data = request.get_json()
    auto_renew = data.get("auto_renew")

    sponsorship = Sponsorship.query.get_or_404(sponsorship_id)

    if sponsorship.user_id != request.user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if auto_renew is not None:
        sponsorship.auto_renew = auto_renew
        db.session.commit()

    return jsonify(
        {
            "sponsorship": {
                "id": sponsorship.id,
                "tier": {"id": sponsorship.tier.id, "name": sponsorship.tier.name},
                "start_date": sponsorship.start_date.isoformat(),
                "end_date": sponsorship.end_date.isoformat(),
                "status": sponsorship.status,
                "auto_renew": sponsorship.auto_renew,
            }
        }
    )


@sponsorships_bp.route("/sponsorships/<int:sponsorship_id>/cancel", methods=["POST"])
@login_required
def cancel_sponsorship(sponsorship_id: int) -> Dict[str, str]:
    """Cancel an active sponsorship."""
    sponsorship = Sponsorship.query.get_or_404(sponsorship_id)

    if sponsorship.user_id != request.user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if sponsorship.status != "active":
        return jsonify({"error": "Sponsorship is not active"}), 400

    sponsorship.cancel()
    db.session.commit()

    return jsonify({"message": "Sponsorship cancelled successfully"})
