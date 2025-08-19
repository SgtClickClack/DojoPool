"""Event models module."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..database import db
from .base import BaseModel


class Event(BaseModel):
    """Event model."""

    __tablename__ = "events"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # tournament, league, social, training
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime)
    max_participants = Column(Integer)
    entry_fee = Column(Float)
    prize_pool = Column(Float)
    rules = Column(Text)
    status = Column(String(20), default="upcoming")  # upcoming, ongoing, completed, cancelled
    is_private = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = relationship("Venue", backref="events")
    organizer = relationship("User", backref="organized_events")
    participants = relationship("EventParticipant", back_populates="event")

    def __repr__(self):
        return f"<Event {self.name}>"

    def start(self):
        """Start the event."""
        if self.status == "upcoming":
            self.status = "ongoing"
            db.session.commit()

    def complete(self):
        """Complete the event."""
        if self.status == "ongoing":
            self.status = "completed"
            db.session.commit()

    def cancel(self):
        """Cancel the event."""
        if self.status != "completed":
            self.status = "cancelled"
            db.session.commit()

    def is_registration_open(self):
        """Check if registration is open."""
        if self.status != "upcoming":
            return False

        if self.registration_deadline:
            return datetime.utcnow() <= self.registration_deadline

        return True

    def is_full(self):
        """Check if event is full."""
        if not self.max_participants:
            return False

        return self.participants.count() >= self.max_participants


class EventParticipant(BaseModel):
    """Event participant model."""

    __tablename__ = "event_participants"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        String(20), default="registered"
    )  # registered, checked_in, completed, cancelled
    checked_in_at = Column(DateTime)
    checked_out_at = Column(DateTime)
    placement = Column(Integer)  # For competitive events
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="participants")
    user = relationship("User", backref="event_participations")

    def __repr__(self):
        return f"<EventParticipant {self.user_id} in {self.event_id}>"

    def check_in(self):
        """Check in participant."""
        if self.status == "registered":
            self.status = "checked_in"
            self.checked_in_at = datetime.utcnow()
            db.session.commit()

    def check_out(self):
        """Check out participant."""
        if self.status == "checked_in":
            self.status = "completed"
            self.checked_out_at = datetime.utcnow()
            db.session.commit()

    def cancel(self):
        """Cancel participation."""
        if self.status != "completed":
            self.status = "cancelled"
            db.session.commit()
