from flask import Blueprint, jsonify, request

from ..auth.decorators import login_required
from .service import SocialService

social_bp = Blueprint("social", __name__)
social_service = SocialService()


# Friendship Routes
@social_bp.route("/friends/request", methods=["POST"])
@login_required
def send_friend_request():
    """Send a friend request to another user."""
    data = request.get_json()
    try:
        friendship = social_service.send_friend_request(
            user_id=request.user.id, friend_id=data["friend_id"]
        )
        return (
            jsonify(
                {
                    "id": friendship.id,
                    "status": friendship.status,
                    "created_at": friendship.created_at.isoformat(),
                }
            ),
            201,
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@social_bp.route("/friends/request/<int:friendship_id>", methods=["PUT"])
@login_required
def handle_friend_request(friendship_id):
    """Accept or reject a friend request."""
    data = request.get_json()
    try:
        friendship = social_service.handle_friend_request(
            friendship_id=friendship_id, user_id=request.user.id, accept=data["accept"]
        )
        return jsonify(
            {
                "id": friendship.id,
                "status": friendship.status,
                "updated_at": friendship.updated_at.isoformat(),
            }
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@social_bp.route("/friends", methods=["GET"])
@login_required
def get_friends():
    """Get list of user's friends."""
    friends = social_service.get_friends(request.user.id)
    return jsonify({"friends": friends})


# Chat Routes
@social_bp.route("/chat/send", methods=["POST"])
@login_required
def send_message():
    """Send a chat message to another user."""
    data = request.get_json()
    message = social_service.send_message(
        sender_id=request.user.id, receiver_id=data["receiver_id"], content=data["content"]
    )
    return (
        jsonify(
            {
                "id": message.id,
                "content": message.content,
                "created_at": message.created_at.isoformat(),
            }
        ),
        201,
    )


@social_bp.route("/chat/<int:other_user_id>", methods=["GET"])
@login_required
def get_messages(other_user_id):
    """Get chat messages between current user and another user."""
    limit = request.args.get("limit", 50, type=int)
    messages = social_service.get_messages(
        user_id=request.user.id, other_user_id=other_user_id, limit=limit
    )
    return jsonify(
        {
            "messages": [
                {
                    "id": msg.id,
                    "content": msg.content,
                    "sender_id": msg.sender_id,
                    "is_read": msg.is_read,
                    "created_at": msg.created_at.isoformat(),
                }
                for msg in messages
            ]
        }
    )


@social_bp.route("/chat/<int:other_user_id>/read", methods=["POST"])
@login_required
def mark_messages_read(other_user_id):
    """Mark all messages from other_user as read."""
    social_service.mark_messages_read(user_id=request.user.id, other_user_id=other_user_id)
    return jsonify({"status": "success"})


# Community Challenge Routes
@social_bp.route("/challenges", methods=["POST"])
@login_required
def create_challenge():
    """Create a new community challenge."""
    data = request.get_json()
    data["creator_id"] = request.user.id
    try:
        challenge = social_service.create_challenge(data)
        return (
            jsonify(
                {
                    "id": challenge.id,
                    "title": challenge.title,
                    "description": challenge.description,
                    "start_date": challenge.start_date.isoformat(),
                    "end_date": challenge.end_date.isoformat(),
                    "reward_points": challenge.reward_points,
                }
            ),
            201,
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@social_bp.route("/challenges/active", methods=["GET"])
@login_required
def get_active_challenges():
    """Get all active community challenges."""
    challenges = social_service.get_active_challenges()
    return jsonify(
        {
            "challenges": [
                {
                    "id": c.id,
                    "title": c.title,
                    "description": c.description,
                    "start_date": c.start_date.isoformat(),
                    "end_date": c.end_date.isoformat(),
                    "reward_points": c.reward_points,
                    "creator": {"id": c.creator.id, "username": c.creator.username},
                }
                for c in challenges
            ]
        }
    )


@social_bp.route("/challenges/<int:challenge_id>/join", methods=["POST"])
@login_required
def join_challenge(challenge_id):
    """Join a community challenge."""
    try:
        participant = social_service.join_challenge(
            user_id=request.user.id, challenge_id=challenge_id
        )
        return (
            jsonify(
                {
                    "id": participant.id,
                    "status": participant.status,
                    "joined_at": participant.joined_at.isoformat(),
                }
            ),
            201,
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@social_bp.route("/challenges/participant/<int:participant_id>", methods=["PUT"])
@login_required
def update_challenge_progress(participant_id):
    """Update a participant's challenge progress."""
    data = request.get_json()
    try:
        participant = social_service.update_challenge_progress(
            participant_id=participant_id,
            status=data["status"],
            progress_data=data.get("progress_data"),
        )
        return jsonify(
            {
                "id": participant.id,
                "status": participant.status,
                "completed_at": (
                    participant.completed_at.isoformat() if participant.completed_at else None
                ),
            }
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


# Social Sharing Routes
@social_bp.route("/share", methods=["POST"])
@login_required
def create_share():
    """Create a new social share."""
    data = request.get_json()
    data["user_id"] = request.user.id
    try:
        share = social_service.create_social_share(data)
        return (
            jsonify(
                {
                    "id": share.id,
                    "content_type": share.content_type,
                    "platform": share.platform,
                    "created_at": share.created_at.isoformat(),
                }
            ),
            201,
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@social_bp.route("/share/user/<int:user_id>", methods=["GET"])
@login_required
def get_user_shares(user_id):
    """Get all social shares by a user."""
    shares = social_service.get_user_shares(user_id)
    return jsonify(
        {
            "shares": [
                {
                    "id": s.id,
                    "content_type": s.content_type,
                    "platform": s.platform,
                    "share_text": s.share_text,
                    "media_url": s.media_url,
                    "created_at": s.created_at.isoformat(),
                }
                for s in shares
            ]
        }
    )
