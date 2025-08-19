"""Tests for core game logic functionality."""

import pytest

from dojopool.core.exceptions import GameStateError, RuleViolationError
from dojopool.models.game import Game, GameStatus as GameState, Shot


@pytest.fixture
def game():
    """Create a test game instance."""
    return Game(player1_id="p1", player2_id="p2", game_type="8ball", handicap_enabled=False)


def test_game_initialization(game):
    """Test game initialization."""
    assert game.player1_id == "p1"
    assert game.player2_id == "p2"
    assert game.game_type == "8ball"
    assert game.state == GameState.WAITING
    assert not game.handicap_enabled
    assert game.current_player_id == "p1"
    assert not game.is_finished


def test_game_start(game):
    """Test game start functionality."""
    game.start()
    assert game.state == GameState.IN_PROGRESS
    assert game.start_time is not None
    assert game.current_player_id == "p1"


def test_invalid_game_start(game):
    """Test invalid game start scenarios."""
    game.start()
    with pytest.raises(GameStateError):
        game.start()


def test_shot_validation(game):
    """Test shot validation."""
    game.start()

    # Valid shot
    shot = Shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False)
    game.validate_shot(shot)

    # Invalid player shot
    invalid_shot = Shot(player_id="p2", ball_numbers=[2], pocketed=True, foul=False)
    with pytest.raises(RuleViolationError):
        game.validate_shot(invalid_shot)


def test_game_scoring(game):
    """Test game scoring functionality."""
    game.start()

    # Player 1 pockets a ball
    shot1 = Shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False)
    game.process_shot(shot1)
    assert game.get_score("p1") == 1
    assert game.get_score("p2") == 0

    # Player 1 misses
    shot2 = Shot(player_id="p1", ball_numbers=[], pocketed=False, foul=False)
    game.process_shot(shot2)
    assert game.current_player_id == "p2"


def test_game_fouls(game):
    """Test foul handling."""
    game.start()

    # Player 1 commits a foul
    foul_shot = Shot(player_id="p1", ball_numbers=[], pocketed=False, foul=True)
    game.process_shot(foul_shot)
    assert game.current_player_id == "p2"
    assert game.has_ball_in_hand


def test_game_completion(game):
    """Test game completion."""
    game.start()

    # Simulate winning scenario
    game.process_shot(
        Shot(player_id="p1", ball_numbers=[1, 2, 3, 4, 5, 6, 7], pocketed=True, foul=False)
    )
    game.process_shot(Shot(player_id="p1", ball_numbers=[8], pocketed=True, foul=False))

    assert game.state == GameState.COMPLETED
    assert game.winner_id == "p1"
    assert game.is_finished
    assert game.end_time is not None


def test_handicap_system(game):
    """Test handicap system."""
    game = Game(
        player1_id="p1",
        player2_id="p2",
        game_type="8ball",
        handicap_enabled=True,
        player1_handicap=2,
        player2_handicap=1,
    )

    game.start()
    assert game.get_player_handicap("p1") == 2
    assert game.get_player_handicap("p2") == 1


def test_game_statistics(game):
    """Test game statistics tracking."""
    game.start()

    shot1 = Shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False)
    game.process_shot(shot1)

    stats = game.get_statistics()
    assert stats["total_shots"] == 1
    assert stats["pocketed_balls"] == 1
    assert stats["fouls"] == 0
    assert "average_shot_time" in stats


def test_invalid_operations(game):
    """Test invalid game operations."""
    # Can't process shot before game starts
    with pytest.raises(GameStateError):
        game.process_shot(Shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False))

    # Can't end game before it starts
    with pytest.raises(GameStateError):
        game.end_game()

    game.start()
    game.end_game()

    # Can't process shot after game ends
    with pytest.raises(GameStateError):
        game.process_shot(Shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False))
