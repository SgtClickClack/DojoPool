from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from ..models import db

class Sponsor(db.Model):
    __tablename__ = 'sponsors'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    logo_url = Column(String(500))
    website = Column(String(500))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    status = Column(String(50), default='active')  # active, inactive, pending
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    deals = relationship('SponsorshipDeal', back_populates='sponsor')

class SponsorshipTier(db.Model):
    __tablename__ = 'sponsorship_tiers'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # bronze, silver, gold, platinum
    description = Column(Text)
    price = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False)
    benefits = Column(Text)  # JSON string of benefits
    max_sponsors = Column(Integer)  # Maximum number of sponsors allowed at this tier
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    deals = relationship('SponsorshipDeal', back_populates='tier')

class SponsorshipDeal(db.Model):
    __tablename__ = 'sponsorship_deals'
    
    id = Column(Integer, primary_key=True)
    sponsor_id = Column(Integer, ForeignKey('sponsors.id'), nullable=False)
    tier_id = Column(Integer, ForeignKey('sponsorship_tiers.id'), nullable=False)
    venue_id = Column(Integer, ForeignKey('venues.id'), nullable=True)  # Optional venue-specific sponsorship
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False)  # active, expired, cancelled
    payment_status = Column(String(50), nullable=False)  # paid, pending, failed
    stripe_payment_id = Column(String(255))
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sponsor = relationship('Sponsor', back_populates='deals')
    tier = relationship('SponsorshipTier', back_populates='deals')
    venue = relationship('Venue', back_populates='sponsorship_deals') 