"""Routes for player messaging and inbox management."""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from dojopool.tracking.messaging import MessageManager, MessageType

message_bp = Blueprint("message", __name__, url_prefix="/api/messages")

# Instance of the message manager (in production, should be injected/singleton)
message_manager = MessageManager()

@message_bp.route("/inbox/summary", methods=["GET"])
@login_required
def inbox_summary():
    """Get inbox summary for the logged-in player."""
    summary = message_manager.get_inbox_summary(str(current_user.id))
    return jsonify(summary)

@message_bp.route("/inbox", methods=["GET"])
@login_required
def get_inbox():
    """Get all messages for the logged-in player (optionally filter by type or unread)."""
    message_type = request.args.get("type")
    unread_only = request.args.get("unread", "false").lower() == "true"
    mt = MessageType(message_type) if message_type in MessageType.__members__ else None
    messages = message_manager.get_player_messages(str(current_user.id), message_type=mt, unread_only=unread_only)
    return jsonify([m.__dict__ for m in messages])

@message_bp.route("/send", methods=["POST"])
@login_required
def send_message():
    """Send a message to another player."""
    data = request.json
    recipient_id = data.get("recipient_id")
    content = data.get("content")
    message_type = data.get("message_type", "direct")
    metadata = data.get("metadata", {})
    if not recipient_id or not content:
        return jsonify({"error": "recipient_id and content required"}), 400
    mt = MessageType(message_type) if message_type in MessageType.__members__ else MessageType.DIRECT
    msg = message_manager.send_message(str(current_user.id), recipient_id, content, mt, metadata)
    return jsonify(msg.__dict__), 201

@message_bp.route("/mark_read/<message_id>", methods=["POST"])
@login_required
def mark_read(message_id):
    """Mark a message as read."""
    success = message_manager.mark_as_read(message_id)
    return jsonify({"success": success})

@message_bp.route("/delete/<message_id>", methods=["DELETE"])
@login_required
def delete_message(message_id):
    """Delete a message from the player's inbox."""
    success = message_manager.delete_message(str(current_user.id), message_id)
    return jsonify({"success": success})
