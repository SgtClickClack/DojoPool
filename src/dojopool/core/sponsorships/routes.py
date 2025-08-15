from flask import Blueprint, jsonify, request

from ..auth.decorators import admin_required, login_required
from .models import SponsorshipDeal
from .service import SponsorshipService

sponsorships_bp = Blueprint("sponsorships", __name__)
sponsorship_service = SponsorshipService()


# Sponsor routes
@sponsorships_bp.route("/sponsors", methods=["POST"])
@login_required
def create_sponsor():
    """Create a new sponsor."""
    try:
        data = request.get_json()
        sponsor = sponsorship_service.create_sponsor(data)
        return jsonify({"id": sponsor.id, "name": sponsor.name, "status": sponsor.status}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@sponsorships_bp.route("/sponsors/<int:sponsor_id>", methods=["GET"])
def get_sponsor(sponsor_id):
    """Get sponsor details."""
    sponsor = sponsorship_service.get_sponsor(sponsor_id)
    if not sponsor:
        return jsonify({"error": "Sponsor not found"}), 404

    return jsonify(
        {
            "id": sponsor.id,
            "name": sponsor.name,
            "description": sponsor.description,
            "logo_url": sponsor.logo_url,
            "website": sponsor.website,
            "status": sponsor.status,
        }
    )


@sponsorships_bp.route("/sponsors/<int:sponsor_id>", methods=["PUT"])
@login_required
def update_sponsor(sponsor_id):
    """Update sponsor information."""
    try:
        data = request.get_json()
        sponsor = sponsorship_service.update_sponsor(sponsor_id, data)
        if not sponsor:
            return jsonify({"error": "Sponsor not found"}), 404

        return jsonify({"id": sponsor.id, "name": sponsor.name, "status": sponsor.status})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# Sponsorship tier routes
@sponsorships_bp.route("/tiers", methods=["POST"])
@admin_required
def create_tier():
    """Create a new sponsorship tier."""
    try:
        data = request.get_json()
        tier = sponsorship_service.create_sponsorship_tier(data)
        return (
            jsonify(
                {
                    "id": tier.id,
                    "name": tier.name,
                    "price": tier.price,
                    "duration_days": tier.duration_days,
                }
            ),
            201,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@sponsorships_bp.route("/tiers", methods=["GET"])
def get_tiers():
    """Get all active sponsorship tiers."""
    tiers = sponsorship_service.get_active_tiers()
    return jsonify(
        {
            "tiers": [
                {
                    "id": tier.id,
                    "name": tier.name,
                    "description": tier.description,
                    "price": tier.price,
                    "duration_days": tier.duration_days,
                    "benefits": tier.benefits,
                }
                for tier in tiers
            ]
        }
    )


# Sponsorship deal routes
@sponsorships_bp.route("/deals", methods=["POST"])
@login_required
def create_deal():
    """Create a new sponsorship deal."""
    try:
        data = request.get_json()
        deal = sponsorship_service.create_sponsorship_deal(data)
        if not deal:
            return jsonify({"error": "Unable to create deal"}), 400

        return (
            jsonify(
                {
                    "id": deal.id,
                    "sponsor_id": deal.sponsor_id,
                    "tier_id": deal.tier_id,
                    "status": deal.status,
                    "payment_status": deal.payment_status,
                    "client_secret": deal.stripe_payment_id,  # For Stripe payment
                }
            ),
            201,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@sponsorships_bp.route("/deals", methods=["GET"])
def get_deals():
    """Get active sponsorship deals."""
    sponsor_id = request.args.get("sponsor_id", type=int)
    deals = sponsorship_service.get_active_deals(sponsor_id)
    return jsonify(
        {
            "deals": [
                {
                    "id": deal.id,
                    "sponsor": {
                        "id": deal.sponsor.id,
                        "name": deal.sponsor.name,
                        "logo_url": deal.sponsor.logo_url,
                    },
                    "tier": {"id": deal.tier.id, "name": deal.tier.name},
                    "start_date": deal.start_date.isoformat(),
                    "end_date": deal.end_date.isoformat(),
                    "status": deal.status,
                }
                for deal in deals
            ]
        }
    )


@sponsorships_bp.route("/deals/<int:deal_id>", methods=["GET"])
def get_deal(deal_id):
    """Get details of a specific sponsorship deal."""
    deal = SponsorshipDeal.query.get(deal_id)
    if not deal:
        return jsonify({"error": "Deal not found"}), 404

    return jsonify(
        {
            "id": deal.id,
            "sponsor": {
                "id": deal.sponsor.id,
                "name": deal.sponsor.name,
                "logo_url": deal.sponsor.logo_url,
            },
            "tier": {"id": deal.tier.id, "name": deal.tier.name, "benefits": deal.tier.benefits},
            "venue_id": deal.venue_id,
            "start_date": deal.start_date.isoformat(),
            "end_date": deal.end_date.isoformat(),
            "status": deal.status,
            "payment_status": deal.payment_status,
            "total_amount": deal.total_amount,
        }
    )
