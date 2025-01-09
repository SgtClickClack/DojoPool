"""Location model for physical locations."""
from datetime import datetime
from ..core.database import db
from ..core.mixins import TimestampMixin

class Location(TimestampMixin, db.Model):
    """Model for physical locations."""
    
    __tablename__ = 'locations'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    country = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Operating hours stored as JSON
    operating_hours = db.Column(db.JSON)
    
    # Location amenities stored as JSON
    amenities = db.Column(db.JSON)
    
    # Relationships
    venues = db.relationship('Venue', back_populates='location')
    
    def __repr__(self):
        """String representation of the location."""
        return f'<Location {self.name}>'
    
    def to_dict(self):
        """Convert location to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'postal_code': self.postal_code,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'operating_hours': self.operating_hours,
            'amenities': self.amenities,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @staticmethod
    def from_dict(data):
        """Create location from dictionary."""
        return Location(
            name=data.get('name'),
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state'),
            country=data.get('country'),
            postal_code=data.get('postal_code'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            operating_hours=data.get('operating_hours', {}),
            amenities=data.get('amenities', {})
        )
    
    def update_hours(self, hours):
        """Update operating hours."""
        self.operating_hours = hours
        db.session.commit()
    
    def update_amenities(self, amenities):
        """Update location amenities."""
        if not self.amenities:
            self.amenities = {}
        self.amenities.update(amenities)
        db.session.commit()
    
    def deactivate(self):
        """Deactivate the location."""
        self.status = 'inactive'
        db.session.commit()
    
    def reactivate(self):
        """Reactivate the location."""
        self.status = 'active'
        db.session.commit() 