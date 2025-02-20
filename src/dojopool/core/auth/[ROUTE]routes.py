from flask_caching import Cache
from flask_caching import Cache
"""Authentication routes module."""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

from ...models.user import User
from ..database import db_session
from ..security import require_auth

bp = Blueprint("auth", __name__, url_prefix="/auth")


@bp.route("/register", methods=["POST"])
def register() -> Union[Dict[str, Any], Tuple[Dict[str, Any], int]]:
    """Handle user registration.

    Returns:
        Registration response with status code
    """
    data = request.get_json()
    if not data:
        return {"error": "No data provided"}, 400

    # Validate required fields
    required_fields = ["email", "password", "username"]
    for field in required_fields:
        if not data.get(field):
            return {"error": f"{field} is required"}, 400

    with db_session() as session:
        # Check if user exists
        if session.query(User).filter_by(email=data["email"]).first():
            return {"error": "Email already registered"}, 400

        if session.query(User).filter_by(username=data["username"]).first():
            return {"error": "Username already taken"}, 400

        # Create user
        user = User(
            email=data["email"],
            username=data["username"],
            password_hash=generate_password_hash(data["password"]),
            is_active=True,
            created_at=datetime.utcnow(),
        )

        try:
            session.add(user)
            session.commit()
            return {"message": "Registration successful"}, 201
        except Exception as e:
            session.rollback()
            current_app.logger.error(f"Registration failed: {str(e)}")
            return {"error": "Registration failed"}, 500


@bp.route("/login", methods=["POST"])
def login():
    """Handle user login.

    Returns:
        Login response with status code
    """
    data = request.get_json()
    if not data:
        return {"error": "No data provided"}, 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"error": "Email and password are required"}, 400

    with db_session() as session:
        user = session.query(User).filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return {
                "message": "Login successful",
                "user": {"id": user.id, "email": user.email, "username": user.username},
            }

        return {"error": "Invalid email or password"}, 401


@bp.route("/logout", methods=["POST"])
@login_required
def logout():
    """Handle user logout.

    Returns:
        Logout response
    """
    logout_user()
    return {"message": "Logout successful"}


@bp.route("/me", methods=["GET"])
@login_required
def get_current_user():
    """Get current user details.

    Returns:
        Current user details
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
    }


@bp.route("/me", methods=["PUT"])
@login_required
def update_profile() -> Union[Dict[str, Any], Tuple[Dict[str, Any], int]]:
    """Update user profile.

    Returns:
        Update response with status code
    """
    data = request.get_json()
    if not data:
        return {"error": "No data provided"}, 400

    with db_session() as session:
        user = session.query(User).get(current_user.id)
        if not user:
            return {"error": "User not found"}, 404

        # Update fields
        if "username" in data:
            # Check if username is taken
            existing = session.query(User).filter_by(username=data["username"]).first()
            if existing and existing.id != user.id:
                return {"error": "Username already taken"}, 400
            user.username = data["username"]

        if "password" in data:
            if not data.get("current_password"):
                return {"error": "Current password is required"}, 400

            if not check_password_hash(user.password_hash, data["current_password"]):
                return {"error": "Current password is incorrect"}, 400

            user.password_hash = generate_password_hash(data["password"])

        try:
            session.commit()
            return {"message": "Profile updated successfully"}
        except Exception as e:
            session.rollback()
            current_app.logger.error(f"Error updating profile: {str(e)}")
            return {"error": "Update failed"}, 500


@bp.errorhandler(401)
def unauthorized(error: Any):
    """Handle unauthorized error.

    Args:
        error: Error details

    Returns:
        Error response with status code
    """
    return {"error": "Unauthorized"}, 401
