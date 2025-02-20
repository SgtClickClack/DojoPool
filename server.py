"""
DojoPool Server Script

This script runs the DojoPool application using Flask's development server.
"""

import logging
import os
import sys

# Add src directory to Python path
src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "src"))
sys.path.insert(0, src_dir)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG for more verbose output
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler("server.log")],
)

logger = logging.getLogger(__name__)


def run_server(host="0.0.0.0", port=8080):
    """Run the DojoPool server."""
    try:
        logger.info(f"Starting DojoPool server on http://{host}:{port}")
        logger.info("Press Ctrl+C to stop the server")

        # Import the app here to ensure Python path is set up
        logger.debug("Importing app...")
        from dojopool import app

        logger.debug("App imported successfully")

        # Run with Flask's development server
        logger.debug("Starting Flask development server...")
        app.run(host=host, port=port, debug=True)
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {str(e)}", exc_info=True)  # Add full traceback
        raise


def start_server() -> None:
    # Add server initialization logic here.
    print("Server started...")


if __name__ == "__main__":
    # Get port from environment variable if set
    port = int(os.getenv("PORT", 8080))
    run_server(port=port)
    start_server()
