"""Main application module."""
from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_login import LoginManager
import os
from dotenv import load_dotenv
import logging
from typing import Any, cast

from .auth.routes import auth_bp
from .core.auth.models import db, User

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(config_name=None):
    app = Flask(__name__)

    # Configure static and template folders explicitly
    static_folder = os.path.join(os.path.dirname(__file__), 'static')
    template_folder = os.path.join(os.path.dirname(__file__), 'templates')
    
    app.static_folder = static_folder
    app.template_folder = template_folder
    
    logger.debug(f"Static folder: {static_folder}")
    logger.debug(f"Template folder: {template_folder}")

    # Basic configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev')
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable cache during development
    app.config['GOOGLE_MAPS_API_KEY'] = os.getenv('GOOGLE_MAPS_API_KEY', 'AIzaSyC4UK9iLpZg8J7KbHfUHF0o5vaEyr5nrWw')
    app.config['GOOGLE_CLIENT_ID'] = os.getenv('GOOGLE_CLIENT_ID', '')
    app.config['GOOGLE_CLIENT_SECRET'] = os.getenv('GOOGLE_CLIENT_SECRET', '')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dojopool.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    login_manager = LoginManager()
    login_manager.init_app(app)
    # Cast to Any to avoid type error with login_view
    login_manager = cast(Any, login_manager)
    login_manager.login_view = 'auth.login'

    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')

    # Custom static data
    @app.route('/static/<path:filename>')
    def custom_static(filename):
        logger.debug(f"Serving static file: {filename}")
        return send_from_directory(static_folder, filename)

    @app.route('/')
    def index():
        logger.debug("Rendering landing page")
        api_key = app.config['GOOGLE_MAPS_API_KEY']
        logger.debug(f"Using Google Maps API key: {api_key}")
        return render_template('landing.html', api_key=api_key)

    @app.route('/map')
    def map_page():
        logger.debug("Rendering map page")
        api_key = app.config['GOOGLE_MAPS_API_KEY']
        return render_template('map.html', api_key=api_key)

    @app.route('/dashboard')
    def dashboard():
        logger.debug("Rendering dashboard page")
        return render_template('dashboard.html')

    @app.route('/marketplace')
    def marketplace():
        logger.debug("Rendering marketplace page")
        return render_template('marketplace.html')

    @app.route('/venues')
    def venues():
        logger.debug("Rendering venue list page")
        return render_template('venues.html')

    @app.route('/profile')
    def profile():
        logger.debug("Rendering profile page")
        return render_template('profile.html')

    @app.route('/settings')
    def settings():
        logger.debug("Rendering settings page")
        return render_template('settings.html')

    @app.route('/notifications')
    def notifications():
        logger.debug("Rendering notifications page")
        return render_template('notifications.html')

    @app.route('/game')
    def game():
        logger.debug("Rendering game page")
        return render_template('game.html')

    @app.route('/analytics')
    def analytics():
        logger.debug("Rendering analytics dashboard")
        return render_template('analytics.html')

    @app.route('/api/venues')
    def get_venues():
        """Return a list of sample venues."""
        logger.debug("Getting venues")
        # Sample venue data
        venues = [
            {
                'name': 'DojoPool London',
                'latitude': 51.5074,
                'longitude': -0.1278,
                'rating': 4.8,
                'current_players': 12,
                'tables_count': 8,
                'address': '123 Pool Street, London'
            },
            {
                'name': 'Cyber Cue Club',
                'latitude': 51.5225,
                'longitude': -0.1584,
                'rating': 4.5,
                'current_players': 8,
                'tables_count': 6,
                'address': '456 Game Road, London'
            },
            {
                'name': 'Digital 8-Ball',
                'latitude': 51.4975,
                'longitude': -0.1357,
                'rating': 4.7,
                'current_players': 15,
                'tables_count': 10,
                'address': '789 Virtual Lane, London'
            }
        ]
        return venues

    @app.route('/api/v1/maps/verify-key')
    def verify_maps_key():
        """Verify the Google Maps API key."""
        logger.debug("Verifying Google Maps API key")
        api_key = app.config['GOOGLE_MAPS_API_KEY']
        if not api_key:
            return {'valid': False, 'error': 'API key not configured'}, 400
        return {'valid': True, 'key': api_key}

    @app.route('/api/health')
    def health_check():
        logger.debug("Health check endpoint called")
        return {'status': 'healthy'}, 200

    return app

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True, host='0.0.0.0', port=5000) 