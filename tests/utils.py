"""Test utilities module."""
import pytest
from dojopool.core.database import db
from dojopool.models import User, Role, Leaderboard
from dojopool.services.leaderboard_service import LeaderboardService

def create_test_user(username="testuser", email="test@example.com", password="password123"):
    """Create a test user."""
    user = User(
        username=username,
        email=email
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user

def create_test_role(name="test_role", description="Test role"):
    """Create a test role."""
    role = Role(
        name=name,
        description=description
    )
    db.session.add(role)
    db.session.commit()
    return role

def create_test_leaderboard(user_id, score=0):
    """Create a test leaderboard entry."""
    leaderboard = Leaderboard(
        user_id=user_id,
        score=score
    )
    db.session.add(leaderboard)
    db.session.commit()
    return leaderboard

def update_leaderboard(user_id, new_score):
    """Update a user's leaderboard score."""
    LeaderboardService.update_user_score(user_id, new_score)
    db.session.commit()