"""Match state helpers for tests."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from src.models.match import Match
from src.models.location import Location

def create_test_match_state(
    game_id: int,
    location_id: int,
    player1_id: int,
    player2_id: int,
    start_time: Optional[datetime] = None
) -> Dict:
    """Create a test match state.
    
    Args:
        game_id: ID of the game
        location_id: ID of the location
        player1_id: ID of player 1
        player2_id: ID of player 2
        start_time: Match start time (defaults to now)
    
    Returns:
        Dict: Match state dictionary
    """
    if start_time is None:
        start_time = datetime.utcnow()
    
    return {
        'game_id': game_id,
        'location_id': location_id,
        'status': 'in_progress',
        'players': {
            'player1': {
                'id': player1_id,
                'ready': True,
                'connected': True
            },
            'player2': {
                'id': player2_id,
                'ready': True,
                'connected': True
            }
        },
        'schedule': {
            'start_time': start_time.isoformat(),
            'end_time': None,
            'duration': None
        },
        'score': {
            str(player1_id): 0,
            str(player2_id): 0
        },
        'stats': {
            'shots_taken': {
                str(player1_id): 0,
                str(player2_id): 0
            },
            'accuracy': {
                str(player1_id): 0.0,
                str(player2_id): 0.0
            },
            'avg_shot_time': {
                str(player1_id): 0.0,
                str(player2_id): 0.0
            }
        },
        'spectators': [],
        'chat_messages': [],
        'events': []
    }

def create_scheduled_match(
    game_id: int,
    location_id: int,
    player1_id: int,
    player2_id: int,
    scheduled_time: Optional[datetime] = None
) -> Dict:
    """Create a scheduled match state.
    
    Args:
        game_id: ID of the game
        location_id: ID of the location
        player1_id: ID of player 1
        player2_id: ID of player 2
        scheduled_time: Scheduled match time (defaults to 1 hour from now)
    
    Returns:
        Dict: Scheduled match state dictionary
    """
    if scheduled_time is None:
        scheduled_time = datetime.utcnow() + timedelta(hours=1)
    
    match_state = create_test_match_state(
        game_id,
        location_id,
        player1_id,
        player2_id,
        scheduled_time
    )
    match_state['status'] = 'scheduled'
    match_state['players']['player1']['ready'] = False
    match_state['players']['player2']['ready'] = False
    
    return match_state

def create_completed_match(
    game_id: int,
    location_id: int,
    player1_id: int,
    player2_id: int,
    winner_id: int,
    start_time: Optional[datetime] = None,
    duration_minutes: int = 30
) -> Dict:
    """Create a completed match state.
    
    Args:
        game_id: ID of the game
        location_id: ID of the location
        player1_id: ID of player 1
        player2_id: ID of player 2
        winner_id: ID of the winner
        start_time: Match start time (defaults to now - duration)
        duration_minutes: Match duration in minutes
    
    Returns:
        Dict: Completed match state dictionary
    """
    if start_time is None:
        start_time = datetime.utcnow() - timedelta(minutes=duration_minutes)
    
    end_time = start_time + timedelta(minutes=duration_minutes)
    
    match_state = create_test_match_state(
        game_id,
        location_id,
        player1_id,
        player2_id,
        start_time
    )
    match_state['status'] = 'completed'
    match_state['schedule']['end_time'] = end_time.isoformat()
    match_state['schedule']['duration'] = duration_minutes * 60
    
    # Set winner's score
    loser_id = player2_id if winner_id == player1_id else player1_id
    match_state['score'][str(winner_id)] = 1
    match_state['score'][str(loser_id)] = 0
    
    return match_state 