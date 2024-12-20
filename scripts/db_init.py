import os
import sys
from pathlib import Path

# Add the project root directory to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.insert(0, project_root)

from flask import Flask
from flask_migrate import Migrate
from core.extensions import db
from core.models import User, Game, Venue, Tournament

def init_db():
    """Initialize the database with migrations and initial setup."""
    # Create Flask app
    app = Flask(__name__)
    
    # Configure app
    app.config.update(
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/dojo_pool'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    with app.app_context():
        try:
            # Import migrations directory
            from core.migrations import versions
            
            # Run database migrations
            from flask_migrate import upgrade
            upgrade()
            print("Database migrations completed successfully!")
            
            # Check if we need to create an admin user
            admin_user = User.query.filter_by(is_admin=True).first()
            if not admin_user:
                admin = User(
                    username='admin',
                    email='admin@dojo-pool.com',
                    is_admin=True,
                    is_active=True
                )
                admin.set_password('admin')  # Remember to change this in production!
                db.session.add(admin)
                db.session.commit()
                print("Admin user created successfully!")
            
            # Create default venue types if needed
            print("Database initialization completed successfully!")
            return True
            
        except Exception as e:
            print(f"Error during database initialization: {str(e)}")
            return False

if __name__ == '__main__':
    success = init_db()
    sys.exit(0 if success else 1) 