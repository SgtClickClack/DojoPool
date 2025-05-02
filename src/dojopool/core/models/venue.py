"""Venue models module."""

from datetime import datetime, time, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple
from numbers import Number

from sqlalchemy import (
    JSON,
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Time,
    Enum as SQLEnum,
    func,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from sqlalchemy.sql import expression

from ..extensions import db
from ..validation import VenueValidator
from .base import BaseModel
from .staff import StaffMember
from dojopool.models.user import User
from dojopool.models.game import Game, GameStatus


class VenueEventType(Enum):
    """Venue event type enumeration."""

    TOURNAMENT = "tournament"
    LEAGUE = "league"
    SOCIAL = "social"
    TRAINING = "training"
    SPECIAL = "special"


class VenueEventStatus(Enum):
    """Venue event status enumeration."""

    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VenueEvent(db.Model):
    """Venue event model."""

    __tablename__ = "venue_events"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    event_type = Column(SQLEnum(VenueEventType), nullable=False)
    status = Column(SQLEnum(VenueEventStatus), default=VenueEventStatus.UPCOMING)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime)
    max_participants = Column(Integer)
    entry_fee = Column(Float)
    prize_pool = Column(Float)
    rules = Column(Text)
    details = Column(JSON)  # Additional event details

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = relationship("Venue", backref="events")
    participants = relationship("VenueEventParticipant", back_populates="event")

    def __repr__(self):
        return f"<VenueEvent {self.name} at {self.venue_id}>"

    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "venue_id": self.venue_id,
            "name": self.name,
            "description": self.description,
            "event_type": self.event_type.value if self.event_type is not None else None,
            "status": self.status.value if self.status is not None else None,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "registration_deadline": (
                self.registration_deadline.isoformat() if self.registration_deadline is not None else None
            ),
            "max_participants": self.max_participants,
            "entry_fee": self.entry_fee,
            "prize_pool": self.prize_pool,
            "rules": self.rules,
            "details": self.details,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def start(self):
        """Start the event."""
        if self.status == VenueEventStatus.UPCOMING: # type: ignore
            self.status = VenueEventStatus.ONGOING
            db.session.commit()

    def complete(self):
        """Complete the event."""
        if self.status == VenueEventStatus.ONGOING: # type: ignore
            self.status = VenueEventStatus.COMPLETED
            db.session.commit()

    def cancel(self):
        """Cancel the event."""
        if self.status != VenueEventStatus.COMPLETED: # type: ignore
            self.status = VenueEventStatus.CANCELLED
            db.session.commit()

    def is_registration_open(self):
        """Check if registration is open."""
        if self.status != VenueEventStatus.UPCOMING: # type: ignore
            return False

        if self.registration_deadline is not None:
            return datetime.utcnow() <= self.registration_deadline

        return True

    def is_full(self):
        """Check if event is full."""
        if self.max_participants is None:
            return False

        return self.participants.count() >= self.max_participants


class VenueEventParticipant(db.Model):
    """Venue event participant model."""

    __tablename__ = "venue_event_participants"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("venue_events.id"), nullable=False)
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
    event = relationship("VenueEvent", back_populates="participants")
    user = relationship(User, backref="event_participations")

    def __repr__(self):
        return f"<VenueEventParticipant {self.user_id} in {self.event_id}>"

    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "status": self.status,
            "checked_in_at": self.checked_in_at.isoformat() if self.checked_in_at is not None else None,
            "checked_out_at": self.checked_out_at.isoformat() if self.checked_out_at is not None else None,
            "placement": self.placement,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(), # type: ignore[union-attr]
            "updated_at": self.updated_at.isoformat(), # type: ignore[union-attr]
        }

    def check_in(self):
        """Check in participant."""
        if self.status == "registered": # type: ignore
            self.status = "checked_in"
            self.checked_in_at = datetime.utcnow()
            db.session.commit()

    def check_out(self):
        """Check out participant."""
        if self.status == "checked_in": # type: ignore
            self.status = "completed"
            self.checked_out_at = datetime.utcnow()
            db.session.commit()

    def cancel(self):
        """Cancel participation."""
        if self.status != "completed": # type: ignore
            self.status = "cancelled"
            db.session.commit()


class VenueEquipment:
    """Represents a piece of equipment in a venue."""

    def __init__(
        self,
        equipment_type: str,
        serial_number: str,
        installation_date: datetime,
        last_maintenance: Optional[datetime] = None,
        status: str = "active",
    ):
        self.type = equipment_type
        self.serial_number = serial_number
        self.installation_date = installation_date
        self.last_maintenance = last_maintenance
        self.status = status
        self.maintenance_history: List[Dict] = []


