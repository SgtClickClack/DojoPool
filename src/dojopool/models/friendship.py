"""Friendship model for user relationships."""
from datetime import datetime
from ..core.database import db
from ..core.mixins import TimestampMixin

class Friendship(TimestampMixin, db.Model):
    """Model for user friendships."""
    
    __tablename__ = 'friendships'
    __table_args__ = (
        # Ensure unique friendship pairs
        db.UniqueConstraint('user1_id', 'user2_id', name='unique_friendship'),
        # Prevent self-friendships
        db.CheckConstraint('user1_id != user2_id', name='no_self_friendship'),
        {'extend_existing': True}
    )
    
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, blocked
    action_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # User who took the last action
    
    # Relationships
    user1 = db.relationship('User', foreign_keys=[user1_id], back_populates='friendships_as_user1')
    user2 = db.relationship('User', foreign_keys=[user2_id], back_populates='friendships_as_user2')
    action_user = db.relationship('User', foreign_keys=[action_user_id], back_populates='friendship_actions')
    
    def __repr__(self):
        """String representation of the friendship."""
        return f'<Friendship {self.user1_id} -> {self.user2_id} ({self.status})>'
    
    def to_dict(self):
        """Convert friendship to dictionary."""
        return {
            'id': self.id,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @staticmethod
    def are_friends(user_id, friend_id):
        """Check if two users are friends."""
        return Friendship.query.filter(
            ((Friendship.user1_id == user_id) & (Friendship.user2_id == friend_id) |
             (Friendship.user1_id == friend_id) & (Friendship.user2_id == user_id)) &
            (Friendship.status == 'accepted')
        ).first() is not None
    
    @staticmethod
    def get_friendship_status(user_id, friend_id):
        """Get the friendship status between two users."""
        friendship = Friendship.query.filter(
            (Friendship.user1_id == user_id) & (Friendship.user2_id == friend_id) |
            (Friendship.user1_id == friend_id) & (Friendship.user2_id == user_id)
        ).first()
        return friendship.status if friendship else None 