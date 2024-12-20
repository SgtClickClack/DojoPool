"""Notification service for handling user notifications."""
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from src.core.database import db
from src.models import Notification, User

class NotificationService:
    """Service for managing user notifications."""
    
    @staticmethod
    def create_notification(user_id, title, message, notification_type='info', data=None):
        """Create a new notification for a user."""
        try:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                data=data
            )
            db.session.add(notification)
            db.session.commit()
            return notification
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def get_user_notifications(user_id, limit=10, unread_only=False):
        """Get notifications for a user."""
        query = Notification.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        return query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def mark_as_read(notification_id, user_id):
        """Mark a notification as read."""
        try:
            notification = Notification.query.filter_by(
                id=notification_id,
                user_id=user_id
            ).first()
            
            if notification:
                notification.is_read = True
                notification.read_at = datetime.utcnow()
                db.session.commit()
                return True
            return False
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def mark_all_as_read(user_id):
        """Mark all notifications as read for a user."""
        try:
            Notification.query.filter_by(
                user_id=user_id,
                is_read=False
            ).update({
                'is_read': True,
                'read_at': datetime.utcnow()
            })
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def delete_notification(notification_id, user_id):
        """Delete a notification."""
        try:
            notification = Notification.query.filter_by(
                id=notification_id,
                user_id=user_id
            ).first()
            
            if notification:
                db.session.delete(notification)
                db.session.commit()
                return True
            return False
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def delete_old_notifications(days=30):
        """Delete notifications older than specified days."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            Notification.query.filter(
                Notification.created_at < cutoff_date
            ).delete()
            db.session.commit()
            return True
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def get_unread_count(user_id):
        """Get count of unread notifications for a user."""
        return Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()
    
    @staticmethod
    def send_achievement_notification(user_id, achievement):
        """Send notification for achievement unlocked."""
        return NotificationService.create_notification(
            user_id=user_id,
            title='Achievement Unlocked!',
            message=f'You have unlocked the achievement: {achievement.name}',
            notification_type='achievement',
            data={'achievement_id': achievement.id}
        )
    
    @staticmethod
    def send_level_up_notification(user_id, new_level):
        """Send notification for level up."""
        return NotificationService.create_notification(
            user_id=user_id,
            title='Level Up!',
            message=f'Congratulations! You have reached level {new_level}',
            notification_type='level_up',
            data={'level': new_level}
        )
    
    @staticmethod
    def send_friend_request_notification(user_id, from_user):
        """Send notification for friend request."""
        return NotificationService.create_notification(
            user_id=user_id,
            title='New Friend Request',
            message=f'{from_user.username} sent you a friend request',
            notification_type='friend_request',
            data={'from_user_id': from_user.id}
        )
    
    @staticmethod
    def send_tournament_invite_notification(user_id, tournament):
        """Send notification for tournament invitation."""
        return NotificationService.create_notification(
            user_id=user_id,
            title='Tournament Invitation',
            message=f'You have been invited to join {tournament.name}',
            notification_type='tournament_invite',
            data={'tournament_id': tournament.id}
        ) 