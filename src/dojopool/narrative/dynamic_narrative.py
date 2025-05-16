"""
Dynamic Narrative Module

This module generates dynamic, context-aware narratives for DojoPool matches.
Enhanced with full type annotations and comprehensive docstrings.
"""

from typing import Dict, Any

def generate_narrative(game_state: Dict[str, Any]) -> str:
    """
    Generate a dynamic narrative based on the current game state.

    Args:
        game_state (Dict[str, Any]): A dictionary containing game state information such as scores,
                                     player names, and additional context.

    Returns:
        str: A dynamically generated narrative describing the match.
    """
    player1 = game_state.get("player1", "Player 1")
    player2 = game_state.get("player2", "Player 2")
    score1 = game_state.get("score1", 0)
    score2 = game_state.get("score2", 0)
    
    if score1 > score2:
        lead = f"{player1} is leading"
    elif score2 > score1:
        lead = f"{player2} is leading"
    else:
        lead = "The game is tied"

    narrative = f"In a thrilling match, {lead} with scores {score1} to {score2}."
    return narrative

if __name__ == "__main__":
    sample_game_state = {"player1": "John", "player2": "Jane", "score1": 5, "score2": 3}
    print("Generated narrative:", generate_narrative(sample_game_state))
