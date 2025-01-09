"""Load test module."""
import pytest
import time
import threading
import queue
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

from dojopool.models import User, Game, Role, Token
from dojopool.core.extensions import db

def test_concurrent_user_creation(app, _db):
    """Test concurrent user creation."""
    num_users = 100
    threads = []
    
    def create_user(i):
        with app.app_context():
            user = User(
                username=f'user{i}',
                email=f'user{i}@example.com',
                password='test_password'
            )
            db.session.add(user)
            db.session.commit()
    
    # Create users concurrently
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=10) as executor:
        for i in range(num_users):
            threads.append(executor.submit(create_user, i))
    
    # Wait for all threads to complete
    for thread in threads:
        thread.result()
    
    end_time = time.time()
    
    # Verify users were created
    with app.app_context():
        assert User.query.count() == num_users
        
    # Performance assertion
    assert end_time - start_time < 5  # Should complete within 5 seconds

def test_concurrent_game_creation(app, _db, user):
    """Test concurrent game creation."""
    num_games = 100
    threads = []
    
    def create_game(i):
        with app.app_context():
            game = Game(
                player1_id=user.id,
                player2_id=user.id,
                game_type='eight_ball',
                game_mode='casual',
                status='pending'
            )
            db.session.add(game)
            db.session.commit()
    
    # Create games concurrently
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=10) as executor:
        for i in range(num_games):
            threads.append(executor.submit(create_game, i))
    
    # Wait for all threads to complete
    for thread in threads:
        thread.result()
    
    end_time = time.time()
    
    # Verify games were created
    with app.app_context():
        assert Game.query.count() == num_games
        
    # Performance assertion
    assert end_time - start_time < 5  # Should complete within 5 seconds

def test_concurrent_token_creation(app, _db, user):
    """Test concurrent token creation."""
    num_tokens = 100
    threads = []
    
    def create_token(i):
        with app.app_context():
            token = Token(
                user_id=user.id,
                token_type='access',
                token=f'test-token-{i}',
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
            db.session.add(token)
            db.session.commit()
    
    # Create tokens concurrently
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=10) as executor:
        for i in range(num_tokens):
            threads.append(executor.submit(create_token, i))
    
    # Wait for all threads to complete
    for thread in threads:
        thread.result()
    
    end_time = time.time()
    
    # Verify tokens were created
    with app.app_context():
        assert Token.query.count() == num_tokens
        
    # Performance assertion
    assert end_time - start_time < 5  # Should complete within 5 seconds 