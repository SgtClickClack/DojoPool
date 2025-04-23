"""Routes for chat room and group chat management."""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from dojopool.models.chat import ChatRoom, ChatMessage, ChatParticipant
from dojopool.models import db
from dojopool.story.seed_dojos import seed_dojos
from datetime import datetime
import jwt
from dojopool.models.venue import Venue
from dojopool.models.venue_checkin import VenueCheckIn

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@chat_bp.route("/rooms", methods=["GET"])
@login_required
def list_rooms():
    """List all chat rooms the user participates in."""
    rooms = (
        db.session.query(ChatRoom)
        .join(ChatParticipant)
        .filter(ChatParticipant.user_id == current_user.id)
        .all()
    )
    return jsonify([{"id": r.id, "name": r.name, "description": r.description} for r in rooms])

@chat_bp.route("/rooms", methods=["POST"])
@login_required
def create_room():
    """Create a new chat room."""
    data = request.json
    name = data.get("name")
    description = data.get("description", "")
    is_private = data.get("is_private", False)
    if not name:
        return jsonify({"error": "Room name required"}), 400
    room = ChatRoom(name=name, description=description, is_private=is_private)
    db.session.add(room)
    db.session.commit()
    # Add creator as admin participant
    participant = ChatParticipant(room_id=room.id, user_id=current_user.id, is_admin=True)
    db.session.add(participant)
    db.session.commit()
    return jsonify({"id": room.id, "name": room.name, "description": room.description}), 201

@chat_bp.route("/rooms/<int:room_id>/join", methods=["POST"])
@login_required
def join_room(room_id):
    """Join a chat room."""
    room = ChatRoom.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    # Check if already a participant
    existing = ChatParticipant.query.filter_by(room_id=room_id, user_id=current_user.id).first()
    if existing:
        return jsonify({"message": "Already joined"})
    participant = ChatParticipant(room_id=room_id, user_id=current_user.id)
    db.session.add(participant)
    db.session.commit()
    return jsonify({"message": "Joined room"})

@chat_bp.route("/rooms/<int:room_id>/messages", methods=["GET"])
@login_required
def get_room_messages(room_id):
    """Get messages for a chat room."""
    room = ChatRoom.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    # Only allow if participant
    participant = ChatParticipant.query.filter_by(room_id=room_id, user_id=current_user.id).first()
    if not participant:
        return jsonify({"error": "Not a participant"}), 403
    messages = ChatMessage.query.filter_by(room_id=room_id).order_by(ChatMessage.created_at.asc()).all()
    return jsonify([
        {
            "id": m.id,
            "user_id": m.user_id,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ])

@chat_bp.route("/rooms/<int:room_id>/messages", methods=["POST"])
@login_required
def send_room_message(room_id):
    """Send a message to a chat room."""
    room = ChatRoom.query.get(room_id)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    participant = ChatParticipant.query.filter_by(room_id=room_id, user_id=current_user.id).first()
    if not participant:
        return jsonify({"error": "Not a participant"}), 403
    data = request.json
    content = data.get("content")
    if not content:
        return jsonify({"error": "Message content required"}), 400
    message = ChatMessage(room_id=room_id, user_id=current_user.id, content=content)
    db.session.add(message)
    db.session.commit()
    return jsonify({"id": message.id, "user_id": message.user_id, "content": message.content, "created_at": message.created_at.isoformat()}), 201

@chat_bp.route("/dojos", methods=["GET"])
def list_dojos():
    """List all real venues (dojos) with chat rooms."""
    dojos = ChatRoom.query.filter_by(is_dojo=True).all()
    return jsonify([
        {
            "id": dojo.id,
            "name": dojo.name,
            "venue_id": dojo.venue_id,
            "place_id": dojo.place_id,
            "address": dojo.address,
            "latitude": dojo.latitude,
            "longitude": dojo.longitude,
            "venue_owner_id": dojo.venue_owner_id,
            "description": dojo.description,
        }
        for dojo in dojos
    ])

@chat_bp.route("/dojos/<int:dojo_id>/participants", methods=["GET"])
def list_dojo_participants(dojo_id):
    """List all users currently checked-in to a venue (dojo) for chat/social display."""
    dojo = ChatRoom.query.filter_by(id=dojo_id, is_dojo=True).first()
    if not dojo or not dojo.venue_id:
        return jsonify([])
    checkins = VenueCheckIn.query.filter_by(venue_id=dojo.venue_id, checked_out_at=None).all()
    return jsonify([
        {
            "user_id": c.user_id,
            # Optionally add avatar/profile info here
        }
        for c in checkins
    ])

@chat_bp.route("/dojos/<int:dojo_id>/join", methods=["POST"])
def join_dojo(dojo_id):
    """Check in to a real venue (dojo) and join its chat room."""
    token = request.headers.get('Authorization')
    if token:
        try:
            user_id = jwt.decode(token, options={"verify_signature": False})['sub']
        except:
            return jsonify({"error": "Invalid token"}), 401
    else:
        return jsonify({"error": "Not authenticated"}), 401
    dojo = ChatRoom.query.filter_by(id=dojo_id, is_dojo=True).first()
    if not dojo or not dojo.venue_id:
        return jsonify({"error": "Dojo not found"}), 404
    # Check-in logic: create VenueCheckIn if not already checked in
    existing = VenueCheckIn.query.filter_by(venue_id=dojo.venue_id, user_id=user_id, checked_out_at=None).first()
    if not existing:
        checkin = VenueCheckIn(venue_id=dojo.venue_id, user_id=user_id, checked_in_at=datetime.utcnow())
        db.session.add(checkin)
        db.session.commit()
    return jsonify({"message": f"Checked in to {dojo.name} and joined chat"})

# Optionally, seed dojos on startup (idempotent)
# To seed dojos, run this inside an app context (e.g., Flask CLI or admin route):
# with current_app.app_context():
#     seed_dojos()
