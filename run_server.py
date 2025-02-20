"""
Run the DojoPool application using Waitress server.
"""

import logging

from waitress import serve

from dojopool import app  # Import app from the package root

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("Starting DojoPool server on http://0.0.0.0:8080")
    logger.info("Press Ctrl+C to stop the server")

    try:
        serve(app, host="0.0.0.0", port=8080, threads=4, url_scheme="http")
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        raise