class Venue(db.Model):
    """Represents a pool venue in the system."""

    __tablename__ = "venues"
    __table_args__ = {"extend_existing": True}

    # Basic fields
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    country = Column(String(50), nullable=False)
    postal_code = Column(String(20), nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    website = Column(String(255))

    # Capacity and equipment
    capacity = Column(Integer)  # Total venue capacity
    tables = Column(Integer)  # Number of pool tables
    table_rate = Column(Float)  # Hourly rate per table

    # Status and ratings
    rating = Column(Float)  # Average rating
    review_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    status = Column(String(20), default="active")  # active, maintenance, closed

    # Location
    latitude = Column(Float)
    longitude = Column(Float)

    # Media and links
    photos = Column(JSON)  # List of photo URLs
    social_links = Column(JSON)  # Social media links
    featured_image = Column(String(255))  # Main venue image
    virtual_tour = Column(String(255))  # Virtual tour URL

    # Additional info
    hours_data = Column(JSON)  # Operating hours data
    amenities_summary = Column(JSON)  # Quick access to available amenities
    rules = Column(Text)  # Venue rules and policies
    notes = Column(Text)  # Internal notes

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    checkins = relationship("VenueCheckIn", back_populates="venue")
    operating_hours = relationship("VenueOperatingHours", back_populates="venue")
    amenities = relationship("VenueAmenity", back_populates="venue")
    leaderboard_entries = relationship("VenueLeaderboard", back_populates="venue")
    games = relationship("Game", backref="venue")

    # Validation
    validator_class = VenueValidator

    def __init__(
        self,
        name: str,
        address: str,
        city: str,
        state: str,
        country: str,
        postal_code: str,
        tables: int,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        contact_email: Optional[str] = None,
        contact_phone: Optional[str] = None,
        status: str = "active",
    ):
        """Initialize venue."""
        self.name = name
        self.address = address
        self.city = city
        self.state = state
        self.country = country
        self.postal_code = postal_code
        self.tables = tables
        self.latitude = latitude
        self.longitude = longitude
        self.email = contact_email
        self.phone = contact_phone
        self.status = status
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

        # Onboarding fields
        self.verification_date: Optional[datetime] = None
        self.verification_notes: Optional[str] = None
        self.equipment_setup_date: Optional[datetime] = None
        self.staff_training_date: Optional[datetime] = None
        self.integration_test_date: Optional[datetime] = None
        self.activation_date: Optional[datetime] = None

        # Equipment and staff
        self.equipment: List[VenueEquipment] = []
        self.trained_staff: List[StaffMember] = []

        # API and integration
        self.api_key: Optional[str] = None
        self.test_results: Dict = {}

        # Analytics and metrics
        self.total_games: int = 0
        self.active_games: int = 0
        self.revenue: float = 0.0
        self.reviews: List[Dict] = []

    @classmethod
    def get(cls, venue_id: str) -> Optional["Venue"]:
        """Get a venue by ID."""
        # Implement database retrieval
        return None

    @classmethod
    def get_all(cls) -> List["Venue"]:
        """Get all venues."""
        # Implement database retrieval
        return []

    def save(self) -> bool:
        """Save venue to database."""
        try:
            # Implement database save
            return True
        except Exception:
            return False

    def add_equipment(self, equipment: VenueEquipment) -> bool:
        """Add a piece of equipment to the venue."""
        try:
            self.equipment.append(equipment)
            return True
        except Exception:
            return False

    def add_staff_member(self, staff: StaffMember) -> bool:
        """Add a staff member to the venue."""
        try:
            self.trained_staff.append(staff)
            return True
        except Exception:
            return False

    def update_status(self, new_status: str) -> bool:
        """Update venue status."""
        try:
            self.status = new_status
            return True
        except Exception:
            return False

    def get_analytics(self) -> Dict:
        """Get venue analytics data."""
        return {
            "total_games": self.total_games,
            "active_games": self.active_games,
            "revenue": self.revenue,
            "rating": self.rating,
            "num_reviews": len(self.reviews),
            "equipment_status": self._get_equipment_status(),
            "staff_coverage": self._get_staff_coverage(),
        }

    def _get_equipment_status(self) -> Dict:
        """Get status of all equipment."""
        status_counts = {}
        for eq in self.equipment:
            status_counts[eq.status] = status_counts.get(eq.status, 0) + 1
        return status_counts

    def _get_staff_coverage(self) -> Dict:
        """Get staff coverage metrics."""
        return {
            "total_staff": len(self.trained_staff),
            "active_staff": sum(1 for s in self.trained_staff if getattr(s, "is_active", False)),
            "training_completion": (
                sum(1 for s in self.trained_staff if getattr(s, "training_completed", False)) / len(self.trained_staff)
                if self.trained_staff
                else 0.0
            ),
        }

    def __repr__(self):
        return f"<Venue {self.name}>"
    @hybrid_property 
    def average_rating(self):
        """Get calculated average rating."""
        # Instance-level access
        if not hasattr(self, 'rating') or self.rating is None:
            return None
        # Ensure it's a number before rounding
        if not isinstance(self.rating, Number):
             # This case might indicate an issue or direct class-level access attempt
             # without the expression. Handle appropriately.
             # Returning None or raising an error might be suitable.
            return None # Or raise TypeError("Rating is not a number")
        # Cast to float before rounding for instance access
        return round(float(self.rating), 1) # type: ignore[arg-type]

    @average_rating.expression
    def average_rating(cls): # pylint: disable=function-redefined
        """Provide SQL expression for average rating."""
        # Class-level expression for queries
        # Use case to handle potential NULLs or 0 review_count if necessary
        # Simplified version: just round the rating column
        return func.round(cls.rating, 1)

    @hybrid_property
    def is_open(self):
        """Check if venue is currently open."""
        current_time = datetime.now()
        current_day = current_time.weekday()
        hours = self.operating_hours.filter_by(day_of_week=current_day).first()
        return hours and hours.is_open(current_time.time())

    def get_available_tables(self, start_time=None, duration=None):
        """Get number of available tables.

        Args:
            start_time: Start time to check (defaults to current time)
            duration: Duration in hours

        Returns:
            int: Number of available tables
        """
        start_time = start_time or datetime.now()

        # Get active games during the period using started_at and completed_at
        active_games_query = self.games.filter(
            Game.status == GameStatus.IN_PROGRESS # type: ignore[attr-defined]
        )

        # Add time-based filtering if duration is provided or implicitly needed
        if duration is not None:
            end_check_time = start_time + timedelta(hours=duration)
            active_games_query = active_games_query.filter(
                db.or_(
                    # Game started before the period ends AND is not completed OR completed after the period starts
                    db.and_(
                        Game.started_at <= end_check_time, # type: ignore[attr-defined]
                        db.or_(
                            Game.completed_at == None, # type: ignore[attr-defined]
                            Game.completed_at >= start_time # type: ignore[attr-defined]
                        )
                    ),
                    # Game started within the period
                    db.and_(
                         Game.started_at >= start_time, # type: ignore[attr-defined]
                         Game.started_at <= end_check_time # type: ignore[attr-defined]
                    )
                )
            )
        else:
             # If no duration, check games currently in progress that started before now
             # and are either not completed or completed after now.
             # This logic might need refinement based on exact requirements for "available now".
             # Let's assume we just count IN_PROGRESS games for simplicity if no duration given.
             # The initial filter on IN_PROGRESS already handles this simpler case.
             pass # Keep the IN_PROGRESS filter only


        active_games = active_games_query.count()


        return self.tables - active_games # type: ignore[operator]

    def deactivate(self, reason=None):
        """Deactivate venue.

        Args:
            reason: Deactivation reason
        """
        self.is_active = False
        self.status = "closed"
        if reason:
            self.notes = reason
        db.session.commit()

    def activate(self):
        """Activate venue."""
        self.is_active = True
        self.status = "active"
        db.session.commit()

    def update_rating(self, new_rating):
        """Update venue rating.

        Args:
            new_rating: New rating value
        """
        if self.rating is None:
            self.rating = new_rating
            self.review_count = 1
        else:
            total = self.rating * self.review_count
            self.review_count += 1
            self.rating = (total + new_rating) / self.review_count
        db.session.commit()

    def add_photo(self, photo_url, is_featured=False):
        """Add photo to venue.

        Args:
            photo_url: URL of photo
            is_featured: Whether to set as featured image
        """
        if self.photos is None: # type: ignore
            self.photos = []
        self.photos.append(photo_url) # type: ignore
        if is_featured:
            self.featured_image = photo_url
        db.session.commit()

    def remove_photo(self, photo_url):
        """Remove photo from venue.

        Args:
            photo_url: URL of photo to remove
        """
        if isinstance(self.photos, list) and photo_url in self.photos: # type: ignore
            self.photos.remove(photo_url) # type: ignore
            if self.featured_image == photo_url: # type: ignore
                self.featured_image = self.photos[0] if self.photos else None # type: ignore
            db.session.commit()

    def update_amenities_summary(self):
        """Update amenities summary."""
        self.amenities_summary = {amenity.name: amenity.is_available for amenity in self.amenities}
        db.session.commit()

    @classmethod
    def search(cls, query=None, city=None, state=None, is_active=True):
        """Search venues.

        Args:
            query: Search query
            city: City filter
            state: State filter
            is_active: Active status filter

        Returns:
            list: Matching venues
        """
        filters = [cls.is_active == is_active] if is_active is not None else []

        if query:
            filters.append(
                db.or_(Venue.name.ilike(f"%{query}%"), Venue.description.ilike(f"%{query}%")) # type: ignore[attr-defined]
            )

        if city:
            filters.append(Venue.city.ilike(f"%{city}%")) # type: ignore[attr-defined]

        if state:
            filters.append(Venue.state.ilike(f"%{state}%")) # type: ignore[attr-defined]

        # Ensure filters list contains valid SQLAlchemy expressions
        valid_filters = [f for f in filters if f is not None]
        return cls.query.filter(*valid_filters).all() # type: ignore[arg-type]


class VenueCheckIn(db.Model):
    """Venue check-in model."""

    __tablename__ = "venue_checkins"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    checked_in_at = Column(DateTime, default=datetime.utcnow)
    checked_out_at = Column(DateTime)
    table_number = Column(Integer)
    game_type = Column(String(50))  # e.g., "8-ball", "9-ball", etc.

    # Relationships
    venue = relationship("Venue", back_populates="checkins")
    user = relationship(User, backref="venue_checkins")

    def __repr__(self):
        return f"<VenueCheckIn {self.user_id} at {self.venue_id}>"

    @property
    def duration(self):
        """Calculate duration of stay in minutes."""
        if self.checked_out_at is None or self.checked_in_at is None:
            return None
        delta = self.checked_out_at - self.checked_in_at
        return int(delta.total_seconds() / 60)


class VenueLeaderboard(db.Model):
    """Venue leaderboard model."""

    __tablename__ = "venue_leaderboards"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    highest_streak = Column(Integer, default=0)
    last_played = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = relationship("Venue", back_populates="leaderboard_entries")
    user = relationship(User, backref="venue_leaderboard_entries")

    def __repr__(self):
        return f"<VenueLeaderboard {self.user_id} at {self.venue_id}>"

    def to_dict(self):
        """Convert to dictionary representation."""
        last_played_iso = None
        if self.last_played is not None:
            last_played_iso = self.last_played.isoformat()
        return {
            "id": self.id,
            "venue_id": self.venue_id,
            "user_id": self.user_id,
            "points": self.points,
            "wins": self.wins,
            "losses": self.losses,
            "current_streak": self.current_streak,
            "highest_streak": self.highest_streak,
            "last_played": last_played_iso,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class VenueAmenity(db.Model):
    """Venue amenity model."""

    __tablename__ = "venue_amenities"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    name = Column(String(100), nullable=False)  # parking, food, bar, etc.
    description = Column(Text)
    icon = Column(String(50))  # Icon identifier
    is_available = Column(Boolean, default=True)
    details = Column(JSON)  # Additional amenity details
    price = Column(Float)  # Price if amenity is paid
    schedule = Column(JSON)  # Availability schedule
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = relationship("Venue", back_populates="amenities")

    # Validation
    validator_class = VenueValidator

    def __repr__(self):
        return f"<VenueAmenity {self.venue_id}:{self.name}>"

    def set_availability(self, is_available, reason=None):
        """Set amenity availability.

        Args:
            is_available: Availability status
            reason: Reason for change
        """
        self.is_available = is_available
        if reason:
            self.notes = reason
        self.venue.update_amenities_summary()
        db.session.commit()

    def update_schedule(self, schedule_data):
        """Update amenity schedule.

        Args:
            schedule_data: New schedule data
        """
        self.schedule = schedule_data
        db.session.commit()

    def is_available_at(self, check_time=None):
        """Check if amenity is available at given time.

        Args:
            check_time: Time to check (defaults to current time)

        Returns:
            bool: True if available
        """
        if not self.is_available or self.schedule is None: # type: ignore
            return False

        check_time = check_time or datetime.now()
        if not isinstance(self.schedule, dict):
            return False
        day_schedule = self.schedule.get(str(check_time.weekday()))

        if not day_schedule or not isinstance(day_schedule, list):
            return False

        current_time_obj = check_time.time()
        return any(
            isinstance(slot, dict) and
            'start' in slot and 'end' in slot and
            time.fromisoformat(slot["start"]) <= current_time_obj <= time.fromisoformat(slot["end"])
            for slot in day_schedule
        )


class VenueOperatingHours(db.Model):
    """Venue operating hours model."""

    __tablename__ = "venue_operating_hours"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    open_time = Column(Time, nullable=False)
    close_time = Column(Time, nullable=False)
    is_closed = Column(Boolean, default=False)
    special_hours = Column(Boolean, default=False)  # For holidays, events, etc.
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = relationship("Venue", back_populates="operating_hours")

    # Validation
    validator_class = VenueValidator

    def __repr__(self):
        return f"<VenueOperatingHours {self.venue_id}:{self.day_of_week}>"

    @hybrid_property
    def is_24h(self):
        """Check if venue is open 24 hours."""
        return self.open_time == time(0, 0) and self.close_time == time(23, 59) # type: ignore

    @hybrid_property
    def duration(self):
        """Get operating duration in hours."""
        if self.is_closed: # type: ignore
            return 0

        # Check if times are actual time objects before combining
        if not isinstance(self.open_time, time) or not isinstance(self.close_time, time): # type: ignore
             # Handle case where times might not be loaded or are column objects
             # This might occur during class-level access without an expression
             return 0 # Or raise an error, or return None

        open_dt = datetime.combine(datetime.today(), self.open_time)
        close_dt = datetime.combine(datetime.today(), self.close_time)

        if close_dt < open_dt:
            close_dt += timedelta(days=1)

        delta = close_dt - open_dt
        return delta.total_seconds() / 3600

    def is_open(self, current_time=None):
        """Check if venue is open at given time.

        Args:
            current_time: Time to check (defaults to current time)

        Returns:
            bool: True if venue is open
        """
        if self.is_closed: # type: ignore
            return False

        current_time_obj = current_time or datetime.now().time()

        if self.is_24h: # type: ignore
            return True

        if self.open_time <= self.close_time: # type: ignore
            return self.open_time <= current_time_obj <= self.close_time # type: ignore
        else:
            return current_time_obj >= self.open_time or current_time_obj <= self.close_time # type: ignore

    def set_hours(self, open_time, close_time, notes=None):
        """Set operating hours.

        Args:
            open_time: Opening time
            close_time: Closing time
            notes: Optional notes
        """
        self.open_time = open_time
        self.close_time = close_time
        if notes:
            self.notes = notes
        db.session.commit()

    def close(self, reason=None):
        """Mark venue as closed for the day.

        Args:
            reason: Closure reason
        """
        self.is_closed = True
        if reason:
            self.notes = reason
        db.session.commit()

    def open(self):
        """Mark venue as open for the day."""
        self.is_closed = False
        db.session.commit()

    def set_special_hours(self, is_special=True, notes=None):
        """Set special hours status.

        Args:
            is_special: Special hours status
            notes: Optional notes
        """
        self.special_hours = is_special
        if notes:
            self.notes = notes
        db.session.commit()

    @classmethod
    def get_current_status(cls, venue_id):
        """Get current operating status for venue.

        Args:
            venue_id: Venue ID

        Returns:
            dict: Operating status
        """
        current_datetime = datetime.now()
        current_time_obj = current_datetime.time()
        hours = cls.query.filter_by(venue_id=venue_id, day_of_week=current_datetime.weekday()).first()

        if hours is None:
            return {"status": "unknown"}

        is_open_now = hours.is_open(current_time_obj)
        next_change = None

        if hours.open_time is None or hours.close_time is None:
            return {"status": "error", "message": "Missing operating time data"}

        if is_open_now:
            next_change_dt = datetime.combine(current_datetime.date(), hours.close_time)
            if next_change_dt < current_datetime:
                next_change_dt += timedelta(days=1)
        else:
            next_change_dt = datetime.combine(current_datetime.date(), hours.open_time)
            if next_change_dt < current_datetime:
                next_change_dt += timedelta(days=1)
        next_change = next_change_dt.isoformat()

        return {
            "status": "open" if is_open_now else "closed",
            "next_change": next_change,
            "special_hours": hours.special_hours,
            "notes": hours.notes,
        }
