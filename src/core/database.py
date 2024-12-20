"""Database initialization and configuration module."""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy import MetaData
import logging

# Naming convention for database constraints
NAMING_CONVENTION = {
    "ix": 'ix_%(column_0_label)s',
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

# SQLAlchemy metadata with naming convention
metadata = MetaData(naming_convention=NAMING_CONVENTION)

# Create database and migration instances
db = SQLAlchemy(metadata=metadata)
migrate = Migrate()

logger = logging.getLogger(__name__)

def init_db(app):
    """
    Initialize the database and apply migrations.

    Args:
        app (Flask): The Flask application instance.

    Returns:
        SQLAlchemy: Configured SQLAlchemy database instance.
    """
    try:
        # Initialize SQLAlchemy with the Flask app
        db.init_app(app)
        
        # Initialize Flask-Migrate with the app and database
        migrate.init_app(app, db)
        
        # Create all tables and register models
        with app.app_context():
            # Clear any existing metadata to prevent conflicts
            db.metadata.clear()
            
            # Register all models
            register_models()
            
            # Create all tables
            db.create_all()
            
            logger.info("Database initialized successfully")
        
        return db
    
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

def register_models():
    """
    Import all models to ensure they are registered with SQLAlchemy.
    
    Models are imported in dependency order to prevent circular imports
    and ensure proper table creation order.
    
    Note:
        If adding new models, ensure they are imported here in the correct order.
    """
    try:
        # Core models
        from src.models.user import User
        from src.models.token import Token
        
        # Game-related models
        from src.models.game import Game
        from src.models.match import Match
        from src.models.tournament import Tournament
        
        # Location and venue models
        from src.models.location import Location
        from src.models.venue import Venue
        
        # Social models
        from src.models.chat import ChatMessage, ChatParticipant
        from src.models.friendship import Friendship
        
        # Achievement and rating models
        from src.models.achievement import Achievement
        from src.models.rating import Rating
        from src.models.leaderboard import Leaderboard
        
        # Review system models
        from src.models.review import (
            Review,
            ReviewResponse,
            ReviewReport,
            ReviewVote
        )
        
        logger.info("All models registered successfully")
        
        # Return list of models in creation order
        return [
            User, Token,
            Game, Match, Tournament,
            Location, Venue,
            ChatMessage, ChatParticipant,
            Friendship,
            Achievement, Rating, Leaderboard,
            Review, ReviewResponse, ReviewReport, ReviewVote
        ]
    
    except ImportError as e:
        logger.error(f"Failed to import models: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error during model registration: {str(e)}")
        raise

def reset_db(app):
    """
    Reset the database by dropping and recreating all tables.
    
    This is primarily used for testing purposes.
    
    Args:
        app (Flask): The Flask application instance.
    """
    with app.app_context():
        # Drop tables in reverse dependency order
        tables = [
            "review_votes",
            "review_reports",
            "review_responses",
            "reviews",
            "leaderboard",
            "rating",
            "achievement",
            "friendship",
            "venue",
            "tournament",
            "chat_participants",
            "chat_messages",
            "location",
            "match",
            "game",
            "token",
            "user",
        ]
        
        for table in tables:
            try:
                db.session.execute(f"DROP TABLE IF EXISTS {table}")
            except Exception as e:
                logger.warning(f"Failed to drop table {table}: {str(e)}")
                continue
        
        db.session.commit()
        
        # Recreate all tables
        db.create_all()
        logger.info("Database reset successfully")

# Optional: Additional configuration for logging or debugging
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Database configuration module loaded")