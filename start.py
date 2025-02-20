import os
import sys

import eventlet

# Set environment variables
os.environ["PYTHONPATH"] = "."
os.environ["FLASK_APP"] = "src/dojopool/app.py"
os.environ["FLASK_ENV"] = "development"

# Monkey patch
eventlet.monkey_patch()

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath("."))

# Import and run the application
from dojopool.app import create_app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
