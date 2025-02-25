import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from dojopool.app import create_app
from dojopool.core.extensions import db


def init_db():
    """Initialize the database with proper permissions."""
    app = create_app()

    # Get the database path
    instance_dir = Path(app.instance_path)
    db_path = instance_dir / "dojopool.db"

    print(f"Instance directory: {instance_dir}")
    print(f"Database path: {db_path}")

    # Create the instance directory with safe permissions
    instance_dir.mkdir(parents=True, exist_ok=True)
    os.chmod(instance_dir, 0o755)

    # Set database file permissions safely if the file exists
    if db_path.exists():
        os.chmod(db_path, 0o644)

    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print(f"Database initialized successfully at {db_path}")
            # Make the database file writable
            os.chmod(db_path, 0o666)
        except Exception as e:
            print(f"Error initializing database: {e}")
            # If database file doesn't exist, create it
            if not db_path.exists():
                db_path.touch(mode=0o666)
                db.create_all()
                print(f"Created new database file at {db_path}")


if __name__ == "__main__":
    init_db()
