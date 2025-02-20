from flask_caching import Cache
from flask_caching import Cache
"""Friend routes for managing user friendships."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, g, jsonify
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from ..core.auth import login_required
from ..models.chat import ChatRoom
from ..models.user import Friendship, User

bp: Blueprint = Blueprint("friends", __name__)


@bp.route("/api/v1/friends/with-status")
@login_required
def get_friends_with_status() -> Response:
    """Get user's friends with their dojo interaction status."""
    try:
        # Get user's friends
        friends: Any = Friendship.query.filter_by(
            user_id=getattr(g, "user", None).id, status="accepted"
        ).all()

        # Get friend details with interaction status
        friend_list: List[Any] = []
        for friendship in friends:
            friend: Any = User.query.get(friendship.friend_id)
            if friend:
                can_interact: Any = ChatRoom.can_users_interact(
                    getattr(g, "user", None).id, friend.id
                )
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
