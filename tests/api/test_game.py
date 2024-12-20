"""Tests for game API endpoints."""
import pytest
from flask import url_for
from src.models import Game, User
from .base import ApiTestBase

@pytest.mark.usefixtures('client')
class TestGameApi(ApiTestBase):
    """Test cases for game API endpoints."""
    
    @pytest.fixture(autouse=True)
    def setup_method(self, client, db_session):
        """Set up test data."""
        self.client = client
        self.db_session = db_session
        
        # Create test user
        self.user = User(
            username='testuser',
            email='test@example.com'
        )
        self.user.set_password('password')
        self.user.is_verified = True
        self.db_session.add(self.user)
        
        # Create test game
        self.game = Game(
            player_id=self.user.id,
            status='active'
        )
        self.db_session.add(self.game)
        self.db_session.commit()
    
    def test_list_games(self, auth_headers):
        """Test listing games."""
        response = self.client.get(
            url_for('api.list_games'),
            headers=auth_headers
        )
        assert response.status_code == 200
        assert len(response.json) == 1
    
    def test_get_game(self, auth_headers):
        """Test getting a specific game."""
        response = self.client.get(
            url_for('api.get_game', game_id=self.game.id),
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json['id'] == self.game.id
    
    def test_create_game(self, auth_headers):
        """Test creating a new game."""
        data = {
            'player_id': self.user.id,
            'status': 'active'
        }
        response = self.client.post(
            url_for('api.create_game'),
            json=data,
            headers=auth_headers
        )
        assert response.status_code == 201
        assert response.json['player_id'] == self.user.id
    
    def test_update_game(self, auth_headers):
        """Test updating a game."""
        data = {'status': 'completed'}
        response = self.client.put(
            url_for('api.update_game', game_id=self.game.id),
            json=data,
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json['status'] == 'completed'
    
    def test_delete_game(self, auth_headers):
        """Test deleting a game."""
        response = self.client.delete(
            url_for('api.delete_game', game_id=self.game.id),
            headers=auth_headers
        )
        assert response.status_code == 204
        assert Game.query.get(self.game.id) is None 