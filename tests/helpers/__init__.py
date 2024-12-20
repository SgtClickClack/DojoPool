"""Test helper functions."""

import json
from pathlib import Path
from typing import Dict, Any, Optional

def create_from_sample(sample_name: str, overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Create test data from a sample file.
    
    Args:
        sample_name: Name of the sample file (without .json extension)
        overrides: Optional dictionary of values to override in the sample
    
    Returns:
        Dict[str, Any]: Sample data with any overrides applied
    """
    samples_dir = Path(__file__).parent / 'samples'
    sample_file = samples_dir / f"{sample_name}.json"
    
    if not sample_file.exists():
        raise ValueError(f"Sample file not found: {sample_file}")
    
    with open(sample_file, 'r') as f:
        data = json.load(f)
    
    if overrides:
        data.update(overrides)
    
    return data

def create_test_game(player1_id: int, player2_id: int) -> Dict[str, Any]:
    """Create test game data.
    
    Args:
        player1_id: ID of player 1
        player2_id: ID of player 2
    
    Returns:
        Dict[str, Any]: Game data
    """
    return create_from_sample('game', {
        'player1_id': player1_id,
        'player2_id': player2_id
    })

def create_test_match(game_id: int, location_id: int) -> Dict[str, Any]:
    """Create test match data.
    
    Args:
        game_id: ID of the game
        location_id: ID of the location
    
    Returns:
        Dict[str, Any]: Match data
    """
    return create_from_sample('match', {
        'game_id': game_id,
        'location_id': location_id
    })

__all__ = ['create_from_sample', 'create_test_game', 'create_test_match'] 