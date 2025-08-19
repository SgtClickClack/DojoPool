"""Event model module.

This module contains the Event model for tracking game events.
"""

from datetime import datetime
from typing import Dict

from ..core.extensions import db


class Event(db.Model):
    """Event model for storing venue event information"""

    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    event_type = db.Column(db.String(50), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    registration_deadline = db.Column(db.DateTime)
    max_participants = db.Column(db.Integer)
    entry_fee = db.Column(db.Float, default=0.0)
    prize_pool = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default="upcoming")  # upcoming, active, completed, cancelled
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    participants = db.relationship("EventParticipant", backref="event", lazy=True)

    def __init__(
        self,
        venue_id: int,
        name: str,
        event_type: str,
        start_time: datetime,
        end_time: datetime,
        description: str = None,
        registration_deadline: datetime = None,
        max_participants: int = None,
        entry_fee: float = 0.0,
        prize_pool: float = 0.0,
        status: str = "upcoming",
    ):
        self.venue_id = venue_id
        self.name = name
        self.description = description
        self.event_type = event_type
        self.start_time = start_time
        self.end_time = end_time
        self.registration_deadline = registration_deadline
        self.max_participants = max_participants
        self.entry_fee = entry_fee
        self.prize_pool = prize_pool
        self.status = status
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> Dict:
        """Convert event object to dictionary"""
        return {
            "id": self.id,
            "venue_id": self.venue_id,
            "name": self.name,
            "description": self.description,
            "event_type": self.event_type,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "registration_deadline": (
                self.registration_deadline.isoformat() if self.registration_deadline else None
            ),
            "max_participants": self.max_participants,
            "entry_fee": self.entry_fee,
            "prize_pool": self.prize_pool,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        """String representation of event object"""
        return f"<Event {self.name}>"
