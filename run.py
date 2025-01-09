"""
Run the Flask application.
"""

from gevent import monkey
monkey.patch_all()

from src.app import create_app
from src.core.config.websocket import WEBSOCKET_CONFIG

# Create Flask application
app, socketio = create_app()

if __name__ == '__main__':
    # Run the application with SocketIO
    socketio.run(app, 
                host=WEBSOCKET_CONFIG['host'],
                port=WEBSOCKET_CONFIG['port'],
                debug=True,
                use_reloader=True,
                log_output=True,
                allow_unsafe_werkzeug=True)