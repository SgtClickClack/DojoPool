"""WSGI entry point."""

import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

try:
    from dojopool.app import create_app

    app = create_app("development")
    logger.info("Application created successfully")
except Exception as e:
    logger.error(f"Failed to create application: {e}")
    raise

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
