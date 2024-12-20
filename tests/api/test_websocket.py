"""Tests for WebSocket events."""
import pytest
from flask import url_for
from flask_socketio import SocketIO
from src.models import Game, User

@pytest.mark.usefixtures('client')
class TestWebSocketEvents:
    """Test cases for WebSocket events."""
    
    @pytest.fixture(autouse=True)
    def setup_method(self, app, client, db_session):
        """Set up test data."""
        self.client = client
        self.db_session = db_session
        self.socketio = SocketIO(app)
        
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
    
    def test_connect(self):
        """Test client connection."""
        client = self.socketio.test_client(self.app)
        assert client.is_connected()
    
    def test_disconnect(self):
        """Test client disconnection."""
        client = self.socketio.test_client(self.app)
        client.disconnect()
        assert not client.is_connected()
    
    def test_join_game_room(self):
        """Test joining a game room."""
        client = self.socketio.test_client(self.app)
        client.emit('join', {'game_id': self.game.id})
        received = client.get_received()
        assert len(received) == 1
        assert received[0]['name'] == 'joined'
        assert received[0]['args'][0]['game_id'] == self.game.id
    
    def test_leave_game_room(self):
        """Test leaving a game room."""
        client = self.socketio.test_client(self.app)
        client.emit('join', {'game_id': self.game.id})
        client.emit('leave', {'game_id': self.game.id})
        received = client.get_received()
        assert len(received) == 2
        assert received[1]['name'] == 'left'
        assert received[1]['args'][0]['game_id'] == self.game.id
    
    def test_game_update(self):
        """Test game update event."""
        client = self.socketio.test_client(self.app)
        client.emit('join', {'game_id': self.game.id})
        
        # Update game
        self.game.status = 'completed'
        self.db_session.commit()
        
        # Emit update event
        self.socketio.emit('game_update', {
            'game_id': self.game.id,
            'status': 'completed'
        }, room=str(self.game.id))
        
        received = client.get_received()
        assert len(received) >= 2
        assert received[-1]['name'] == 'game_update'
        assert received[-1]['args'][0]['status'] == 'completed'
    
    def test_chat_message(self):
        """Test chat message event."""
        client = self.socketio.test_client(self.app)
        client.emit('join', {'game_id': self.game.id})
        
        message = {
            'game_id': self.game.id,
            'user_id': self.user.id,
            'message': 'Hello, world!'
        }
        client.emit('chat', message)
        
        received = client.get_received()
        assert len(received) >= 2
        assert received[-1]['name'] == 'chat'
        assert received[-1]['args'][0]['message'] == 'Hello, world!'
    
    def test_spectator_join(self):
        """Test spectator joining event."""
        client = self.socketio.test_client(self.app)
        client.emit('spectate', {'game_id': self.game.id})
        
        received = client.get_received()
        assert len(received) == 1
        assert received[0]['name'] == 'spectator_joined'
        assert received[0]['args'][0]['game_id'] == self.game.id
    
    def test_spectator_leave(self):
        """Test spectator leaving event."""
        client = self.socketio.test_client(self.app)
        client.emit('spectate', {'game_id': self.game.id})
        client.emit('stop_spectating', {'game_id': self.game.id})
        
        received = client.get_received()
        assert len(received) == 2
        assert received[1]['name'] == 'spectator_left'
        assert received[1]['args'][0]['game_id'] == self.game.id