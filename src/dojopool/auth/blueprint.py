"""Authentication blueprint for DojoPool."""

from typing import Dict, Any
from flask import jsonify, request, url_for, redirect
from flask_login import login_user, logout_user, login_required, current_user
from src.core.blueprints import BaseBlueprint, BlueprintConfig
from src.core.auth.security import hash_password
from src.core.database import db_session
from .models import User

class AuthBlueprint(BaseBlueprint):
    """Authentication blueprint."""
    
    def __init__(self):
        """Initialize blueprint."""
        config = BlueprintConfig(
            url_prefix="/auth",
            template_folder="templates/auth"
        )
        super().__init__("auth", __name__, config)
        
        # Register routes
        self.register_routes()
        
        # Register API routes
        self.register_api_routes()
    
    def register_routes(self) -> None:
        """Register blueprint routes."""
        
        @self.route("/login", methods=["GET", "POST"])
        def login():
            """Login route."""
            if request.method == "POST":
                data = request.get_json()
                email = data.get("email")
                password = data.get("password")
                
                with db_session() as session:
                    user = session.query(User).filter_by(email=email).first()
                    if user and user.verify_password(password):
                        login_user(user)
                        return jsonify({
                            "message": "Login successful",
                            "user": user.to_dict()
                        })
                
                return jsonify({
                    "error": "Invalid credentials"
                }), 401
            
            return jsonify({
                "message": "Please log in"
            })
        
        @self.route("/logout")
        @login_required
        def logout():
            """Logout route."""
            logout_user()
            return jsonify({
                "message": "Logout successful"
            })
    
    def register_api_routes(self) -> None:
        """Register blueprint API routes."""
        
        @self.route("/api/register", methods=["POST"])
        def register():
            """Register new user."""
            data = request.get_json()
            
            with db_session() as session:
                if session.query(User).filter_by(email=data["email"]).first():
                    return jsonify({
                        "error": "Email already registered"
                    }), 400
                
                user = User(
                    email=data["email"],
                    password=data["password"],
                    name=data.get("name", "")
                )
                session.add(user)
                session.commit()
            
            return jsonify({
                "message": "Registration successful",
                "user": user.to_dict()
            })
        
        @self.route("/api/me")
        @login_required
        def me():
            """Get current user."""
            return jsonify({
                "user": current_user.to_dict()
            })
    
    def register_error_handlers(self) -> None:
        """Register blueprint error handlers."""
        
        @self.errorhandler(401)
        def unauthorized_error(error: Any) -> Dict[str, Any]:
            """Handle 401 errors."""
            return jsonify({
                "error": "Unauthorized"
            }), 401
        
        @self.errorhandler(403)
        def forbidden_error(error: Any) -> Dict[str, Any]:
            """Handle 403 errors."""
            return jsonify({
                "error": "Forbidden"
            }), 403
    
    def register_commands(self) -> None:
        """Register blueprint CLI commands."""
        
        @self.cli.command("create-admin")
        def create_admin():
            """Create admin user."""
            with db_session() as session:
                if not session.query(User).filter_by(email="admin@dojopool.com").first():
                    admin = User(
                        email="admin@dojopool.com",
                        password=hash_password("admin"),
                        name="Admin",
                        is_admin=True
                    )
                    session.add(admin)
                    session.commit()
                    print("Admin user created") 