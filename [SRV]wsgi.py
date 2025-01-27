"""WSGI entry point."""
import os
import sys

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.dojopool.app import create_app

# Create the application instance
app = create_app('production')

if __name__ == '__main__':
    app.run() 