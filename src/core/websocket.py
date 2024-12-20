"""WebSocket event handlers for real-time chat functionality."""

from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_login import current_user
from datetime import datetime

from ..models import db, ChatMessage, ChatParticipant

# Initialize SocketIO with eventlet async mode
socketio = SocketIO(async_mode='eventlet', cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    if current_user.is_authenticated:
        emit('connect_response', {'status': 'connected', 'user_id': current_user.id})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    pass

@socketio.on('join')
def on_join(data):
    """Handle client joining a room."""
    room = data.get('room')
    if room:
        join_room(room)
        emit('status', {'msg': f'{current_user.username} has joined the room.'}, room=room)

@socketio.on('leave')
def on_leave(data):
    """Handle client leaving a room."""
    room = data.get('room')
    if room:
        leave_room(room)
        emit('status', {'msg': f'{current_user.username} has left the room.'}, room=room)

@socketio.on('message')
def handle_message(data):
    """Handle new message from client."""
    if not current_user.is_authenticated:
        return
        
    room_id = data.get('room')
    content = data.get('message')
    
    if not room_id or not content:
        return
        
    # Save message to database
    message = ChatMessage(
        room_id=room_id,
        sender_id=current_user.id,
        content=content
    )
    db.session.add(message)
    db.session.commit()
    
    # Broadcast message to room
    emit('message', {
        'room': room_id,
        'user': current_user.username,
        'message': content,
        'timestamp': datetime.utcnow().isoformat()
    }, room=room_id)

@socketio.on('typing')
def handle_typing(data):
    """Handle typing indicator."""
    room_id = data.get('room_id')
    is_typing = data.get('typing', False)
    
    if room_id:
        emit('typing', {
            'user': current_user.username,
            'typing': is_typing,
            'room_id': room_id
        }, room=f'room_{room_id}', include_self=False) 