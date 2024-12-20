"""Error handlers for DojoPool."""

from typing import Tuple, Dict, Any
from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from .exceptions import DojoPoolError
from ..logging.utils import log_error

def init_app(app):
    """Initialize error handlers for the application."""
    
    @app.errorhandler(DojoPoolError)
    def handle_dojo_pool_error(error: DojoPoolError) -> Tuple[Dict[str, Any], int]:
        """Handle DojoPool custom errors."""
        log_error(error, level="warning" if error.status_code < 500 else "error")
        return jsonify(error.to_dict()), error.status_code
    
    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException) -> Tuple[Dict[str, Any], int]:
        """Handle Werkzeug HTTP errors."""
        log_error(
            error,
            level="warning" if error.code < 500 else "error",
            http_code=error.code
        )
        return jsonify({
            'error': error.__class__.__name__,
            'message': error.description,
            'status_code': error.code
        }), error.code
    
    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error: SQLAlchemyError) -> Tuple[Dict[str, Any], int]:
        """Handle SQLAlchemy database errors."""
        log_error(error, "Database error occurred")
        
        if current_app.debug:
            message = str(error)
        else:
            message = "A database error occurred"
        
        return jsonify({
            'error': 'DatabaseError',
            'message': message,
            'status_code': 500
        }), 500
    
    @app.errorhandler(Exception)
    def handle_generic_error(error: Exception) -> Tuple[Dict[str, Any], int]:
        """Handle all unhandled exceptions."""
        log_error(error, "Unhandled exception occurred")
        
        if current_app.debug:
            message = str(error)
        else:
            message = "An unexpected error occurred"
        
        return jsonify({
            'error': 'InternalServerError',
            'message': message,
            'status_code': 500
        }), 500

def register_blueprint_error_handlers(blueprint):
    """Register error handlers for a blueprint."""
    
    @blueprint.errorhandler(DojoPoolError)
    def handle_blueprint_error(error: DojoPoolError) -> Tuple[Dict[str, Any], int]:
        """Handle blueprint-specific errors."""
        log_error(
            error,
            f"Error in blueprint {blueprint.name}",
            level="warning" if error.status_code < 500 else "error",
            blueprint=blueprint.name
        )
        return jsonify(error.to_dict()), error.status_code
    
    @blueprint.errorhandler(404)
    def handle_404(error: Any) -> Tuple[Dict[str, Any], int]:
        """Handle blueprint-specific 404 errors."""
        log_error(
            error,
            f"Resource not found in {blueprint.name}",
            level="warning",
            blueprint=blueprint.name
        )
        return jsonify({
            'error': 'NotFoundError',
            'message': f"Resource not found in {blueprint.name}",
            'status_code': 404
        }), 404
    
    @blueprint.errorhandler(500)
    def handle_500(error: Any) -> Tuple[Dict[str, Any], int]:
        """Handle blueprint-specific 500 errors."""
        log_error(
            error,
            f"Internal error in {blueprint.name}",
            blueprint=blueprint.name
        )
        return jsonify({
            'error': 'InternalServerError',
            'message': f"Internal error in {blueprint.name}",
            'status_code': 500
        }), 500 