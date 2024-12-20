"""Flask application entry point."""

from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin

# Initialize Flask extensions
db = SQLAlchemy()
login_manager = LoginManager()

# Define User model
class User(UserMixin, db.Model):
    """User model."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID."""
    return User.query.get(int(user_id))

def create_app():
    """Create Flask application."""
    app = Flask(__name__, 
                template_folder='src/templates',
                static_folder='src/static')
    
    # Basic configuration
    app.config.update(
        SECRET_KEY='dev-key-change-in-production',
        SQLALCHEMY_DATABASE_URI='sqlite:///dojopool.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Register blueprints
    from src.core.main.views import bp as main_bp
    app.register_blueprint(main_bp)
    
    # Basic route
    @app.route('/')
    def index():
        return render_template('index.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True) 