from datetime import datetime, timedelta
from typing import Dict, List, Optional

from ..models import db
from ..payments.stripe_service import StripeService
from .models import Sponsor, SponsorshipDeal, SponsorshipTier


class SponsorshipService:
    def __init__(self):
        self.stripe_service = StripeService()

    def create_sponsor(self, data: Dict) -> Sponsor:
        """Create a new sponsor."""
        sponsor = Sponsor(
            name=data["name"],
            description=data.get("description"),
            logo_url=data.get("logo_url"),
            website=data.get("website"),
            contact_email=data.get("contact_email"),
            contact_phone=data.get("contact_phone"),
            status="pending",
        )
        db.session.add(sponsor)
        db.session.commit()
        return sponsor

    def get_sponsor(self, sponsor_id: int) -> Optional[Sponsor]:
        """Get a sponsor by ID."""
        return Sponsor.query.get(sponsor_id)

    def update_sponsor(self, sponsor_id: int, data: Dict) -> Optional[Sponsor]:
        """Update a sponsor's information."""
        sponsor = self.get_sponsor(sponsor_id)
        if not sponsor:
            return None

        for key, value in data.items():
            if hasattr(sponsor, key):
                setattr(sponsor, key, value)

        db.session.commit()
        return sponsor

    def create_sponsorship_tier(self, data: Dict) -> SponsorshipTier:
        """Create a new sponsorship tier."""
        tier = SponsorshipTier(
            name=data["name"],
            description=data.get("description"),
            price=data["price"],
            duration_days=data["duration_days"],
            benefits=data.get("benefits"),
            max_sponsors=data.get("max_sponsors"),
            is_active=True,
        )
        db.session.add(tier)
        db.session.commit()
        return tier

    def get_active_tiers(self) -> List[SponsorshipTier]:
        """Get all active sponsorship tiers."""
        return SponsorshipTier.query.filter_by(is_active=True).all()

    def create_sponsorship_deal(self, data: Dict) -> Optional[SponsorshipDeal]:
        """Create a new sponsorship deal."""
        # Validate tier availability
        tier = SponsorshipTier.query.get(data["tier_id"])
        if not tier or not tier.is_active:
            return None

        if tier.max_sponsors:
            active_deals = SponsorshipDeal.query.filter_by(tier_id=tier.id, status="active").count()
            if active_deals >= tier.max_sponsors:
                return None

        # Create payment intent
        payment_result = self.stripe_service.create_payment_intent(
            amount=tier.price, currency="USD"
        )

        # Calculate dates
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=tier.duration_days)

        # Create deal
        deal = SponsorshipDeal(
            sponsor_id=data["sponsor_id"],
            tier_id=data["tier_id"],
            venue_id=data.get("venue_id"),
            start_date=start_date,
            end_date=end_date,
            status="pending",
            payment_status="pending",
            stripe_payment_id=payment_result["id"],
            total_amount=tier.price,
        )
        db.session.add(deal)
        db.session.commit()
        return deal

    def get_active_deals(self, sponsor_id: Optional[int] = None) -> List[SponsorshipDeal]:
        """Get all active sponsorship deals, optionally filtered by sponsor."""
        query = SponsorshipDeal.query.filter_by(status="active")
        if sponsor_id:
            query = query.filter_by(sponsor_id=sponsor_id)
        return query.all()

    def process_payment_success(self, payment_id: str) -> None:
        """Process a successful sponsorship payment."""
        deal = SponsorshipDeal.query.filter_by(stripe_payment_id=payment_id).first()
        if deal and deal.payment_status == "pending":
            deal.payment_status = "paid"
            deal.status = "active"
            db.session.commit()

    def process_payment_failure(self, payment_id: str) -> None:
        """Process a failed sponsorship payment."""
        deal = SponsorshipDeal.query.filter_by(stripe_payment_id=payment_id).first()
        if deal and deal.payment_status == "pending":
            deal.payment_status = "failed"
            deal.status = "cancelled"
            db.session.commit()

    def check_expired_deals(self) -> None:
        """Check and update expired sponsorship deals."""
        now = datetime.utcnow()
        expired_deals = SponsorshipDeal.query.filter(
            SponsorshipDeal.status == "active", SponsorshipDeal.end_date <= now
        ).all()

        for deal in expired_deals:
            deal.status = "expired"

        if expired_deals:
            db.session.commit()
