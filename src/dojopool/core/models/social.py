"""Social models module."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import db
from .base import BaseModel

class Friendship(BaseModel):
    """Friendship model."""
    
    __tablename__ = 'friendships'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, blocked
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user1 = db.relationship('User', foreign_keys=[user1_id], backref=db.backref('friendships_initiated', lazy='dynamic'))
    user2 = db.relationship('User', foreign_keys=[user2_id], backref=db.backref('friendships_received', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Friendship {self.user1_id}:{self.user2_id}>'
    
    def accept(self):
        """Accept friendship request."""
        self.status = 'accepted'
        db.session.commit()
    
    def decline(self):
        """Decline friendship request."""
        self.status = 'declined'
        db.session.commit()
    
    def block(self):
        """Block friendship."""
        self.status = 'blocked'
        db.session.commit()

class ChatMessage(BaseModel):
    """Chat message model."""
    
    __tablename__ = 'chat_messages'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    read_at = db.Column(db.DateTime)
    
    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id], backref=db.backref('messages_sent', lazy='dynamic'))
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref=db.backref('messages_received', lazy='dynamic'))
    
    def __repr__(self):
        return f'<ChatMessage {self.sender_id}:{self.receiver_id}>'
    
    def mark_as_read(self):
        """Mark message as read."""
        self.is_read = True
        self.read_at = datetime.utcnow()
        db.session.commit()

class CommunityChallenge(BaseModel):
    """Community challenge model."""
    
    __tablename__ = 'community_challenges'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    challenge_type = db.Column(db.String(50), nullable=False)  # trick shot, high score, etc.
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    prize_pool = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='pending')  # pending, active, completed
    
    # Relationships
    creator = db.relationship('User', backref=db.backref('challenges_created', lazy='dynamic'))
    
    def __repr__(self):
        return f'<CommunityChallenge {self.title}>'
    
    def start(self):
        """Start the challenge."""
        self.status = 'active'
        db.session.commit()
    
    def end(self):
        """End the challenge."""
        self.status = 'completed'
        db.session.commit()

class ChallengeParticipant(BaseModel):
    """Challenge participant model."""
    
    __tablename__ = 'challenge_participants'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('community_challenges.id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Float, default=0.0)
    submission_url = db.Column(db.String(255))  # URL to video/image proof
    status = db.Column(db.String(20), default='registered')  # registered, submitted, verified
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    challenge = db.relationship('CommunityChallenge', backref=db.backref('participants', lazy='dynamic'))
    player = db.relationship('User', backref=db.backref('challenge_entries', lazy='dynamic'))
    
    def __repr__(self):
        return f'<ChallengeParticipant {self.challenge_id}:{self.player_id}>'
    
    def submit(self, score, submission_url):
        """Submit challenge entry.
        
        Args:
            score: Challenge score
            submission_url: URL to proof
        """
        self.score = score
        self.submission_url = submission_url
        self.status = 'submitted'
        db.session.commit()
    
    def verify(self):
        """Verify challenge submission."""
        self.status = 'verified'
        db.session.commit()
