"""Venue models for pool venues."""
from datetime import datetime
from src.core.database import db
from src.core.mixins import TimestampMixin

class Venue(TimestampMixin, db.Model):
    """Model for pool venues."""
    
    __tablename__ = 'venues'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Venue details
    type = db.Column(db.String(50), default='pool_hall')  # pool_hall, bar, club, etc.
    status = db.Column(db.String(20), default='active')  # active, inactive, closed
    capacity = db.Column(db.Integer)  # Maximum number of players
    tables = db.Column(db.Integer)  # Number of pool tables
    amenities = db.Column(db.JSON)  # List of available amenities
    rules = db.Column(db.JSON)  # Venue-specific rules
    
    # Operating hours and availability
    hours = db.Column(db.JSON)  # Regular operating hours
    special_hours = db.Column(db.JSON)  # Special hours for holidays, events, etc.
    
    # Relationships
    location = db.relationship('Location', back_populates='venues')
    owner = db.relationship('User', back_populates='owned_venues')
    games = db.relationship('Game', back_populates='venue')
    tournaments = db.relationship('Tournament', back_populates='venue')
    availabilities = db.relationship('VenueAvailability', back_populates='venue')
    bookings = db.relationship('VenueBooking', back_populates='venue')
    matches = db.relationship('Match', back_populates='venue')

class VenueAvailability(TimestampMixin, db.Model):
    """Model for venue availability slots."""
    
    __tablename__ = 'venue_availabilities'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    capacity = db.Column(db.Integer)  # Available spots during this time
    status = db.Column(db.String(20), default='available')  # available, booked, blocked
    notes = db.Column(db.Text)
    
    # Relationships
    venue = db.relationship('Venue', back_populates='availabilities')
    bookings = db.relationship('VenueBooking', back_populates='availability')

class VenueBooking(TimestampMixin, db.Model):
    """Model for venue bookings."""
    
    __tablename__ = 'venue_bookings'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    availability_id = db.Column(db.Integer, db.ForeignKey('venue_availabilities.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), default='game')  # game, practice, tournament, event
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, cancelled
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    players = db.Column(db.Integer)  # Number of players for this booking
    notes = db.Column(db.Text)
    
    # Additional booking data stored as JSON
    data = db.Column(db.JSON)
    
    # Relationships
    venue = db.relationship('Venue', back_populates='bookings')
    availability = db.relationship('VenueAvailability', back_populates='bookings')
    user = db.relationship('User', back_populates='venue_bookings')