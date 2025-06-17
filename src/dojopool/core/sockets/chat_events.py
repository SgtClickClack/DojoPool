"""WebSocket event handlers for chat rooms and group chat."""

from flask_login import current_user
from flask_socketio import emit, join_room, leave_room
from dojopool.models import db
from dojopool.models.chat import ChatRoom, ChatMessage, ChatParticipant
from dojopool.core.extensions import socketio
from datetime import datetime
from dojopool.story.story_engine import story_engine
from dojopool.story.npc_chatbot import npc_chatbot

@socketio.on("join_chat_room")
def handle_join_chat_room(data):
    if not current_user.is_authenticated:
        return False
    room_id = data.get("room_id")
    if not room_id:
        emit("error", {"message": "room_id required"})
        return
    join_room(f"chat_{room_id}")
    emit("joined_chat_room", {"room_id": room_id})
    # NPC welcome message (story-driven)
    npc_chatbot.send_npc_message_to_room(room_id, template_key="npc_welcome", player_id=current_user.id, extra_context={"base_message": "Welcome to the Dojo!"})

@socketio.on("leave_chat_room")
def handle_leave_chat_room(data):
    if not current_user.is_authenticated:
        return False
    room_id = data.get("room_id")
    if not room_id:
        emit("error", {"message": "room_id required"})
        return
    leave_room(f"chat_{room_id}")
    emit("left_chat_room", {"room_id": room_id})

@socketio.on("chat_message")
def handle_chat_message(data):
    if not current_user.is_authenticated:
        return False
    room_id = data.get("room_id")
    content = data.get("content")
    if not room_id or not content:
        emit("error", {"message": "room_id and content required"})
        return
    # Check if user is a participant
    participant = ChatParticipant.query.filter_by(room_id=room_id, user_id=current_user.id).first()
    if not participant:
        emit("error", {"message": "Not a participant in this room"})
        return
    # Enrich message with story context
    enriched_content = story_engine.enrich_chat_message(current_user.id, content, {"room_id": room_id})
    # Save message
    message = ChatMessage(room_id=room_id, user_id=current_user.id, content=enriched_content, created_at=datetime.utcnow())
    db.session.add(message)
    db.session.commit()
    # Broadcast to room
    emit(
        "chat_message",
        {
            "room_id": room_id,
            "user_id": current_user.id,
            "content": enriched_content,
            "created_at": message.created_at.isoformat(),
        },
        room=f"chat_{room_id}"
    )
