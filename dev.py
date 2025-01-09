"""Development server startup script."""
import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def start_development_server():
    """Start the development server with proper error handling."""
    try:
        from dojopool.app import create_app
        
        # Create and configure the application
        app = create_app('development')
        
        # Log startup information
        logger.info("Starting development server...")
        logger.info(f"Main application port: {app.config.get('PORT', 5000)}")
        logger.info(f"WebSocket port: {app.config.get('WEBSOCKET_PORT', 5001)}")
        
        return app
        
    except ImportError as e:
        logger.error(f"Failed to import required modules: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to start development server: {e}")
        sys.exit(1)

app = start_development_server() 