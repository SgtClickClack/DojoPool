# Monkey patch must happen before any other imports
import eventlet

eventlet.monkey_patch()

import os
import sys
from pathlib import Path

# Add the project root to Python path first
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Now import Flask-related modules
from dojopool.app import create_app
from dojopool.core.extensions import db


def setup_database():
    """Set up the database with proper permissions."""
    # Create the application instance
    app = create_app()

    # Get the database path
    instance_dir = Path(app.instance_path)
    db_path = instance_dir / "dojopool.db"

    print(f"Setting up database...")
    print(f"Instance directory: {instance_dir}")
    print(f"Database path: {db_path}")

    # Create instance directory if it doesn't exist
    instance_dir.mkdir(parents=True, exist_ok=True)

    # Initialize database within application context
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("Database tables created successfully!")

            # Ensure the database file has proper permissions
            if db_path.exists():
                os.chmod(db_path, 0o666)
                print("Database file permissions set.")

            return True
        except Exception as e:
            print(f"Error setting up database: {e}")
            return False


if __name__ == "__main__":
    if setup_database():
        print("Database setup completed successfully!")
    else:
        print("Database setup failed.")
