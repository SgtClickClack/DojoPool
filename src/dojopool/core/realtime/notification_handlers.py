"""WebSocket handlers for real-time notifications."""
from flask_socketio import emit, join_room, leave_room
from flask_login import current_user

from src import socketio
from src.services.notification_service import NotificationService

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    if current_user.is_authenticated:
        # Join user's personal notification room
        room = f'user_{current_user.id}_notifications'
        join_room(room)
        emit('connection_status', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    if current_user.is_authenticated:
        # Leave user's personal notification room
        room = f'user_{current_user.id}_notifications'
        leave_room(room)

def send_notification(user_id, notification):
    """Send a notification to a specific user."""
    room = f'user_{user_id}_notifications'
    emit('new_notification', notification.to_dict(), room=room)

def send_tournament_update(tournament_id, update_type, data):
    """Send a tournament update to all participants."""
    room = f'tournament_{tournament_id}'
    emit('tournament_update', {
        'type': update_type,
        'tournament_id': tournament_id,
        'data': data
    }, room=room)

@socketio.on('join_tournament')
def handle_join_tournament(data):
    """Handle joining a tournament room."""
    tournament_id = data.get('tournament_id')
    if tournament_id and current_user.is_authenticated:
        room = f'tournament_{tournament_id}'
        join_room(room)
        emit('room_joined', {'tournament_id': tournament_id})

@socketio.on('leave_tournament')
def handle_leave_tournament(data):
    """Handle leaving a tournament room."""
    tournament_id = data.get('tournament_id')
    if tournament_id and current_user.is_authenticated:
        room = f'tournament_{tournament_id}'
        leave_room(room)
        emit('room_left', {'tournament_id': tournament_id})
