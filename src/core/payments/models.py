from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from ..models import db

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    venue_id = Column(Integer, ForeignKey('venues.id'), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default='USD')
    stripe_payment_id = Column(String(255), unique=True)
    status = Column(String(50), nullable=False)
    payment_type = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship('User', back_populates='payments')
    venue = relationship('Venue', back_populates='payments')

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    stripe_subscription_id = Column(String(255), unique=True)
    plan_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    current_period_start = Column(DateTime, nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship('User', back_populates='subscriptions')

class PricingPlan(db.Model):
    __tablename__ = 'pricing_plans'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    stripe_price_id = Column(String(255), unique=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default='USD')
    interval = Column(String(20), nullable=False)  # monthly, yearly
    features = Column(String(500), nullable=False)  # JSON string of features
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow) 