"""
Run the Flask application.
"""

import os
import logging

from dojopool.core.extensions import socketio
from dojopool.app import create_app

# Professional entrypoint for running the Flask+SocketIO app in dev or prod

if __name__ == "__main__":
    # Create the application instance
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    ssl_mode = os.environ.get("FLASK_SSL", "off").lower() == "on"
    protocol = "https" if ssl_mode else "http"
    ws_protocol = "wss" if ssl_mode else "ws"

    # Improved startup logging
    logging.info("\n========== Flask/SocketIO Startup ==========")
    logging.info(f"App: [PY]run.py")
    logging.info(f"Port: {port}")
    logging.info(f"SSL Mode: {'ON' if ssl_mode else 'OFF'}")
    logging.info(f"URL: {protocol}://127.0.0.1:{port}")
    logging.info(f"WebSocket URL: {ws_protocol}://127.0.0.1:{port}")
    logging.info("============================================\n")

    # Check if port is available before starting
    import socket
    import sys
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(("127.0.0.1", port))
        sock.close()
    except OSError as e:
        logging.error(f"Port {port} is already in use or unavailable: {e}")
        sys.exit(1)

    # Run the app with correct async/SSL handling
    import eventlet
    async_mode = getattr(socketio, 'async_mode', 'eventlet')
    if async_mode in ('eventlet', 'gevent'):
        socketio.run(
            app,
            host="127.0.0.1",
            port=port,
            debug=True,
            use_reloader=False,
        )
    else:
        socketio.run(
            app,
            host="127.0.0.1",
            port=port,
            debug=True,
            ssl_context='adhoc' if ssl_mode else None,
            use_reloader=False,
        )
