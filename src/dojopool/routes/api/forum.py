from typing import Any, Dict

from flask import Blueprint, request

from ...core.middleware import rate_limit
from ...services.forum_service import ForumService
from ...utils.auth import get_current_user, require_auth
from ...utils.validation import validate_request_data

forum = Blueprint("forum", __name__)
forum_service = ForumService()


def error_response(error: str, status_code: int = 400) -> tuple:
    """Create a standardized error response."""
    return {"status": "error", "error": error}, status_code


@forum.route("/categories", methods=["GET"])
@rate_limit(limit=100)
def get_categories() -> Dict[str, Any]:
    """Get all forum categories."""
    include_private = request.args.get("include_private", "").lower() == "true"

    # Only allow viewing private categories for authenticated users
    if include_private and not get_current_user():
        include_private = False

    categories = forum_service.get_categories(include_private)
    return {"categories": categories}


@forum.route("/categories/<int:category_id>", methods=["GET"])
@rate_limit(limit=100)
def get_category(category_id: int) -> Dict[str, Any]:
    """Get a specific category."""
    category = forum_service.get_category(category_id)
    if not category:
        return error_response("Category not found", 404)

    return category


@forum.route("/topics", methods=["GET"])
@rate_limit(limit=100)
def get_topics() -> Dict[str, Any]:
    """Get topics with pagination."""
    try:
        category_id = request.args.get("category_id", type=int)
        page = max(1, request.args.get("page", 1, type=int))
        per_page = min(100, request.args.get("per_page", 20, type=int))
        sort_by = request.args.get("sort_by", "last_post")

        if sort_by not in ["last_post", "created", "views"]:
            return error_response("Invalid sort_by parameter")

        result = forum_service.get_topics(
            category_id=category_id, page=page, per_page=per_page, sort_by=sort_by
        )
        return result

    except ValueError as e:
        return error_response(str(e))


@forum.route("/topics", methods=["POST"])
@require_auth
@rate_limit(limit=20)
def create_topic() -> Dict[str, Any]:
    """Create a new topic."""
    try:
        user = get_current_user()
        if not user:
            return error_response("User not found", 404)

        data = request.get_json()
        validation = validate_request_data(data, ["category_id", "title", "content"])
        if validation.get("error"):
            return error_response(validation["error"])

        topic = forum_service.create_topic(
            user_id=user.id,
            category_id=data["category_id"],
            title=data["title"],
            content=data["content"],
        )
        return topic, 201

    except ValueError as e:
        return error_response(str(e))


@forum.route("/topics/<int:topic_id>", methods=["GET"])
@rate_limit(limit=100)
def get_topic(topic_id: int) -> Dict[str, Any]:
    """Get a specific topic."""
    increment_view = request.args.get("increment_view", "").lower() == "true"
    topic = forum_service.get_topic(topic_id, increment_view)

    if not topic:
        return error_response("Topic not found", 404)

    return topic


@forum.route("/topics/<int:topic_id>/posts", methods=["GET"])
@rate_limit(limit=100)
def get_posts(topic_id: int) -> Dict[str, Any]:
    """Get posts for a topic."""
    try:
        page = max(1, request.args.get("page", 1, type=int))
        per_page = min(100, request.args.get("per_page", 20, type=int))

        result = forum_service.get_posts(topic_id=topic_id, page=page, per_page=per_page)
        return result

    except ValueError as e:
        return error_response(str(e))


@forum.route("/topics/<int:topic_id>/posts", methods=["POST"])
@require_auth
@rate_limit(limit=30)
def create_post(topic_id: int) -> Dict[str, Any]:
    """Create a new post in a topic."""
    try:
        user = get_current_user()
        if not user:
            return error_response("User not found", 404)

        data = request.get_json()
        validation = validate_request_data(data, ["content"])
        if validation.get("error"):
            return error_response(validation["error"])

        post = forum_service.create_post(
            user_id=user.id, topic_id=topic_id, content=data["content"]
        )
        return post, 201

    except ValueError as e:
        return error_response(str(e))


@forum.route("/posts/<int:post_id>/react", methods=["POST"])
@require_auth
@rate_limit(limit=50)
def add_reaction(post_id: int) -> Dict[str, Any]:
    """Add a reaction to a post."""
    try:
        user = get_current_user()
        if not user:
            return error_response("User not found", 404)

        data = request.get_json()
        validation = validate_request_data(data, ["reaction_type"])
        if validation.get("error"):
            return error_response(validation["error"])

        result = forum_service.add_reaction(
            user_id=user.id, post_id=post_id, reaction_type=data["reaction_type"]
        )
        return result

    except ValueError as e:
        return error_response(str(e))


@forum.route("/subscribe", methods=["POST"])
@require_auth
@rate_limit(limit=50)
def subscribe() -> Dict[str, Any]:
    """Subscribe to a topic or category."""
    try:
        user = get_current_user()
        if not user:
            return error_response("User not found", 404)

        data = request.get_json()
        if "topic_id" not in data and "category_id" not in data:
            return error_response("Must provide either topic_id or category_id")

        result = forum_service.subscribe(
            user_id=user.id, topic_id=data.get("topic_id"), category_id=data.get("category_id")
        )
        return result

    except ValueError as e:
        return error_response(str(e))
