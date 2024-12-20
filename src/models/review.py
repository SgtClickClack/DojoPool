"""Review models for user reviews."""
from datetime import datetime
from src.core.database import db
from src.core.mixins import TimestampMixin

class Review(TimestampMixin, db.Model):
    """Model for user reviews."""
    
    __tablename__ = 'reviews'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    target_type = db.Column(db.String(50), nullable=False)  # venue, tournament, player, etc.
    target_id = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    title = db.Column(db.String(200))
    content = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')  # active, hidden, deleted
    
    # Relationships
    user = db.relationship('User', back_populates='reviews')
    responses = db.relationship('ReviewResponse', back_populates='review')
    reports = db.relationship('ReviewReport', back_populates='review')
    votes = db.relationship('ReviewVote', back_populates='review')

class ReviewResponse(TimestampMixin, db.Model):
    """Model for responses to reviews."""
    
    __tablename__ = 'review_responses'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='active')  # active, hidden, deleted
    
    # Relationships
    review = db.relationship('Review', back_populates='responses')
    user = db.relationship('User', back_populates='review_responses')

class ReviewReport(TimestampMixin, db.Model):
    """Model for review reports."""
    
    __tablename__ = 'review_reports'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.String(50), nullable=False)  # spam, inappropriate, misleading, etc.
    details = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, resolved, dismissed
    
    # Relationships
    review = db.relationship('Review', back_populates='reports')
    user = db.relationship('User', back_populates='review_reports')

class ReviewVote(TimestampMixin, db.Model):
    """Model for review votes."""
    
    __tablename__ = 'review_votes'
    __table_args__ = (
        db.UniqueConstraint('review_id', 'user_id', name='unique_review_vote'),
        {'extend_existing': True}
    )
    
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vote_type = db.Column(db.String(20), nullable=False)  # helpful, not_helpful
    
    # Relationships
    review = db.relationship('Review', back_populates='votes')
    user = db.relationship('User', back_populates='review_votes')
    
    __table_args__ = (
        db.UniqueConstraint('review_id', 'user_id', name='unique_review_vote'),
        {'extend_existing': True}
    ) 