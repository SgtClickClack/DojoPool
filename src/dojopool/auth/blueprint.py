from flask_caching import Cache
from flask_caching import Cache
"""Authentication blueprint module."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import (
    Blueprint,
    Request,
    Response,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask.typing import ResponseReturnValue
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.wrappers import Response as WerkzeugResponse

from ..core.database import db_session
from ..core.security import require_auth
from ..models.user import User
from .base import BaseBlueprint

auth_bp: Blueprint = Blueprint("auth", __name__)


class AuthBlueprint(BaseBlueprint):
    """Authentication blueprint class."""

    def __init__(self) -> None:
        """Initialize auth blueprint."""
        super().__init__("auth", __name__, url_prefix="/auth")
        self.register_routes()
        self.register_api_routes()
        self.register_error_handlers()
        self.register_commands()

    def register_routes(self):
        """Register web routes."""

        @auth_bp.route("/login", methods=["POST"])
        def login():
            """Handle user login."""
            if current_user.is_authenticated:
                return redirect(url_for("main.index"))

            data: Any = request.get_json() or {}
            email: Any = data.get("email")
            password: Any = data.get("password")

            with db_session() as session:
                user: Any = session.query(User).filter_by(email=email).first()

                if user and user.check_password(password):
                    login_user(user)
                    return {"message": "Logged in successfully"}, 200

                return {"error": "Invalid email or password"}, 401

        @auth_bp.route("/logout", methods=["POST"])
        @login_required
        def logout():
            """Handle user logout."""
            logout_user()
            flash("You have been logged out.", "info")
            return {"message": "Logged out successfully"}, 200

    def register_api_routes(self) -> None:
        """Register API routes."""

        @auth_bp.route("/register", methods=["POST"])
        def register():
            """Handle user registration."""
            data: Any = request.get_json() or {}

            # Validate input
            required_fields: List[Any] = ["email", "password", "username"]
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
                user: Any = User(
                    email=data["email"],
                    username=data["username"],
                    password_hash=generate_password_hash(data["password"]),
                )
                session.add(user)
                session.commit()

                return {"message": "Registration successful"}, 201

        @self.route("/api/me")
        @require_auth
        def me():
            """Get current user details."""
            return {
                "id": current_user.id,
                "email": current_user.email,
                "username": current_user.username,
            }

    def register_error_handlers(self):
        """Register error handlers."""

        @self.errorhandler(401)
        def unauthorized_error(error: Any) -> Dict[str, Any]:
            """Handle unauthorized error."""
            return {"error": "Unauthorized", "message": str(error)}, 401

        @self.errorhandler(403)
        def forbidden_error(error: Any):
            """Handle forbidden error."""
            return {"error": "Forbidden", "message": str(error)}, 403

    def register_commands(self):
        """Register CLI commands."""

        @self.cli.command("create-admin")
        def create_admin() -> None:
            """Create admin user."""
            with db_session() as session:
                # Check if admin exists
                if session.query(User).filter_by(email="admin@dojopool.com").first():
                    print("Admin user already exists")
                    return

                # Create admin user
                admin: User = User(
                    email="admin@dojopool.com",
                    username="admin",
                    password_hash=generate_password_hash("admin"),
                    is_admin=True,
                )
                session.add(admin)
                session.commit()
                print("Admin user created successfully")
