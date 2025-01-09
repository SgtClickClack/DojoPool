"""Performance test module."""
import pytest
import time
from datetime import datetime, timedelta

from dojopool.models import User, Game, Role, Token
from dojopool.core.extensions import db

def test_user_creation_performance(app, _db):
    """Test user creation performance."""
    start_time = time.time()
    
    # Create 1000 users
    with app.app_context():
        for i in range(1000):
            user = User(
                username=f'user{i}',
                email=f'user{i}@example.com',
                password='test_password'
            )
            db.session.add(user)
        db.session.commit()
    
    end_time = time.time()
    duration = end_time - start_time
    
    # Verify users were created
    with app.app_context():
        assert User.query.count() == 1000
        
    # Performance assertion
    assert duration < 5  # Should complete within 5 seconds

def test_game_creation_performance(app, _db, user):
    """Test game creation performance."""
    start_time = time.time()
    
    # Create 1000 games
    with app.app_context():
        for i in range(1000):
            game = Game(
                player1_id=user.id,
                player2_id=user.id,
                game_type='eight_ball',
                game_mode='casual',
                status='pending'
            )
            db.session.add(game)
        db.session.commit()
    
    end_time = time.time()
    duration = end_time - start_time
    
    # Verify games were created
    with app.app_context():
        assert Game.query.count() == 1000
        
    # Performance assertion
    assert duration < 5  # Should complete within 5 seconds

def test_token_creation_performance(app, _db, user):
    """Test token creation performance."""
    start_time = time.time()
    
    # Create 1000 tokens
    with app.app_context():
        for i in range(1000):
            token = Token(
                user_id=user.id,
                token_type='access',
                token=f'test-token-{i}',
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
            db.session.add(token)
        db.session.commit()
    
    end_time = time.time()
    duration = end_time - start_time
    
    # Verify tokens were created
    with app.app_context():
        assert Token.query.count() == 1000
        
    # Performance assertion
    assert duration < 5  # Should complete within 5 seconds 