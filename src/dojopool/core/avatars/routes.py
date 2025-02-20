"""Avatar routes module."""

import base64
import io
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from flask import Blueprint, Response, current_app, jsonify, request, send_file
from flask_login import current_user, login_required
from werkzeug.wrappers import Response as WerkzeugResponse

from ..models import User, db
from .animation import AvatarAnimator
from .generator import AvatarGenerator

bp: Blueprint = Blueprint("avatars", __name__, url_prefix="/avatars")

# Initialize components
avatar_generator: AvatarGenerator = AvatarGenerator()
animation_manager: AvatarAnimator = AvatarAnimator("assets/animations")


@bp.route("/generate", methods=["POST"])
@login_required
def generate_avatar() -> Union[Response, Tuple[Response, int]]:
    """Generate a new avatar.

    Returns:
        Response with generated avatar or error
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Generate avatar
        avatar_image = avatar_generator.generate(
            style=data.get("style", "default"),
            features=data.get("features", {}),
            colors=data.get("colors", {}),
        )

        # Convert to base64
        buffered = io.BytesIO()
        avatar_image.save(buffered, format="PNG")
        avatar_base64 = base64.b64encode(buffered.getvalue()).decode()

        # Update user's avatar if requested
        if data.get("update_profile", False):
            current_user.avatar = buffered.getvalue()
            current_user.avatar_updated_at = datetime.utcnow()
            db.session.commit()

        return jsonify(
            {
                "status": "success",
                "data": {"avatar": f"data:image/png;base64,{avatar_base64}"},
            }
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_avatar(user_id: int) -> Union[Response, Tuple[Response, int]]:
    """Get a user's avatar.

    Args:
        user_id: ID of the user

    Returns:
        Response with user's avatar or error
    """
    try:
        user = User.query.get_or_404(user_id)

        if not user.avatar:
            # Generate default avatar
            avatar_image = avatar_generator.generate_default()
            buffered = io.BytesIO()
            avatar_image.save(buffered, format="PNG")
            return send_file(io.BytesIO(buffered.getvalue()), mimetype="image/png")

        return send_file(io.BytesIO(user.avatar), mimetype="image/png")

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/me", methods=["PUT"])
@login_required
def update_avatar():
    """Update current user's avatar.

    Returns:
        Response indicating success or error
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        if "avatar" not in data:
            return (
                jsonify({"status": "error", "message": "No avatar data provided"}),
                400,
            )

        # Decode base64 avatar
        try:
            avatar_data = base64.b64decode(data["avatar"].split(",")[1])
        except:
            return (
                jsonify({"status": "error", "message": "Invalid avatar data format"}),
                400,
            )

        # Update user's avatar
        current_user.avatar = avatar_data
        current_user.avatar_updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({"status": "success", "message": "Avatar updated successfully"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/animate", methods=["POST"])
@login_required
def animate_avatar():
    """Animate an avatar.

    Returns:
        Response with animated avatar or error
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Get animation parameters
        animation_name = data.get("animation")
        if not animation_name:
            return (
                jsonify({"status": "error", "message": "No animation specified"}),
                400,
            )

        # Get avatar image
        if "avatar" in data:
            try:
                avatar_data = base64.b64decode(data["avatar"].split(",")[1])
                avatar_image = io.BytesIO(avatar_data)
            except:
                return (
                    jsonify(
                        {"status": "error", "message": "Invalid avatar data format"}
                    ),
                    400,
                )
        else:
            # Use current user's avatar or generate default
            if current_user.avatar:
                avatar_image = io.BytesIO(current_user.avatar)
            else:
                avatar_image = io.BytesIO()
                avatar_generator.generate_default().save(avatar_image, format="PNG")

        # Generate animation
        animated_avatar = animation_manager.animate(
            avatar_image, animation_name, **data.get("params", {})
        )

        # Convert to base64
        buffered = io.BytesIO()
        animated_avatar.save(buffered, format="GIF")
        animation_base64 = base64.b64encode(buffered.getvalue()).decode()

        return jsonify(
            {
                "status": "success",
                "data": {"animation": f"data:image/gif;base64,{animation_base64}"},
            }
        )

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/styles", methods=["GET"])
def get_avatar_styles():
    """Get available avatar styles.

    Returns:
        Response with available styles
    """
    styles = avatar_generator.get_available_styles()
    return jsonify({"status": "success", "data": {"styles": styles}})


@bp.route("/animations", methods=["GET"])
def get_available_animations() -> Response:
    """Get available animations.

    Returns:
        Response with available animations
    """
    animations = animation_manager.get_available_animations()
    return jsonify({"status": "success", "data": {"animations": animations}})
