"""
DojoPool application package.
"""

# Version of the dojopool package
__version__ = "1.0.0"

from .app import create_app

__all__ = ['create_app']
