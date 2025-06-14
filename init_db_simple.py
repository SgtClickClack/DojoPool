#!/usr/bin/env python3
"""
Simple database initialization script for DojoPool.
Creates all tables without importing problematic models.
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
        
        # Import models one by one to avoid circular imports
        print("Importing models...")
        
        # Import base models first
        from src.dojopool.models.user import User
        from src.dojopool.models.venue import Venue
        from src.dojopool.models.tournament import Tournament
        from src.dojopool.models.wallet import Wallet
        
        print("Creating tables...")
        db.create_all()
        print("✅ All tables created successfully!")
        
        # Check what tables were created
        from sqlalchemy import inspect
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