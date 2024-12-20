"""Notification model for user notifications."""
from datetime import datetime
from src.core.database import db
from src.core.mixins import TimestampMixin

class Notification(TimestampMixin, db.Model):
    """Model for user notifications."""
    
    __tablename__ = 'notifications'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # friend_request, game_invite, tournament_update, etc.
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    data = db.Column(db.JSON)  # Additional data specific to notification type
    status = db.Column(db.String(20), default='unread')  # unread, read, archived
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    read_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', back_populates='notifications')
    
    def __repr__(self):
        """String representation of the notification."""
        return f'<Notification {self.id} - {self.type}>'
    
    def mark_as_read(self):
        """Mark the notification as read."""
        self.status = 'read'
        self.read_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """Convert notification to dictionary."""
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'data': self.data,
            'status': self.status,
            'priority': self.priority,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
    
    @classmethod
    def create_notification(cls, user_id, type, title, message=None, data=None):
        """Create a new notification.
        
        Args:
            user_id: ID of the user to notify
            type: Type of notification (e.g., 'game_invite', 'match_update')
            title: Notification title
            message: Optional notification message
            data: Optional dictionary of additional data
            
        Returns:
            Notification: The created notification
        """
        notification = cls(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            data=data
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    
    @classmethod
    def get_user_notifications(cls, user_id, limit=10, unread_only=False):
        """Get recent notifications for a user.
        
        Args:
            user_id: ID of the user
            limit: Maximum number of notifications to return
            unread_only: Whether to return only unread notifications
            
        Returns:
            list: List of notifications
        """
        query = cls.query.filter_by(user_id=user_id)
        if unread_only:
            query = query.filter_by(status='unread')
        return query.order_by(cls.created_at.desc()).limit(limit).all()
    
    @classmethod
    def mark_all_as_read(cls, user_id):
        """Mark all notifications as read for a user.
        
        Args:
            user_id: ID of the user
        """
        now = datetime.utcnow()
        cls.query.filter_by(user_id=user_id, status='unread').update({
            'status': 'read',
            'read_at': now
        })
        db.session.commit()
    
    @classmethod
    def delete_old_notifications(cls, days=30):
        """Delete notifications older than specified days.
        
        Args:
            days: Number of days after which to delete notifications
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        cls.query.filter(cls.created_at < cutoff).delete()
        db.session.commit() 