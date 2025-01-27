"""Venue models module."""

from datetime import datetime, time
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Time, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property

from ..database import db
from ..validation import VenueValidator
from .base import BaseModel

class Venue(BaseModel):
    """Venue model."""
    
    __tablename__ = 'venues'
    __table_args__ = {'extend_existing': True}
    
    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    website = db.Column(db.String(255))
    
    # Capacity and equipment
    capacity = db.Column(db.Integer)  # Total venue capacity
    tables = db.Column(db.Integer)  # Number of pool tables
    table_rate = db.Column(db.Float)  # Hourly rate per table
    
    # Status and ratings
    rating = db.Column(db.Float)  # Average rating
    review_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(20), default='active')  # active, maintenance, closed
    
    # Location
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Media and links
    photos = db.Column(db.JSON)  # List of photo URLs
    social_links = db.Column(db.JSON)  # Social media links
    featured_image = db.Column(db.String(255))  # Main venue image
    virtual_tour = db.Column(db.String(255))  # Virtual tour URL
    
    # Additional info
    amenities_summary = db.Column(db.JSON)  # Quick access to available amenities
    rules = db.Column(db.Text)  # Venue rules and policies
    notes = db.Column(db.Text)  # Internal notes
    
    # Validation
    validator_class = VenueValidator
    
    def __repr__(self):
        return f'<Venue {self.name}>'
    
    @hybrid_property
    def average_rating(self):
        """Get calculated average rating."""
        if not self.review_count:
            return None
        return round(self.rating, 1)
    
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
        
        # Get active games during the period
        active_games = self.games.filter(
            db.or_(
                db.and_(
                    Game.start_time <= start_time,
                    Game.end_time >= start_time
                ),
                db.and_(
                    Game.start_time >= start_time,
                    Game.start_time <= start_time + timedelta(hours=duration or 1)
                ) if duration else False
            )
        ).count()
        
        return self.tables - active_games
    
    def deactivate(self, reason=None):
        """Deactivate venue.
        
        Args:
            reason: Deactivation reason
        """
        self.is_active = False
        self.status = 'closed'
        if reason:
            self.notes = reason
        db.session.commit()
    
    def activate(self):
        """Activate venue."""
        self.is_active = True
        self.status = 'active'
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
        if not self.photos:
            self.photos = []
        self.photos.append(photo_url)
        if is_featured:
            self.featured_image = photo_url
        db.session.commit()
    
    def remove_photo(self, photo_url):
        """Remove photo from venue.
        
        Args:
            photo_url: URL of photo to remove
        """
        if self.photos and photo_url in self.photos:
            self.photos.remove(photo_url)
            if self.featured_image == photo_url:
                self.featured_image = self.photos[0] if self.photos else None
            db.session.commit()
    
    def update_amenities_summary(self):
        """Update amenities summary."""
        self.amenities_summary = {
            amenity.name: amenity.is_available
            for amenity in self.amenities
        }
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
            filters.append(db.or_(
                cls.name.ilike(f'%{query}%'),
                cls.description.ilike(f'%{query}%')
            ))
        
        if city:
            filters.append(cls.city.ilike(f'%{city}%'))
        
        if state:
            filters.append(cls.state.ilike(f'%{state}%'))
            
        return cls.query.filter(*filters).all()

class VenueAmenity(BaseModel):
    """Venue amenity model."""
    
    __tablename__ = 'venue_amenities'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # parking, food, bar, etc.
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))  # Icon identifier
    is_available = db.Column(db.Boolean, default=True)
    details = db.Column(db.JSON)  # Additional amenity details
    price = db.Column(db.Float)  # Price if amenity is paid
    schedule = db.Column(db.JSON)  # Availability schedule
    notes = db.Column(db.Text)
    
    # Relationships
    venue = db.relationship('Venue', backref=db.backref('amenities', lazy='dynamic'))
    
    # Validation
    validator_class = VenueValidator
    
    def __repr__(self):
        return f'<VenueAmenity {self.venue_id}:{self.name}>'
    
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
        if not self.is_available or not self.schedule:
            return False
            
        check_time = check_time or datetime.now()
        day_schedule = self.schedule.get(str(check_time.weekday()))
        
        if not day_schedule:
            return False
            
        check_time = check_time.time()
        return any(
            time.fromisoformat(slot['start']) <= check_time <= time.fromisoformat(slot['end'])
            for slot in day_schedule
        )

class VenueOperatingHours(BaseModel):
    """Venue operating hours model."""
    
    __tablename__ = 'venue_operating_hours'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday, 6=Sunday
    open_time = db.Column(db.Time, nullable=False)
    close_time = db.Column(db.Time, nullable=False)
    is_closed = db.Column(db.Boolean, default=False)
    special_hours = db.Column(db.Boolean, default=False)  # For holidays, events, etc.
    notes = db.Column(db.Text)
    
    # Relationships
    venue = db.relationship('Venue', backref=db.backref('operating_hours', lazy='dynamic'))
    
    # Validation
    validator_class = VenueValidator
    
    def __repr__(self):
        return f'<VenueOperatingHours {self.venue_id}:{self.day_of_week}>'
    
    @hybrid_property
    def is_24h(self):
        """Check if venue is open 24 hours."""
        return (
            self.open_time == time(0, 0) and
            self.close_time == time(23, 59)
        )
    
    @hybrid_property
    def duration(self):
        """Get operating duration in hours."""
        if self.is_closed:
            return 0
            
        open_dt = datetime.combine(datetime.today(), self.open_time)
        close_dt = datetime.combine(datetime.today(), self.close_time)
        
        if close_dt < open_dt:  # Handles case where venue is open past midnight
            close_dt += timedelta(days=1)
            
        return (close_dt - open_dt).total_seconds() / 3600
    
    def is_open(self, current_time=None):
        """Check if venue is open at given time.
        
        Args:
            current_time: Time to check (defaults to current time)
        
        Returns:
            bool: True if venue is open
        """
        if self.is_closed:
            return False
            
        current_time = current_time or datetime.now().time()
        
        if self.is_24h:
            return True
            
        if self.open_time <= self.close_time:
            return self.open_time <= current_time <= self.close_time
        else:  # Handles case where venue is open past midnight
            return current_time >= self.open_time or current_time <= self.close_time
    
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
        current_time = datetime.now()
        hours = cls.query.filter_by(
            venue_id=venue_id,
            day_of_week=current_time.weekday()
        ).first()
        
        if not hours:
            return {'status': 'unknown'}
            
        is_open = hours.is_open(current_time.time())
        next_change = None
        
        if is_open:
            next_change = datetime.combine(current_time.date(), hours.close_time)
            if next_change < current_time:
                next_change += timedelta(days=1)
        else:
            next_change = datetime.combine(current_time.date(), hours.open_time)
            if next_change < current_time:
                next_change += timedelta(days=1)
        
        return {
            'status': 'open' if is_open else 'closed',
            'next_change': next_change,
            'special_hours': hours.special_hours,
            'notes': hours.notes
        }
