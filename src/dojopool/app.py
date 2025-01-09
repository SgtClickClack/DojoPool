"""Application factory module."""
import os
from flask import Flask, jsonify, send_from_directory, current_app
from flask_wtf.csrf import CSRFProtect
from flask_socketio import SocketIO
import eventlet

from dojopool.extensions import db, migrate, mail
from dojopool.config import config

# Patch eventlet for better performance
eventlet.monkey_patch()

csrf = CSRFProtect()
socketio = SocketIO()

def create_app(config_name=None):
    """Create and configure the Flask application."""
    if not config_name:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configure static files
    app.static_folder = os.path.abspath('static')
    app.static_url_path = '/static'
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    csrf.init_app(app)
    
    # Initialize SocketIO
    socketio.init_app(app, 
                     message_queue=os.environ.get('REDIS_URL'),
                     cors_allowed_origins="*",
                     async_mode='eventlet',
                     logger=True,
                     engineio_logger=True)
    
    # Debug route to check static file configuration
    @app.route('/debug/static-config')
    def debug_static_config():
        return jsonify({
            'static_folder': app.static_folder,
            'static_url_path': app.static_url_path,
            'static_folder_exists': os.path.exists(app.static_folder),
            'index_exists': os.path.exists(os.path.join(app.static_folder, 'index.html')),
            'static_files': os.listdir(app.static_folder) if os.path.exists(app.static_folder) else []
        })
    
    # Serve index.html
    @app.route('/')
    def index():
        app.logger.info(f"Serving index.html from {app.static_folder}")
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            app.logger.error(f"Error serving index.html: {e}")
            return jsonify({"error": "Failed to serve index.html"}), 500
    
    # Health check endpoints
    @app.route('/api/health')
    def health_check():
        return jsonify({
            "status": "healthy",
            "services": {
                "web": "up",
                "websocket": "up",
                "redis": check_redis_connection(),
                "database": check_db_connection()
            }
        })
    
    @app.route('/api/health/db')
    def db_health_check():
        status = check_db_connection()
        return jsonify({"status": status})
    
    # WebSocket events
    @socketio.on('connect')
    def handle_connect():
        socketio.emit('status', {'data': 'Connected'})
        current_app.logger.info('Client connected')
    
    @socketio.on('disconnect')
    def handle_disconnect():
        current_app.logger.info('Client disconnected')
    
    # Register routes
    from dojopool.routes import register_routes
    register_routes(app)
    
    # Log application startup
    app.logger.info(f"Application started in {config_name} mode")
    app.logger.info(f"Static folder: {app.static_folder}")
    app.logger.info(f"Static URL path: {app.static_url_path}")
    
    return app

def check_db_connection():
    """Check database connection."""
    try:
        db.session.execute('SELECT 1')
        return "connected"
    except Exception:
        return "disconnected"

def check_redis_connection():
    """Check Redis connection."""
    try:
        from redis import Redis
        redis = Redis.from_url(os.environ.get('REDIS_URL'))
        redis.ping()
        return "connected"
    except Exception:
        return "disconnected"

def run_app(app):
    """Run the application with WebSocket support."""
    socketio.run(app, 
                host='0.0.0.0', 
                port=5000,
                use_reloader=True,
                log_output=True)

if __name__ == '__main__':
    app = create_app()
    run_app(app)