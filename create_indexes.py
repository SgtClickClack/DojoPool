#!/usr/bin/env python3
"""
Database Index Creation Script for Performance Optimization
This script creates indexes on the users table and other tables for better query performance.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    logger.error("DATABASE_URL environment variable not set")
    sys.exit(1)

def create_indexes():
    """Create database indexes for performance optimization."""
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            logger.info("Connected to database successfully")
            
            # Start transaction
            trans = connection.begin()
            
            try:
                # User table indexes
                logger.info("Creating indexes for users table...")
                
                # Index for email lookups (already unique, but ensure it's optimized)
                connection.execute(text("""
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
                    ON users(email, is_active) 
                    WHERE is_active = true;
                """))
                
                # Index for username lookups
                connection.execute(text("""
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_active 
                    ON users(username, is_active) 
                    WHERE is_active = true;
                """))
                
                # Index for active users ordered by last login
                connection.execute(text("""
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_last_login 
                    ON users(is_active, last_login DESC) 
                    WHERE is_active = true;
                """))
                
                # Index for user creation date
                connection.execute(text("""
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at 
                    ON users(created_at DESC);
                """))
                
                # Index for login count (for analytics)
                connection.execute(text("""
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_login_count 
                    ON users(login_count DESC) 
                    WHERE login_count > 0;
                """))
                
                logger.info("User table indexes created successfully")
                
                # If there are other tables, add their indexes here
                # For example, if there's a games table:
                try:
                    connection.execute(text("""
                        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_games_user_id_created 
                        ON games(user_id, created_at DESC);
                    """))
                    logger.info("Games table indexes created successfully")
                except SQLAlchemyError as e:
                    logger.warning(f"Games table might not exist, skipping: {e}")
                
                # If there's a sessions table:
                try:
                    connection.execute(text("""
                        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id_active 
                        ON sessions(user_id, is_active) 
                        WHERE is_active = true;
                    """))
                    logger.info("Sessions table indexes created successfully")
                except SQLAlchemyError as e:
                    logger.warning(f"Sessions table might not exist, skipping: {e}")
                
                # Commit the transaction
                trans.commit()
                logger.info("All indexes created successfully!")
                
            except SQLAlchemyError as e:
                trans.rollback()
                logger.error(f"Error creating indexes: {e}")
                raise
                
    except SQLAlchemyError as e:
        logger.error(f"Database connection error: {e}")
        sys.exit(1)

def analyze_tables():
    """Analyze tables to update statistics after index creation."""
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            logger.info("Analyzing tables to update statistics...")
            
            # Analyze users table
            connection.execute(text("ANALYZE users;"))
            logger.info("Users table analyzed")
            
            # Analyze other tables if they exist
            try:
                connection.execute(text("ANALYZE games;"))
                logger.info("Games table analyzed")
            except SQLAlchemyError:
                pass
                
            try:
                connection.execute(text("ANALYZE sessions;"))
                logger.info("Sessions table analyzed")
            except SQLAlchemyError:
                pass
                
            logger.info("Table analysis completed")
            
    except SQLAlchemyError as e:
        logger.error(f"Error analyzing tables: {e}")

def check_existing_indexes():
    """Check what indexes already exist."""
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            logger.info("Checking existing indexes...")
            
            # Get all indexes for users table
            result = connection.execute(text("""
                SELECT 
                    indexname, 
                    indexdef
                FROM pg_indexes 
                WHERE tablename = 'users' 
                ORDER BY indexname;
            """))
            
            indexes = result.fetchall()
            logger.info(f"Found {len(indexes)} indexes on users table:")
            for index in indexes:
                logger.info(f"  - {index[0]}: {index[1]}")
                
    except SQLAlchemyError as e:
        logger.error(f"Error checking indexes: {e}")

def main():
    """Main function to run the index creation script."""
    
    logger.info("Starting database index creation script...")
    
    # Check existing indexes first
    check_existing_indexes()
    
    # Create new indexes
    create_indexes()
    
    # Analyze tables
    analyze_tables()
    
    logger.info("Database optimization completed successfully!")

if __name__ == "__main__":
    main()