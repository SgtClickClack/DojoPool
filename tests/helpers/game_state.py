"""Helper functions for game state testing."""
from dojopool.core.game.state import GameState, GameStatus
from dojopool.core.game.shot import Shot, ShotType
from dojopool.models import Game, User
from dojopool.core.db import db

def create_test_game(creator_id, game_type="eight_ball", status=GameStatus.CREATED):
    """Create a test game."""
    game = Game(
        game_type=game_type,
        creator_id=creator_id,
        status=status
    )
    db.session.add(game)
    db.session.commit()
    return game

def create_test_game_state(player1_id, player2_id, game_type="eight_ball"):
    """Create a test game state."""
    game_state = GameState.create_new(
        game_type=game_type,
        player1_id=player1_id,
        player2_id=player2_id
    )
    game_state.start()
    return game_state

def take_test_shot(game_state, player_id, power=0.8, angle=45.0):
    """Take a test shot."""
    shot = Shot(
        type=ShotType.NORMAL,
        power=power,
        angle=angle,
        player_id=player_id
    )
    return game_state.process_shot(shot)

def complete_test_game(game_state, winner_id):
    """Complete a test game."""
    game_state.end(winner_id=winner_id)
    assert game_state.status == GameStatus.COMPLETED
    assert game_state.winner_id == winner_id 