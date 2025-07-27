import os
import logging
from datetime import timedelta
from flask import Flask, request, redirect, url_for, flash, session
from flask_login import current_user, logout_user
from flask_socketio import SocketIO
from flask_cors import CORS
from extensions import db, login_manager
import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging with enhanced formatting
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
file_handler = logging.FileHandler('app.log')
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))
logger.addHandler(file_handler)

# Track connected clients with enhanced state management
connected_clients = {}

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Enhanced security configurations
    app.config.update(
        SECRET_KEY=os.environ.get("FLASK_SECRET_KEY"),
        SQLALCHEMY_DATABASE_URI=os.environ.get("DATABASE_URL"),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_ENGINE_OPTIONS={
            "pool_recycle": 300,
            "pool_pre_ping": True,
            "pool_size": 10,
            "max_overflow": 20
        },
        PERMANENT_SESSION_LIFETIME=timedelta(minutes=30),
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
        PREFERRED_URL_SCHEME='https',
        SESSION_PROTECTION='strong'
    )

    # Initialize CORS with specific origins
    CORS(app, resources={
        r"/*": {
            "origins": ["https://*.repl.co", "https://*.replit.dev"],
            "supports_credentials": True
        }
    })

    # Initialize Socket.IO with enhanced configuration
    socketio = SocketIO(
        app,
        cors_allowed_origins=["https://*.repl.co", "https://*.replit.dev"],
        ping_timeout=60,
        ping_interval=25,
        manage_session=False,
        logger=True,
        engineio_logger=True
    )

    @app.before_request
    def before_request():
        """Enhanced request handling with session validation"""
        # Skip auth routes to prevent redirect loops
        if request.path.startswith('/auth/'):
            return
            
        # Ensure HTTPS
        if not request.is_secure and app.env != "development":
            url = request.url.replace('http://', 'https://', 1)
            return redirect(url, code=301)
            
        # Check session activity
        if current_user.is_authenticated:
            last_activity = session.get('last_activity')
            if last_activity:
                last_activity = datetime.datetime.fromisoformat(last_activity)
                now = datetime.datetime.utcnow()
                if (now - last_activity).total_seconds() > 1800:  # 30 minutes
                    logout_user()
                    session.clear()
                    flash("Session expired. Please log in again.", "info")
                    return redirect(url_for('auth.login'))
                session['last_activity'] = now.isoformat()

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    
    login_manager.login_view = 'auth.login'
    login_manager.login_message = "Please log in to access this page."
    login_manager.login_message_category = "info"
    login_manager.session_protection = "strong"

    @login_manager.user_loader
    def load_user(user_id):
        """Load user by ID with enhanced error handling"""
        try:
            from models import User
            return User.query.get(int(user_id))
        except Exception as e:
            logger.error(f"Error loading user {user_id}: {str(e)}")
            return None

    with app.app_context():
        # Register blueprints
        from blueprints.auth import auth
        from blueprints.multiplayer import multiplayer
        from blueprints.umpire import umpire
        from routes import routes_bp
        
        app.register_blueprint(auth, url_prefix='/auth')
        app.register_blueprint(multiplayer, url_prefix='/multiplayer')
        app.register_blueprint(umpire, url_prefix='/umpire')
        app.register_blueprint(routes_bp)
        
        # Create database tables
        db.create_all()
        logger.info("Database tables created successfully")

    return app, socketio

# Application instance
app, socketio = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)