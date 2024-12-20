"""Game state helpers for tests."""

from typing import Dict, List, Optional
from src.core.game.physics import Ball, Vector2D, PhysicsEngine

def create_test_ball(number: int, x: float, y: float) -> Ball:
    """Create a test ball with given position.
    
    Args:
        number: Ball number
        x: X position
        y: Y position
    
    Returns:
        Ball: Test ball instance
    """
    return Ball(
        position=Vector2D(x, y),
        velocity=Vector2D(0, 0),
        acceleration=Vector2D(0, 0),
        number=number,
        is_active=True
    )

def create_test_physics_engine() -> PhysicsEngine:
    """Create a test physics engine with default configuration.
    
    Returns:
        PhysicsEngine: Test physics engine instance
    """
    engine = PhysicsEngine()
    
    # Add standard pool balls in rack formation
    balls = [
        create_test_ball(0, 0.5, 0.5),  # Cue ball
        create_test_ball(1, 1.5, 0.5),  # First ball in rack
        create_test_ball(2, 1.6, 0.45),
        create_test_ball(3, 1.6, 0.55),
        create_test_ball(4, 1.7, 0.4),
        create_test_ball(5, 1.7, 0.5),
        create_test_ball(6, 1.7, 0.6),
        create_test_ball(7, 1.8, 0.35),
        create_test_ball(8, 1.8, 0.45),  # 8 ball
        create_test_ball(9, 1.8, 0.55),
        create_test_ball(10, 1.8, 0.65),
        create_test_ball(11, 1.9, 0.3),
        create_test_ball(12, 1.9, 0.4),
        create_test_ball(13, 1.9, 0.5),
        create_test_ball(14, 1.9, 0.6),
        create_test_ball(15, 1.9, 0.7)
    ]
    
    engine.balls = balls
    return engine

def create_test_game_state(
    player1_id: int,
    player2_id: int,
    current_player_id: Optional[int] = None
) -> Dict:
    """Create a test game state.
    
    Args:
        player1_id: ID of player 1
        player2_id: ID of player 2
        current_player_id: ID of current player (defaults to player1_id)
    
    Returns:
        Dict: Game state dictionary
    """
    return {
        'player1_id': player1_id,
        'player2_id': player2_id,
        'current_player_id': current_player_id or player1_id,
        'status': 'in_progress',
        'balls': {
            'on_table': list(range(1, 16)),
            'pocketed': [],
            'cue_ball': {'x': 0.5, 'y': 0.5}
        },
        'score': {
            str(player1_id): 0,
            str(player2_id): 0
        },
        'fouls': {
            str(player1_id): 0,
            str(player2_id): 0
        },
        'ball_assignment': {
            str(player1_id): None,
            str(player2_id): None
        },
        'last_shot': None,
        'history': []
    } 