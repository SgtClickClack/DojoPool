"""Blueprint template for DojoPool."""

from typing import Dict, Any
from flask import jsonify, request
from . import BaseBlueprint, BlueprintConfig

class TemplateBlueprint(BaseBlueprint):
    """Template for creating new blueprints."""
    
    def __init__(self):
        """Initialize blueprint."""
        config = BlueprintConfig(
            url_prefix="/template",
            template_folder="templates/template",
            static_folder="static/template"
        )
        super().__init__("template", __name__, config)
        
        # Register routes
        self.register_routes()
        
        # Register API routes
        self.register_api_routes()
    
    def register_routes(self) -> None:
        """Register blueprint routes."""
        
        @self.route("/")
        def index():
            """Blueprint index route."""
            return jsonify({
                "message": "Template blueprint index"
            })
    
    def register_api_routes(self) -> None:
        """Register blueprint API routes."""
        
        @self.route("/api/resource", methods=["GET"])
        def get_resource():
            """Get resource endpoint."""
            return jsonify({
                "message": "Get resource"
            })
        
        @self.route("/api/resource", methods=["POST"])
        def create_resource():
            """Create resource endpoint."""
            data = request.get_json()
            return jsonify({
                "message": "Resource created",
                "data": data
            })
    
    def register_error_handlers(self) -> None:
        """Register blueprint error handlers."""
        
        @self.errorhandler(404)
        def not_found_error(error: Any) -> Dict[str, Any]:
            """Handle 404 errors."""
            return jsonify({
                "error": "Resource not found"
            }), 404
        
        @self.errorhandler(500)
        def internal_error(error: Any) -> Dict[str, Any]:
            """Handle 500 errors."""
            return jsonify({
                "error": "Internal server error"
            }), 500
    
    def register_commands(self) -> None:
        """Register blueprint CLI commands."""
        
        @self.cli.command("init")
        def init_command():
            """Initialize blueprint resources."""
            print("Initializing template blueprint...") 