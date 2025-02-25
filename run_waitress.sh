#!/bin/bash
set -ex  # Enable command echoing and exit on error

# Optional: Activate your virtual environment if needed
# source venv/bin/activate

echo "Starting Waitress server on port 8000..."
waitress-serve --listen=*:8000 backend.wsgi:application 