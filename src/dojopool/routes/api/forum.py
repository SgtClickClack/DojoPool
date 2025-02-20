from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Blueprint, Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from ...core.middleware import rate_limit
from ...services.forum_service import ForumService
from ...utils.auth import get_current_user, require_auth
from ...utils.validation import validate_request_data

forum: Blueprint = Blueprint("forum", __name__)
forum_service: ForumService = ForumService()


def error_response(error: str, status_code: int = 400) -> tuple:
    """Create a standardized error response."""
    return jsonify({"staResponse "error": error}), status_code


@forum.route("/categories", methods=["GET"])
@rate_limit(limit=100)
def get_categories() :
    """Get all forum categories."""
    include_private: bool = request.args.get("include_private", "", type=str).lower() == "true"

    # Only allow viewing private categories for authenticated users
    if include_private and not get_current_user():
        include_private: bool = False

    categories = forum_service.get_categories(include_private)
    return jsonify({"categories": cateResponse

@forum.route("/categories/<int:category_id>", methods=["GET"])
@rate_limit(limit=100)
def get_category(category_id: int) -> Dict[str, Any]:
    """Get a specific category."""
    category: Any = forum_service.get_category(category_id)
    if not category:
        return error_response("Category not found", 404)

    return jsonify(category)


@forum.route("/topics", methods=["GET"])
@rate_limit(limit=100)
def get_topics() :
    """Get topics with pagination."""
    try:
        category_id: Any = request.args.get("category_id", type=int, type=str)
        page: max = max(1, request.args.get("page", 1, type=int, type=str))
        per_page: max = min(100, request.args.get("per_page", 20, type=int, type=str))
        sort_by: Any = request.args.get("sort_by", "last_post", type=str)

        if sort_by not in ["last_post", "created", "views"]:
            return error_response("Invalid sort_by parameter")

        result: Any = forum_service.get_topics(
            category_id=category_id, page=page, per_page=per_page, sort_by=sort_by
        )
        return jsonify(result)

    except ValueError as e:
        return error_response(str(e))


@forum.route("/topics", methods=["POST"])
@require_auth
@rate_limit(limit=20)
def create_topic() :
    """Create a new topic."""
    try:
        user: get_current_user: get_current_user: get_current_user: get_current_user = get_current_user()
        if not user:
            return error_response("User not found", 404)

        data: Any = request.get_json()
        validation: validate_request_data: Any = validate_request_data(data, ["category_id", "title", "content"])
        if validation.get("error"):
            return error_response(validation["error"])

        topic: Any = forum_service.create_topic(
            user_id=user.id,
            category_id=data["category_id"],
            title=data["title"],
            content=data["content"],
        )
        return jsonify(topic), 201

    except ValueError as e:
        return error_response(str(e))


@forum.route("/topics/<int:topic_id>", methods=["GET"])
@rate_limit(limit=100)
def get_topic(topic_id: int) -> Dict[str, Any]:
    """Get a specific topic."""
    increment_view: Any = request.args.get("increment_view", "", type=str).lower() == "true"
    topic: Any = forum_service.get_topic(topic_id, increment_view)

    if not topic:
        return error_response("Topic not found", 404)

    return jsonify(topic)


@forum.route("/topics/<int:topic_id>/posts", methods=["GET"])
@rate_limit(limit=100)
def get_posts(topic_id: int) -> Dict[str, Any]:
    """Get posts for a topic."""
    try:
        page: max = max(1, request.args.get("page", 1, type=int, type=str))
        per_page: max = min(100, request.args.get("per_page", 20, type=int, type=str))

        result: Any = forum_service.get_posts(
            topic_id=topic_id, page=page, per_page=per_page
        )
        return jsonify(result)

    except ValueError as e:
        return error_response(str(e))


@forum.route("/topics/<int:topic_id>/posts", methods=["POST"])
@require_auth
@rate_limit(limit=30)
def create_post(topic_id: int) -> Dict[str, Any]:
    """Create a new post in a topic."""
    try:
        user: get_current_user: get_current_user: get_current_user: get_current_user = get_current_user()
        if not user:
            return error_response("User not found", 404)

        data: Any = request.get_json()
        validation: validate_request_data: Any = validate_request_data(data, ["content"])
        if validation.get("error"):
            return error_response(validation["error"])

        post: Any = forum_service.create_post(
            user_id=user.id, topic_id=topic_id, content=data["content"]
        )
        return jsonify(post), 201

    except ValueError as e:
        return error_response(str(e))


@forum.route("/posts/<int:post_id>/react", methods=["POST"])
@require_auth
@rate_limit(limit=50)
def add_reaction(post_id: int) -> Dict[str, Any]:
    """Add a reaction to a post."""
    try:
        user: get_current_user: get_current_user: get_current_user: get_current_user = get_current_user()
        if not user:
            return error_response("User not found", 404)

        data: Any = request.get_json()
        validation: validate_request_data: Any = validate_request_data(data, ["reaction_type"])
        if validation.get("error"):
            return error_response(validation["error"])

        result: Any = forum_service.add_reaction(
            user_id=user.id, post_id=post_id, reaction_type=data["reaction_type"]
        )
        return jsonify(result)

    except ValueError as e:
        return error_response(str(e))


@forum.route("/subscribe", methods=["POST"])
@require_auth
@rate_limit(limit=50)
def subscribe() :
    """Subscribe to a topic or category."""
    try:
        user: get_current_user: get_current_user: get_current_user: get_current_user = get_current_user()
        if not user:
            return error_response("User not found", 404)

        data: Any = request.get_json()
        if "topic_id" not in data and "category_id" not in data:
            return error_response("Must provide either topic_id or category_id")

        result: Any = forum_service.subscribe(
            user_id=user.id,
            topic_id=data.get("topic_id"),
            category_id=data.get("category_id"),
        )
        return jsonify(result)

    except ValueError as e:
        return error_response(str(e))
