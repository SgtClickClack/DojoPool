#!/usr/bin/env python3
"""
Direct database initialization script for DojoPool.
Creates all tables using the Flask app's existing database setup.
"""

import os
import sys
from pathlib import Path

# Add src to Python path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

# Set environment variables
os.environ['FLASK_ENV'] = 'development'
os.environ['FLASK_APP'] = 'dojopool'

try:
    from src.dojopool.app import create_app, db
    
    print("Creating Flask app...")
    app = create_app('development')
    
    with app.app_context():
        print("Creating all database tables...")
        
        # Get all tables from the app's metadata
        from sqlalchemy import inspect
        metadata = db.metadata
        
        print(f"Found {len(metadata.tables)} tables in metadata")
        
        # Create all tables
        db.create_all()
        print("✅ All tables created successfully!")
        
        # Check what tables were created
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"📋 Created tables: {tables}")
        
        print("✅ Database initialization complete!")
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're in the project root directory")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc() 