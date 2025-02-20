"""WSGI entry point for the DojoPool application."""

import logging
import os
import sys
from pathlib import Path

from waitress import serve

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add the src directory to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from dojopool.app import create_app

# Create app instance
app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    threads = min((os.cpu_count() or 1) * 2, 8)  # 2 threads per CPU, max 8

    logger.info(f"Starting DojoPool server with waitress on http://0.0.0.0:{port}")
    logger.info(f"Using {threads} threads")

    serve(
        app,
        host="0.0.0.0",  # Listen on all interfaces
        port=port,
        threads=threads,
        url_scheme="http",
        clear_untrusted_proxy_headers=True,
        _quiet=False,  # Show waitress logs
    )
