from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from ..models import db

class Friendship(db.Model):
    __tablename__ = 'friendships'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    friend_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    status = Column(Enum('pending', 'accepted', 'blocked', name='friendship_status'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship('User', foreign_keys=[user_id], back_populates='friendships')
    friend = relationship('User', foreign_keys=[friend_id], back_populates='friend_of')

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sender = relationship('User', foreign_keys=[sender_id], back_populates='sent_messages')
    receiver = relationship('User', foreign_keys=[receiver_id], back_populates='received_messages')

class CommunityChallenge(db.Model):
    __tablename__ = 'community_challenges'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    requirements = Column(Text)
    reward_points = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    creator = relationship('User', back_populates='created_challenges')
    participants = relationship('ChallengeParticipant', back_populates='challenge')

class ChallengeParticipant(db.Model):
    __tablename__ = 'challenge_participants'
    
    id = Column(Integer, primary_key=True)
    challenge_id = Column(Integer, ForeignKey('community_challenges.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    status = Column(Enum('joined', 'in_progress', 'completed', 'failed', name='challenge_status'), nullable=False)
    progress_data = Column(Text)
    
    challenge = relationship('CommunityChallenge', back_populates='participants')
    user = relationship('User', back_populates='challenge_participations')

class SocialShare(db.Model):
    __tablename__ = 'social_shares'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content_type = Column(String(50), nullable=False)  # game, achievement, challenge, etc.
    content_id = Column(Integer, nullable=False)
    platform = Column(String(50), nullable=False)  # twitter, facebook, instagram, etc.
    share_text = Column(Text)
    media_url = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User', back_populates='social_shares') 