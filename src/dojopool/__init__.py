"""
DojoPool application package.
"""

from .app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)

__all__ = ['create_app']
