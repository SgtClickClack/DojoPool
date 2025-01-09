"""Venue model module.

This module contains the Venue model for tracking pool venues.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.dialects.postgresql import JSONB
from .base import BaseModel, db

class Venue(BaseModel):
    """Venue model."""
    __tablename__ = 'venues'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200))
    city = db.Column(db.String(100))
    state = db.Column(db.String(50))
    country = db.Column(db.String(50))
    postal_code = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    website = db.Column(db.String(200))
    description = db.Column(db.Text)
    hours = db.Column(JSONB)
    amenities = db.Column(JSONB)
    tables = db.Column(JSONB)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    checkins = db.relationship('VenueCheckin', back_populates='venue', lazy='dynamic')
    
    def __init__(self, **kwargs):
        """Initialize venue."""
        super(Venue, self).__init__(**kwargs)
        self.hours = self.hours or {}
        self.amenities = self.amenities or {}
        self.tables = self.tables or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert venue to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'postal_code': self.postal_code,
            'phone': self.phone,
            'email': self.email,
            'website': self.website,
            'description': self.description,
            'hours': self.hours,
            'amenities': self.amenities,
            'tables': self.tables,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def get_active_venues(cls) -> List['Venue']:
        """Get all active venues."""
        return cls.query.filter_by(status='active').order_by(cls.name.asc()).all()
    
    @classmethod
    def get_venues_by_city(
        cls,
        city: str,
        state: Optional[str] = None,
        country: Optional[str] = None
    ) -> List['Venue']:
        """Get venues by city."""
        query = cls.query.filter_by(city=city, status='active')
        
        if state:
            query = query.filter_by(state=state)
        if country:
            query = query.filter_by(country=country)
        
        return query.order_by(cls.name.asc()).all()
    
    @classmethod
    def create_venue(
        cls,
        name: str,
        address: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        country: Optional[str] = None,
        postal_code: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        website: Optional[str] = None,
        description: Optional[str] = None,
        hours: Optional[Dict[str, Any]] = None,
        amenities: Optional[Dict[str, Any]] = None,
        tables: Optional[Dict[str, Any]] = None
    ) -> 'Venue':
        """Create a new venue."""
        venue = cls(
            name=name,
            address=address,
            city=city,
            state=state,
            country=country,
            postal_code=postal_code,
            phone=phone,
            email=email,
            website=website,
            description=description,
            hours=hours or {},
            amenities=amenities or {},
            tables=tables or {}
        )
        db.session.add(venue)
        db.session.commit()
        return venue
    
    def update_hours(self, hours: Dict[str, Any]) -> None:
        """Update venue hours."""
        self.hours = hours
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_amenities(self, amenities: Dict[str, Any]) -> None:
        """Update venue amenities."""
        self.amenities = amenities
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_tables(self, tables: Dict[str, Any]) -> None:
        """Update venue tables."""
        self.tables = tables
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def deactivate(self) -> None:
        """Deactivate the venue."""
        self.status = 'inactive'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def activate(self) -> None:
        """Activate the venue."""
        self.status = 'active'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    @classmethod
    def search_venues(
        cls,
        query: str,
        city: Optional[str] = None,
        state: Optional[str] = None,
        country: Optional[str] = None
    ) -> List['Venue']:
        """Search venues by name and location."""
        search = f"%{query}%"
        db_query = cls.query.filter(
            cls.name.ilike(search),
            cls.status == 'active'
        )
        
        if city:
            db_query = db_query.filter_by(city=city)
        if state:
            db_query = db_query.filter_by(state=state)
        if country:
            db_query = db_query.filter_by(country=country)
        
        return db_query.order_by(cls.name.asc()).all()

class VenueCheckin(BaseModel):
    """Venue check-in model."""
    __tablename__ = 'venue_checkins'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    checked_in_at = db.Column(db.DateTime, default=datetime.utcnow)
    checked_out_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    venue = db.relationship('Venue', back_populates='checkins')
    user = db.relationship('User', backref=db.backref('venue_checkins', lazy='dynamic'))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert check-in to dictionary."""
        return {
            'id': self.id,
            'venue_id': self.venue_id,
            'user_id': self.user_id,
            'checked_in_at': self.checked_in_at.isoformat() if self.checked_in_at else None,
            'checked_out_at': self.checked_out_at.isoformat() if self.checked_out_at else None,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

__all__ = ['Venue', 'VenueCheckin']