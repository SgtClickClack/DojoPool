"""Simple script to run the Flask application."""

import sys
from pathlib import Path

# Add the project root to the Python path
project_root = str(Path(__file__).parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from dojopool.app import create_app

app = create_app()

if __name__ == "__main__":
    print("Starting Flask app on http://localhost:8080")
    app.run(host="0.0.0.0", port=8080, debug=True)
