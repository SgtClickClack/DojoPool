"""Database initialization and configuration."""
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData, event
from sqlalchemy.orm import scoped_session, sessionmaker
import logging
from contextlib import contextmanager
from flask import current_app
from werkzeug.local import LocalStack

# Configure logging
logger = logging.getLogger(__name__)

# Configure naming convention for constraints
convention = {
    "ix": 'ix_%(column_0_label)s',
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

# Create SQLAlchemy instance with naming convention
db = SQLAlchemy(metadata=MetaData(naming_convention=convention))

# Create a local stack for SQLAlchemy sessions
_app_ctx_stack = LocalStack()

def _make_scoped_session(engine=None, **kwargs):
    """Create a scoped session factory.
    
    Args:
        engine: Optional SQLAlchemy engine instance
        **kwargs: Additional session options
        
    Returns:
        scoped_session: A scoped session factory
    """
    if engine is None:
        engine = db.engine
    
    options = {
        'bind': engine,
        'expire_on_commit': False,
        'autocommit': False,
        'autoflush': True
    }
    options.update(kwargs)
    
    factory = sessionmaker(**options)
    session = scoped_session(factory)
    
    return session

def init_db(app):
    """Initialize the database with the Flask application.
    
    Args:
        app: Flask application instance
    """
    db.init_app(app)
    
    # Import all models to ensure they are registered
    from src.models import (
        User, Game, Tournament, Venue, Role, Location, Match,
        Achievement, UserAchievement, Rating, Leaderboard, UserReward,
        Review, ReviewResponse, ReviewReport, ReviewVote, Notification,
        Session, Token
    )
    
    # Create all tables if they don't exist
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create default roles if they don't exist
        default_roles = [
            Role(name='admin', description='Administrator role'),
            Role(name='user', description='Regular user role'),
            Role(name='moderator', description='Moderator role')
        ]
        for role in default_roles:
            if not Role.query.filter_by(name=role.name).first():
                db.session.add(role)
        try:
            db.session.commit()
        except Exception as e:
            logger.error(f"Error creating default roles: {str(e)}")
            db.session.rollback()
    
    # Register event listeners for session cleanup
    @event.listens_for(db.session, 'after_commit')
    def after_commit(session):
        """Clean up session after commit."""
        session.close()
    
    @event.listens_for(db.session, 'after_rollback')
    def after_rollback(session):
        """Clean up session after rollback."""
        session.close()
    
    # Register event listener for session creation
    @event.listens_for(db.session, 'after_begin')
    def after_begin(session, transaction, connection):
        """Initialize session after begin."""
        session.expire_on_commit = False
    
    return db

@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations.
    
    Yields:
        session: SQLAlchemy session
    """
    session = _make_scoped_session()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.remove()