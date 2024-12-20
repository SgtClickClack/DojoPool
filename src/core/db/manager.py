"""Database manager for DojoPool."""

import os
from pathlib import Path
from flask import current_app
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, text

class DatabaseManager:
    """Database management utilities."""
    
    def __init__(self, db: SQLAlchemy):
        """Initialize database manager.
        
        Args:
            db: SQLAlchemy instance
        """
        self.db = db
    
    def init_db(self):
        """Initialize the database."""
        with current_app.app_context():
            self.db.create_all()
            current_app.logger.info(f"Database initialized at: {current_app.config['SQLALCHEMY_DATABASE_URI']}")
    
    def reset_db(self):
        """Reset the database by dropping all tables and recreating them."""
        with current_app.app_context():
            self.db.drop_all()
            self.db.create_all()
            current_app.logger.info("Database reset completed")
    
    def backup_db(self, backup_dir: str = None):
        """Backup the database.
        
        Args:
            backup_dir: Directory to store backup (default: instance/backups)
        """
        if backup_dir is None:
            backup_dir = Path(current_app.instance_path) / 'backups'
        
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = Path(backup_dir) / f'backup_{timestamp}.sql'
        
        engine = create_engine(current_app.config['SQLALCHEMY_DATABASE_URI'])
        with engine.connect() as conn:
            with backup_file.open('w') as f:
                for table in self.db.metadata.sorted_tables:
                    result = conn.execute(text(f'SELECT * FROM {table.name}'))
                    for row in result:
                        f.write(f"INSERT INTO {table.name} VALUES {tuple(row)};\n")
        
        current_app.logger.info(f"Database backed up to: {backup_file}")
        return backup_file
    
    def restore_db(self, backup_file: str):
        """Restore database from backup.
        
        Args:
            backup_file: Path to backup file
        """
        if not os.path.exists(backup_file):
            raise FileNotFoundError(f"Backup file not found: {backup_file}")
        
        with current_app.app_context():
            self.reset_db()
            engine = create_engine(current_app.config['SQLALCHEMY_DATABASE_URI'])
            
            with engine.connect() as conn:
                with open(backup_file) as f:
                    for line in f:
                        if line.strip():
                            conn.execute(text(line.strip()))
                    conn.commit()
        
        current_app.logger.info(f"Database restored from: {backup_file}")
    
    def get_table_sizes(self):
        """Get sizes of all tables in the database.
        
        Returns:
            dict: Table names and their sizes
        """
        sizes = {}
        engine = create_engine(current_app.config['SQLALCHEMY_DATABASE_URI'])
        with engine.connect() as conn:
            for table in self.db.metadata.sorted_tables:
                result = conn.execute(text(f'SELECT COUNT(*) FROM {table.name}'))
                sizes[table.name] = result.scalar()
        return sizes 