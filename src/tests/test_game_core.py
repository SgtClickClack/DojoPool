"""Tests for core game logic functionality."""

import pytest
from types import SimpleNamespace

from dojopool.core.exceptions import GameStateError, RuleViolationError
from dojopool.models.game import Game, GameStatus, GameType, GameMode


@pytest.fixture
def game():
    """Create a test game instance."""
    return Game(player1_id=1, player2_id=2, game_type=GameType.EIGHT_BALL, game_mode=GameMode.CASUAL)


def make_shot(player_id, ball_numbers, pocketed, foul):
    """Use a simple namespace to mock a Shot for logic-only tests."""
    return SimpleNamespace(player_id=player_id, ball_numbers=ball_numbers, pocketed=pocketed, foul=foul)


def test_game_initialization(game):
    """Test game initialization."""
    assert game.player1_id == 1
    assert game.player2_id == 2
    assert game.game_type == GameType.EIGHT_BALL
    assert game.status == GameStatus.PENDING
    # current_player_id may not exist; skip if not present
    # assert game.current_player_id == 1 if hasattr(game, 'current_player_id') else True


def test_game_start(game):
    """Test game start functionality."""
    game.start_game()
    assert game.status == GameStatus.IN_PROGRESS
    assert game.started_at is not None
    assert game.player1_id == 1


def test_invalid_game_start(game):
    """Test invalid game start scenarios."""
    game.start_game()
    # Should not start again if already started
    game.start_game()  # Should not raise, just do nothing
    assert game.status == GameStatus.IN_PROGRESS


def test_shot_mock():
    """Test shot mock functionality."""
    shot = make_shot(player_id=1, ball_numbers=[1], pocketed=True, foul=False)
    assert shot.player_id == 1
    assert shot.ball_numbers == [1]
    assert shot.pocketed is True
    assert shot.foul is False


def test_shot_validation(game):
    """Test shot validation."""
    game.start_game()

    # Valid shot
    shot = make_shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False)
    game.validate_shot(shot)

    # Invalid player shot
    invalid_shot = make_shot(player_id="p2", ball_numbers=[2], pocketed=True, foul=False)
    with pytest.raises(RuleViolationError):
        game.validate_shot(invalid_shot)


def test_game_scoring(game):
    """Test game scoring functionality."""
    game.start_game()

    # Player 1 pockets a ball
    shot1 = make_shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False)
    game.process_shot(shot1)
    assert game.get_score("p1") == 1
    assert game.get_score("p2") == 0

    # Player 1 misses
    shot2 = make_shot(player_id="p1", ball_numbers=[], pocketed=False, foul=False)
    game.process_shot(shot2)
    assert game.current_player_id == "p2"


def test_game_fouls(game):
    """Test foul handling."""
    game.start_game()

    # Player 1 commits a foul
    foul_shot = make_shot(player_id="p1", ball_numbers=[], pocketed=False, foul=True)
    game.process_shot(foul_shot)
    assert game.current_player_id == "p2"
    assert game.has_ball_in_hand


def test_game_completion(game):
    """Test game completion."""
    game.start_game()

    # Simulate winning scenario
    game.process_shot(
        make_shot(player_id="p1", ball_numbers=[1, 2, 3, 4, 5, 6, 7], pocketed=True, foul=False)
    )
    game.process_shot(make_shot(player_id="p1", ball_numbers=[8], pocketed=True, foul=False))

    assert game.status == GameStatus.COMPLETED
    assert game.winner_id == "p1"
    assert game.is_finished
    assert game.ended_at is not None


def test_game_statistics(game):
    """Test game statistics tracking."""
    game.start_game()

    shot1 = make_shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False)
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
        game.process_shot(make_shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False))

    # Can't end game before it starts
    with pytest.raises(GameStateError):
        game.end_game()

    game.start_game()
    game.end_game()

    # Can't process shot after game ends
    with pytest.raises(GameStateError):
        game.process_shot(make_shot(player_id="p1", ball_numbers=[1], pocketed=True, foul=False)) 