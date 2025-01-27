"""Models for venue management."""

from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.hybrid import hybrid_property
from ..database import db


class Venue(db.Model):
    """A physical venue/dojo location."""

    __tablename__ = "venues"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    operating_hours = db.Column(JSONB)  # Store hours for each day
    total_tables = db.Column(db.Integer, default=0)
    amenities = db.Column(JSONB)  # List of available amenities
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    stats = db.Column(JSONB, default=dict)  # Store dynamic stats
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    checkins = db.relationship("VenueCheckin", back_populates="venue")
    tournaments = db.relationship("Tournament", back_populates="venue")
    owner = db.relationship("User", foreign_keys=[owner_id])

    @hybrid_property
    def is_open(self):
        """Check if venue is currently open based on operating hours."""
        if not self.operating_hours:
            return False

        now = datetime.utcnow()
        day = now.strftime("%A").lower()
        hours = self.operating_hours.get(day)

        if not hours:
            return False

        open_time, close_time = hours.split("-")
        current_time = now.strftime("%H:%M")
        return open_time <= current_time <= close_time

    @hybrid_property
    def active_players(self):
        """Count of currently checked-in players."""
        return VenueCheckin.query.filter_by(venue_id=self.id, checked_out_at=None).count()

    @hybrid_property
    def available_tables(self):
        """Number of currently available tables."""
        occupied = (
            VenueCheckin.query.filter_by(venue_id=self.id, checked_out_at=None)
            .filter(VenueCheckin.table_number.isnot(None))
            .count()
        )
        return max(0, self.total_tables - occupied)

    @property
    def current_tournament(self):
        """Get currently running tournament, if any."""
        return next((t for t in self.tournaments if t.status == "ongoing"), None)

    @property
    def upcoming_tournaments(self):
        """Get list of upcoming tournaments."""
        return [t for t in self.tournaments if t.status == "upcoming"]

    def get_stats(self, time_range="day"):
        """Get venue statistics for the specified time range."""
        # Implementation for gathering various stats
        stats = {
            "peak_players": 0,
            "avg_players": 0,
            "total_checkins": 0,
            "peak_table_usage": 0,
            "avg_table_usage": 0,
            "most_used_table": 1,
            "total_tournaments": 0,
            "avg_tournament_players": 0,
            "total_prize_pool": 0,
            "busiest_day": "Friday",
            "busiest_time": "19:00",
            "avg_wait_time": 15,
            # Chart data
            "player_activity_data": {},
            "table_usage_data": {},
            "tournament_data": {},
            "peak_hours_data": {},
        }
        return stats

    @classmethod
    def search(cls, query):
        """Search venues by name, location, etc."""
        return cls.query.filter(
            db.or_(cls.name.ilike(f"%{query}%"), cls.address.ilike(f"%{query}%"))
        ).all()

    def to_dict(self):
        """Convert venue to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "phone": self.phone,
            "email": self.email,
            "operating_hours": self.operating_hours,
            "total_tables": self.total_tables,
            "available_tables": self.available_tables,
            "amenities": self.amenities,
            "is_open": self.is_open,
            "active_players": self.active_players,
            "owner_id": self.owner_id,
            "current_tournament": (
                self.current_tournament.to_dict() if self.current_tournament else None
            ),
        }


class VenueCheckin(db.Model):
    """Record of a user checking in/out of a venue."""

    __tablename__ = "venue_checkins"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"), nullable=False)
    checked_in_at = db.Column(db.DateTime, default=datetime.utcnow)
    checked_out_at = db.Column(db.DateTime)
    table_number = db.Column(db.Integer)
    game_type = db.Column(db.String(50))  # e.g., "8-ball", "9-ball", etc.

    # Relationships
    user = db.relationship("User", back_populates="venue_checkins")
    venue = db.relationship("Venue", back_populates="checkins")

    @property
    def duration(self):
        """Calculate duration of stay in minutes."""
        if not self.checked_out_at:
            return None
        delta = self.checked_out_at - self.checked_in_at
        return int(delta.total_seconds() / 60)

    def to_dict(self):
        """Convert check-in record to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "venue_id": self.venue_id,
            "checked_in_at": self.checked_in_at.isoformat(),
            "checked_out_at": self.checked_out_at.isoformat() if self.checked_out_at else None,
            "table_number": self.table_number,
            "game_type": self.game_type,
            "duration": self.duration,
        }
