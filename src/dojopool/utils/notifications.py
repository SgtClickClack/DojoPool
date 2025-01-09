from src.extensions import socketio, cache
from flask_socketio import join_room, leave_room
from flask_login import current_user
from functools import wraps
from flask import current_app
import json
import time

class NotificationManager:
    """Manage real-time notifications"""
    
    @staticmethod
    def emit_notification(user_id, notification_type, data):
        """
        Emit a notification to a specific user
        :param user_id: Target user ID
        :param notification_type: Type of notification
        :param data: Notification data
        """
        notification = {
            'type': notification_type,
            'data': data,
            'timestamp': time.time()
        }
        
        # Emit to user's room
        socketio.emit(
            'notification',
            notification,
            room=f'user_{user_id}'
        )
        
        # Cache recent notifications
        NotificationManager.cache_notification(user_id, notification)
    
    @staticmethod
    def emit_game_update(game_id, update_type, data):
        """
        Emit a game update to all players in a game
        :param game_id: Game ID
        :param update_type: Type of update
        :param data: Update data
        """
        update = {
            'type': update_type,
            'data': data,
            'timestamp': time.time()
        }
        
        socketio.emit(
            'game_update',
            update,
            room=f'game_{game_id}'
        )
    
    @staticmethod
    def emit_venue_update(venue_id, update_type, data):
        """
        Emit a venue update to all users at a venue
        :param venue_id: Venue ID
        :param update_type: Type of update
        :param data: Update data
        """
        update = {
            'type': update_type,
            'data': data,
            'timestamp': time.time()
        }
        
        socketio.emit(
            'venue_update',
            update,
            room=f'venue_{venue_id}'
        )
    
    @staticmethod
    def cache_notification(user_id, notification):
        """
        Cache recent notifications for a user
        :param user_id: User ID
        :param notification: Notification data
        """
        cache_key = f'notifications:{user_id}'
        notifications = cache.get(cache_key) or []
        notifications.append(notification)
        
        # Keep only last 50 notifications
        if len(notifications) > 50:
            notifications = notifications[-50:]
        
        cache.set(cache_key, notifications, timeout=86400)  # 24 hours
    
    @staticmethod
    def get_recent_notifications(user_id):
        """
        Get recent notifications for a user
        :param user_id: User ID
        :return: List of recent notifications
        """
        cache_key = f'notifications:{user_id}'
        return cache.get(cache_key) or []

def handle_socket_events():
    """Register socket event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        if current_user.is_authenticated:
            # Join user's personal room
            join_room(f'user_{current_user.id}')
    
    @socketio.on('join_game')
    def handle_join_game(game_id):
        """Handle joining a game room"""
        join_room(f'game_{game_id}')
    
    @socketio.on('leave_game')
    def handle_leave_game(game_id):
        """Handle leaving a game room"""
        leave_room(f'game_{game_id}')
    
    @socketio.on('join_venue')
    def handle_join_venue(venue_id):
        """Handle joining a venue room"""
        join_room(f'venue_{venue_id}')
    
    @socketio.on('leave_venue')
    def handle_leave_venue(venue_id):
        """Handle leaving a venue room"""
        leave_room(f'venue_{venue_id}')

def with_notifications(notification_type):
    """
    Decorator to automatically emit notifications
    :param notification_type: Type of notification to emit
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)
            
            # Extract user_id and data from result
            if isinstance(result, tuple):
                data, user_id = result
            else:
                data, user_id = result, None
            
            if user_id:
                NotificationManager.emit_notification(
                    user_id,
                    notification_type,
                    data
                )
            
            return result
        return decorated_function
    return decorator
