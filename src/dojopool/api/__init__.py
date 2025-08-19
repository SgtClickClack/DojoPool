"""
API package initialization.
"""

from .health import health_bp, init_app

__all__ = ["health_bp", "init_app"]
