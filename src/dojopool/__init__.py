from flask import Flask

"""
DojoPool Application

This module initializes the DojoPool application and registers Flask extensions,
blueprints, and other application components with full type annotations.
"""

# Directly import and expose create_app from the .app module (src/dojopool/app.py)
from .app import create_app

__version__ = "0.1.0"

# The setup_security_headers function was defined here but not called.
# If it's essential, it should be integrated into the create_app function in app.py.
# For now, it's removed from here to simplify __init__.py and focus on the import fix.

# def setup_security_headers(app):
#     """Setup security headers for Flask application."""
# 
#     @app.after_request
#     def add_security_headers(response):
#         # HSTS
#         response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
#         # Prevent MIME type sniffing
#         response.headers["X-Content-Type-Options"] = "nosniff"
#         # Content Security Policy
#         response.headers["Content-Security-Policy"] = (
#             "default-src 'self'; "
#             "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com; "
#             "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
#             "img-src 'self' data: https:; "
#             "font-src 'self' https://fonts.gstatic.com; "
#             "frame-ancestors 'self'; "
#             "object-src 'none'"
#         )
#         # Referrer Policy
#         response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
#         # Permissions Policy
#         response.headers["Permissions-Policy"] = "geolocation=(), " "microphone=(), " "camera=()"
#         return response
