"""
DojoPool Server
--------------
WSGI server configuration using Waitress.
"""

import logging
import multiprocessing
import os
import sys
from pathlib import Path

from waitress import serve

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("dojopool.log")],
)
logger = logging.getLogger(__name__)

# Add the src directory to Python path if not already there
src_path = Path(__file__).parent.parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))


def get_optimal_threads():
    """Calculate optimal number of threads based on CPU cores."""
    cpu_count = multiprocessing.cpu_count()
    return min(cpu_count * 2, 8)  # Max 8 threads, 2 per CPU core


def start_server(
    host: str = "0.0.0.0",
    port: int = 8080,
    threads: int = None,
    url_scheme: str = "http",
) -> None:
    """
    Start the Waitress server with the DojoPool application.

    Args:
        host: Host address to bind to
        port: Port number to listen on
        threads: Number of threads to use (defaults to CPU count * 2, max 8)
        url_scheme: URL scheme (http/https)
    """
    try:
        # Import the app
        from dojopool.app import create_app

        app = create_app()

        # Calculate optimal thread count if not specified
        if threads is None:
            threads = get_optimal_threads()

        logger.info(f"Starting DojoPool server on {url_scheme}://{host}:{port}")
        logger.info(f"Using {threads} threads")

        serve(
            app,
            host=host,
            port=port,
            threads=threads,
            url_scheme=url_scheme,
            clear_untrusted_proxy_headers=True,
            channel_timeout=30,
            cleanup_interval=30,
            connection_limit=1024,
            max_request_header_size=16384,
            max_request_body_size=10485760,  # 10MB
            ident="DojoPool/1.0",
            _quiet=False,  # Show Waitress logs
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        raise


def main():
    """Main entry point for the server."""
    # Get configuration from environment variables
    host = os.getenv("DOJOPOOL_HOST", "0.0.0.0")
    port = int(os.getenv("DOJOPOOL_PORT", "8080"))
    threads = int(os.getenv("DOJOPOOL_THREADS", "0")) or None
    url_scheme = os.getenv("DOJOPOOL_URL_SCHEME", "http")

    # Start the server
    start_server(host=host, port=port, threads=threads, url_scheme=url_scheme)


if __name__ == "__main__":
    main()
