"""
Staff model for DojoPool.
"""

from dojopool.core.extensions import db
from dojopool.models.base import BaseModel


class StaffMember(BaseModel):
    """Staff member model for venue employees."""
    
    __tablename__ = 'staff_members'
    
    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    training_completed = db.Column(db.Boolean, default=False)
    training_date = db.Column(db.DateTime)
    schedule = db.Column(db.JSON)
    games_overseen = db.Column(db.Integer, default=0)
    tournaments_managed = db.Column(db.Integer, default=0)
    customer_rating = db.Column(db.Float, default=0.0)
    
    # Relationships
    venue = db.relationship('Venue', backref='staff_members')
    
    def __repr__(self):
        return f'<StaffMember(id={self.id}, name={self.full_name})>'
    
    @classmethod
    def get_by_venue(cls, venue_id):
        """Get all staff members for a venue."""
        return cls.query.filter_by(venue_id=venue_id, is_active=True).all()
