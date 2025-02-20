"""Event participant model module."""

from datetime import datetime
from typing import Dict

from ..core.extensions import db


class EventParticipant(db.Model):
    """Event participant model for tracking event participants"""

    __tablename__ = "event_participants"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    registered_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    checked_in = db.Column(db.Boolean, default=False)
    checked_in_at = db.Column(db.DateTime)
    placement = db.Column(db.Integer)
    prize_amount = db.Column(db.Float)
    status = db.Column(
        db.String(20), default="registered"
    )  # registered, checked_in, completed, withdrawn
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref="event_participations")

    def __init__(
        self,
        event_id: int,
        user_id: int,
        status: str = "registered",
        checked_in: bool = False,
        checked_in_at: datetime = None,
        placement: int = None,
        prize_amount: float = None,
    ):
        self.event_id = event_id
        self.user_id = user_id
        self.status = status
        self.checked_in = checked_in
        self.checked_in_at = checked_in_at
        self.placement = placement
        self.prize_amount = prize_amount
        self.registered_at = datetime.utcnow()
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> Dict:
        """Convert event participant object to dictionary"""
        return {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "registered_at": self.registered_at.isoformat(),
            "checked_in": self.checked_in,
            "checked_in_at": (
                self.checked_in_at.isoformat() if self.checked_in_at else None
            ),
            "placement": self.placement,
            "prize_amount": self.prize_amount,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self):
        """String representation of event participant object"""
        return f"<EventParticipant {self.user_id} - Event {self.event_id}>"
