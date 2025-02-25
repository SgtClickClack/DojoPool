"""
Script to run the Django application with Waitress.
"""

import os
import sys
from pathlib import Path

# Get the absolute path of the project root directory
PROJECT_ROOT = Path(__file__).resolve().parent

# Add the project root directory to the Python path
sys.path.insert(0, str(PROJECT_ROOT))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django
import django

django.setup()

from django.core.wsgi import get_wsgi_application
from waitress import serve

if __name__ == '__main__':
    # Configure host and port
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '8000'))

    print(f"Starting Waitress server on {host}:{port}...")
    print(f"Using settings module: {os.environ['DJANGO_SETTINGS_MODULE']}")
    print(f"Project root: {PROJECT_ROOT}")

    # Get the WSGI application
    application = get_wsgi_application()

    # Start the server
    serve(
        application,
        host=host,
        port=port,
        threads=int(os.getenv('WAITRESS_THREADS', '4')),
        url_scheme=os.getenv('URL_SCHEME', 'http')
    )
