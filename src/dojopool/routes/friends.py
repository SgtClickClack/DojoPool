"""Friend routes for managing user friendships."""

from flask import Blueprint, jsonify, g
from ..models.chat import ChatRoom
from ..models.user import User, Friendship
from ..core.auth import login_required

bp = Blueprint("friends", __name__)


@bp.route("/api/v1/friends/with-status")
@login_required
def get_friends_with_status():
    """Get user's friends with their dojo interaction status."""
    try:
        # Get user's friends
        friends = Friendship.query.filter_by(user_id=g.user.id, status="accepted").all()

        # Get friend details with interaction status
        friend_list = []
        for friendship in friends:
            friend = User.query.get(friendship.friend_id)
            if friend:
                can_interact = ChatRoom.can_users_interact(g.user.id, friend.id)
                friend_list.append(
                    {
                        "id": friend.id,
                        "username": friend.username,
                        "avatar_url": friend.avatar_url,
                        "can_interact": can_interact,
                    }
                )

        return jsonify(friend_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
