from flask import Flask

"""
DojoPool Application

This module initializes the DojoPool application and registers Flask extensions,
blueprints, and other application components with full type annotations.
"""

__version__ = "0.1.0"

from dojopool.core.extensions import init_extensions

def create_app(config_name=None, test_config=None) -> Flask:
    """
    Create and configure the DojoPool Flask application.

    Args:
        config_name (str, optional): The configuration name to use.
        test_config (dict, optional): Any test overrides for app.config.

    Returns:
        Flask: The configured Flask application.
    """
    from dojopool.app import create_app as real_create_app
    return real_create_app(config_name=config_name, test_config=test_config)

def setup_security_headers(app):
    """Setup security headers for Flask application."""

    @app.after_request
    def add_security_headers(response):
        # HSTS
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "img-src 'self' data: https:; "
            "font-src 'self' https://fonts.gstatic.com; "
            "frame-ancestors 'self'; "
            "object-src 'none'"
        )
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Permissions Policy
        response.headers["Permissions-Policy"] = "geolocation=(), " "microphone=(), " "camera=()"
        return response
