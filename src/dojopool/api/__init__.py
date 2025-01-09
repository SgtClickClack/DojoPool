"""API module initialization.

This module initializes the API blueprint and registers all API routes.
It provides versioned API endpoints with proper request/response handling.
"""
from flask import Blueprint
from flask_restful import Api

from .v1 import api_v1_bp
from .api_handler import APIHandler

def init_api(app):
    """Initialize API blueprints.
    
    Args:
        app: Flask application instance.
    """
    # Register API v1 blueprint
    app.register_blueprint(api_v1_bp, url_prefix='/api/v1')
    
    # Configure API documentation
    app.config.update({
        'API_TITLE': 'DojoPool API',
        'API_VERSION': 'v1',
        'OPENAPI_VERSION': '3.0.2',
        'OPENAPI_URL_PREFIX': '/api/docs',
        'OPENAPI_SWAGGER_UI_PATH': '/swagger',
        'OPENAPI_SWAGGER_UI_URL': 'https://cdn.jsdelivr.net/npm/swagger-ui-dist/',
    })

__all__ = [
    'init_api',
    'APIHandler',
    'api_v1_bp',
] 