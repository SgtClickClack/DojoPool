"""Integration tests for complete game flow."""

import pytest
from src.core.auth.service import auth_service
from src.core.game.state import GameState
from src.core.game.events import GameEvent
from src.core.game.shot import Shot

def test_complete_game_flow(session, client):
    """Test a complete game flow from start to finish."""
    # 1. Register two players
    player1 = auth_service.register(
        username='player1',
        email='player1@example.com',
        password='StrongPass123!'
    )
    
    player2 = auth_service.register(
        username='player2',
        email='player2@example.com',
        password='StrongPass123!'
    )
    
    # 2. Authenticate players
    _, token1, _ = auth_service.authenticate(
        email='player1@example.com',
        password='StrongPass123!',
        device_info={'device': 'test'},
        ip_address='127.0.0.1'
    )
    
    _, token2, _ = auth_service.authenticate(
        email='player2@example.com',
        password='StrongPass123!',
        device_info={'device': 'test'},
        ip_address='127.0.0.1'
    )
    
    # 3. Create game room
    response = client.post(
        '/api/games',
        headers={'Authorization': f'Bearer {token1}'},
        json={'player_count': 2}
    )
    assert response.status_code == 201
    game_id = response.json['game_id']
    
    # 4. Second player joins
    response = client.post(
        f'/api/games/{game_id}/join',
        headers={'Authorization': f'Bearer {token2}'}
    )
    assert response.status_code == 200
    
    # 5. Start game
    response = client.post(
        f'/api/games/{game_id}/start',
        headers={'Authorization': f'Bearer {token1}'}
    )
    assert response.status_code == 200
    
    # 6. Play several turns
    # Player 1's turn
    shot1 = Shot(
        angle=0,
        power=1.0,
        spin=0,
        x=0,
        y=0
    )
    
    response = client.post(
        f'/api/games/{game_id}/shot',
        headers={'Authorization': f'Bearer {token1}'},
        json=shot1.to_dict()
    )
    assert response.status_code == 200
    
    # Player 2's turn
    shot2 = Shot(
        angle=45,
        power=0.8,
        spin=0.2,
        x=0,
        y=0
    )
    
    response = client.post(
        f'/api/games/{game_id}/shot',
        headers={'Authorization': f'Bearer {token2}'},
        json=shot2.to_dict()
    )
    assert response.status_code == 200
    
    # 7. Check game state
    response = client.get(
        f'/api/games/{game_id}',
        headers={'Authorization': f'Bearer {token1}'}
    )
    assert response.status_code == 200
    game_state = response.json
    
    assert game_state['status'] == 'active'
    assert len(game_state['events']) == 2  # Two shots taken
    
    # 8. End game
    response = client.post(
        f'/api/games/{game_id}/end',
        headers={'Authorization': f'Bearer {token1}'}
    )
    assert response.status_code == 200
    
    # 9. Verify final state
    response = client.get(
        f'/api/games/{game_id}',
        headers={'Authorization': f'Bearer {token1}'}
    )
    assert response.status_code == 200
    final_state = response.json
    
    assert final_state['status'] == 'completed'
    assert 'winner_id' in final_state
    assert 'final_score' in final_state

def test_game_error_handling(session, client):
    """Test error handling in game flow."""
    # 1. Register player
    player = auth_service.register(
        username='player',
        email='player@example.com',
        password='StrongPass123!'
    )
    
    # 2. Authenticate
    _, token, _ = auth_service.authenticate(
        email='player@example.com',
        password='StrongPass123!',
        device_info={'device': 'test'},
        ip_address='127.0.0.1'
    )
    
    # 3. Test invalid game creation
    response = client.post(
        '/api/games',
        headers={'Authorization': f'Bearer {token}'},
        json={'player_count': 0}  # Invalid player count
    )
    assert response.status_code == 400
    
    # 4. Test joining non-existent game
    response = client.post(
        '/api/games/999/join',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 404
    
    # 5. Create valid game
    response = client.post(
        '/api/games',
        headers={'Authorization': f'Bearer {token}'},
        json={'player_count': 2}
    )
    assert response.status_code == 201
    game_id = response.json['game_id']
    
    # 6. Test starting game without enough players
    response = client.post(
        f'/api/games/{game_id}/start',
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    
    # 7. Test invalid shot
    response = client.post(
        f'/api/games/{game_id}/shot',
        headers={'Authorization': f'Bearer {token}'},
        json={'angle': 1000}  # Invalid angle
    )
    assert response.status_code == 400 