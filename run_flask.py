import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add the src directory to the Python path
src_path = os.path.join(os.path.dirname(__file__), 'src')
sys.path.insert(0, src_path)

try:
    # Now import and run the Flask app
    from dojopool.app import create_app
    from dojopool.core.sockets import socketio
    from dojopool.config.development import DevelopmentConfig

    app = create_app('development')
    logger.info("Flask application created successfully")

    if __name__ == '__main__':
        logger.info("Starting Flask development server with SocketIO...")
        socketio.run(app, host='0.0.0.0', port=3101, debug=True, allow_unsafe_werkzeug=True)
except Exception as e:
    logger.error(f"Failed to start Flask application: {e}", exc_info=True)
    raise