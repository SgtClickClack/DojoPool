"""Mobile routes package."""

from flask import Flask, Blueprint

def register_mobile_routes(app: Flask) -> None:
    """Register mobile routes with the application.
    
    Args:
        app: Flask application instance
    """
    mobile_bp = Blueprint('mobile', __name__, url_prefix='/mobile')
    
    # Register mobile blueprint with app
    app.register_blueprint(mobile_bp) 