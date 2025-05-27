"""Feature routes for map and avatar functionality."""

from flask import Blueprint, current_app, jsonify, render_template, request, redirect, url_for
from flask_login import current_user, login_required

from dojopool.core.models.venue import Venue
from src.services.avatar import AvatarService

features_bp = Blueprint("features", __name__)


@features_bp.route("/map")
def map_view():
    """Render the DojoMap page."""
    return render_template("features/map.html")


@features_bp.route("/api/venues")
def get_venues():
    """Get all venue locations for the map."""
    venues = Venue.query.all()
    return jsonify([venue.to_dict() for venue in venues])


@features_bp.route("/avatar")
@login_required
def avatar_view():
    """Render the avatar creation/customization page."""
    # --- ONBOARDING GLUE: If avatar exists, redirect to dashboard ---
    avatar_service = AvatarService()
    avatar = avatar_service.get_avatar(current_user.id)
    if avatar:
        return redirect(url_for("dashboard.dashboard_view"))
    return render_template("features/avatar.html")


@features_bp.route("/api/avatar/generate", methods=["POST"])
@login_required
def generate_avatar():
    """Generate a new avatar using AI."""
    if "image" not in request.files:
        return render_template(
            "features/avatar.html",
            error="No image provided. Please upload a photo.",
        )

    file = request.files["image"]
    style = request.form.get("style", "anime")
    prompt = request.form.get("prompt", "")
    if not file.filename:
        return render_template(
            "features/avatar.html",
            error="No image selected. Please choose a file.",
        )

    try:
        avatar_service = AvatarService()
        # Read file as bytes
        image_data = file.read()
        # Pass prompt to avatar_service, ensure pool cue is always included
        full_prompt = prompt.strip()
        if full_prompt:
            full_prompt += ", pool cue"
        else:
            full_prompt = "pool cue"
        avatar_bytes, error = avatar_service.transform_avatar(image_data, style, full_prompt)
        if error:
            return render_template(
                "features/avatar.html",
                error=error,
            )
        # Save avatar
        avatar_url, save_error = avatar_service.save_avatar(current_user.id, avatar_bytes)
        if save_error:
            return render_template(
                "features/avatar.html",
                error=save_error,
            )
        # Optionally, update user profile with avatar_url here
        return render_template(
            "features/avatar.html",
            avatar_url=avatar_url,
            success="Avatar created successfully! Welcome to Dojo Pool.",
        )
    except Exception as e:
        current_app.logger.error(f"Avatar generation error: {str(e)}")
        return render_template(
            "features/avatar.html",
            error="Failed to generate avatar. Please try again.",
        )


@features_bp.route("/api/avatar/customize", methods=["POST"])
@login_required
def customize_avatar():
    """Customize existing avatar."""
    data = request.get_json()
    try:
        avatar_service = AvatarService()
        result = avatar_service.customize_avatar(current_user.id, data)
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Avatar customization error: {str(e)}")
        return jsonify({"error": "Failed to customize avatar"}), 500
