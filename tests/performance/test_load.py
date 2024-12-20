"""Performance tests for load testing."""

import time
import pytest
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict

from src.core.auth.service import auth_service
from src.core.game.shot import Shot

def create_test_user(index: int) -> Dict[str, str]:
    """Create a test user and return their credentials."""
    username = f'loadtest_user_{index}'
    email = f'loadtest_{index}@example.com'
    password = 'StrongPass123!'
    
    user = auth_service.register(
        username=username,
        email=email,
        password=password
    )
    
    _, access_token, _ = auth_service.authenticate(
        email=email,
        password=password,
        device_info={'device': 'loadtest'},
        ip_address='127.0.0.1'
    )
    
    return {
        'user_id': user.id,
        'token': access_token
    }

def simulate_game_session(client, user1: Dict, user2: Dict) -> Dict:
    """Simulate a complete game session between two players."""
    start_time = time.time()
    metrics = {'api_calls': [], 'errors': []}
    
    try:
        # Create game
        t0 = time.time()
        response = client.post(
            '/api/games',
            headers={'Authorization': f'Bearer {user1["token"]}'},
            json={'player_count': 2}
        )
        metrics['api_calls'].append(('create_game', time.time() - t0))
        
        if response.status_code != 201:
            metrics['errors'].append(('create_game', response.status_code))
            return metrics
            
        game_id = response.json['game_id']
        
        # Second player joins
        t0 = time.time()
        response = client.post(
            f'/api/games/{game_id}/join',
            headers={'Authorization': f'Bearer {user2["token"]}'}
        )
        metrics['api_calls'].append(('join_game', time.time() - t0))
        
        if response.status_code != 200:
            metrics['errors'].append(('join_game', response.status_code))
            return metrics
        
        # Start game
        t0 = time.time()
        response = client.post(
            f'/api/games/{game_id}/start',
            headers={'Authorization': f'Bearer {user1["token"]}'}
        )
        metrics['api_calls'].append(('start_game', time.time() - t0))
        
        # Simulate 10 turns
        for i in range(10):
            current_token = user1["token"] if i % 2 == 0 else user2["token"]
            
            shot = Shot(
                angle=45,
                power=0.8,
                spin=0.1,
                x=0,
                y=0
            )
            
            t0 = time.time()
            response = client.post(
                f'/api/games/{game_id}/shot',
                headers={'Authorization': f'Bearer {current_token}'},
                json=shot.to_dict()
            )
            metrics['api_calls'].append((f'shot_{i}', time.time() - t0))
            
            if response.status_code != 200:
                metrics['errors'].append((f'shot_{i}', response.status_code))
                break
            
            # Small delay between shots
            time.sleep(0.1)
        
        # End game
        t0 = time.time()
        response = client.post(
            f'/api/games/{game_id}/end',
            headers={'Authorization': f'Bearer {user1["token"]}'}
        )
        metrics['api_calls'].append(('end_game', time.time() - t0))
        
    except Exception as e:
        metrics['errors'].append(('exception', str(e)))
    
    metrics['total_time'] = time.time() - start_time
    return metrics

def test_concurrent_games(session, client):
    """Test multiple concurrent game sessions."""
    NUM_CONCURRENT_GAMES = 10
    metrics = []
    
    # Create test users
    users = []
    for i in range(NUM_CONCURRENT_GAMES * 2):  # Two users per game
        users.append(create_test_user(i))
    
    # Create pairs of users for games
    user_pairs = [(users[i], users[i+1]) for i in range(0, len(users), 2)]
    
    # Run concurrent game sessions
    with ThreadPoolExecutor(max_workers=NUM_CONCURRENT_GAMES) as executor:
        future_to_game = {
            executor.submit(simulate_game_session, client, pair[0], pair[1]): i
            for i, pair in enumerate(user_pairs)
        }
        
        for future in as_completed(future_to_game):
            game_num = future_to_game[future]
            try:
                game_metrics = future.result()
                metrics.append((game_num, game_metrics))
            except Exception as e:
                metrics.append((game_num, {'errors': [('thread_exception', str(e))]}))
    
    # Analyze results
    total_errors = sum(len(m[1]['errors']) for m in metrics)
    avg_game_time = sum(m[1]['total_time'] for m in metrics) / len(metrics)
    
    print(f"\nLoad Test Results:")
    print(f"Number of concurrent games: {NUM_CONCURRENT_GAMES}")
    print(f"Total errors: {total_errors}")
    print(f"Average game time: {avg_game_time:.2f} seconds")
    
    # API call timing statistics
    api_timings = {}
    for _, m in metrics:
        for call_name, timing in m['api_calls']:
            if call_name not in api_timings:
                api_timings[call_name] = []
            api_timings[call_name].append(timing)
    
    print("\nAPI Call Statistics:")
    for call_name, timings in api_timings.items():
        avg_time = sum(timings) / len(timings)
        max_time = max(timings)
        print(f"{call_name:15} Avg: {avg_time:.3f}s  Max: {max_time:.3f}s")
    
    # Assert performance requirements
    assert total_errors == 0, f"Load test had {total_errors} errors"
    assert avg_game_time < 30.0, f"Average game time ({avg_game_time:.2f}s) exceeded limit"
    
    for call_name, timings in api_timings.items():
        avg_time = sum(timings) / len(timings)
        assert avg_time < 1.0, f"Average time for {call_name} ({avg_time:.3f}s) exceeded limit" 