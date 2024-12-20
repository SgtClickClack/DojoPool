"""Test utilities and helpers."""
import functools
from contextlib import contextmanager
from sqlalchemy.orm import Session
from flask import current_app

class TransactionManager:
    """Helper class to manage database transactions in tests."""
    
    def __init__(self, session):
        self.session = session
        self.nested = None
    
    def __enter__(self):
        self.nested = self.session.begin_nested()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.nested.rollback()
        else:
            try:
                self.nested.commit()
            except:
                self.nested.rollback()
                raise

def cleanup_after_test(func):
    """Decorator to ensure proper cleanup after tests."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        from src.core.database import db
        try:
            with current_app.app_context():
                return func(*args, **kwargs)
        finally:
            try:
                if hasattr(db, 'session'):
                    db.session.remove()
                if hasattr(db, 'engine'):
                    db.engine.dispose()
            except:
                pass  # Ignore errors during cleanup
    return wrapper

@contextmanager
def assert_no_db_changes(session: Session):
    """Context manager to ensure no database changes are committed."""
    nested = session.begin_nested()
    try:
        yield
    finally:
        try:
            nested.rollback()
        except:
            pass  # Ignore errors during cleanup

class TestDataBuilder:
    """Helper class to build test data with proper relationships."""
    
    def __init__(self, session):
        self.session = session
    
    def create_user(self, username, email, role_name='user', commit=True):
        """Create a test user with role."""
        from src.models import User, Role
        
        try:
            with self.session.begin_nested():
                # Get or create role
                role = self.session.query(Role).filter_by(name=role_name).first()
                if not role:
                    role = Role(name=role_name, description=f'{role_name} role')
                    self.session.add(role)
                    self.session.flush()
                
                # Create user
                user = User(
                    username=username,
                    email=email,
                    email_verified=True,
                    first_name=f'Test {username}',
                    last_name='User'
                )
                user.set_password('password123')
                user.roles.append(role)
                
                self.session.add(user)
                self.session.flush()  # Ensure user has an ID
            
            if commit:
                try:
                    self.session.commit()
                except:
                    self.session.rollback()
                    raise
            
            return user
        except:
            self.session.rollback()
            raise
    
    def create_leaderboard_entry(self, user, type='overall', score=100.0, commit=True):
        """Create a test leaderboard entry."""
        from src.models import Leaderboard
        from src.services.leaderboard_service import LeaderboardService
        
        try:
            with self.session.begin_nested():
                entry = Leaderboard(
                    user_id=user.id,
                    type=type,
                    score=score,
                    games_played=10,
                    games_won=7,
                    tournaments_played=2,
                    tournaments_won=1
                )
                
                self.session.add(entry)
                self.session.flush()  # Ensure entry has an ID
            
            if commit:
                try:
                    self.session.commit()
                    # Update rankings after committing the entry
                    LeaderboardService.update_rankings(type)
                except:
                    self.session.rollback()
                    raise
            
            return entry
        except:
            self.session.rollback()
            raise