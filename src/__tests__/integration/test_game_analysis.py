import pytest
from ...dojopool.game_analysis import GameAnalyzer, ShotAnalysis, GameState
from ...dojopool.types import Shot, Ball, Position

# Test data
test_game_state = {
    "balls": [
        {"number": 1, "position": {"x": 100, "y": 200}, "pocketed": False},
        {"number": 2, "position": {"x": 300, "y": 400}, "pocketed": False},
        {"number": 8, "position": {"x": 500, "y": 600}, "pocketed": False},
    ],
    "cueBall": {"position": {"x": 50, "y": 50}},
    "currentPlayer": "player1",
    "gamePhase": "in_progress",
}


@pytest.fixture
def game_analyzer():
    return GameAnalyzer()


def test_shot_difficulty_calculation(game_analyzer):
    shot = {
        "type": "normal",
        "cueBall": {"x": 0, "y": 0},
        "targetBall": {"number": 1, "position": {"x": 100, "y": 100}},
        "pocket": {"x": 200, "y": 200},
        "obstacles": [],
    }

    difficulty = game_analyzer.calculate_shot_difficulty(shot)
    assert 0 <= difficulty <= 1.0


def test_shot_success_probability(game_analyzer):
    shot = {
        "type": "normal",
        "cueBall": {"x": 0, "y": 0},
        "targetBall": {"number": 1, "position": {"x": 100, "y": 100}},
        "pocket": {"x": 200, "y": 200},
        "obstacles": [],
    }

    probability = game_analyzer.calculate_success_probability(shot)
    assert 0 <= probability <= 1.0


def test_best_shot_recommendation(game_analyzer):
    game_state = test_game_state
    recommendation = game_analyzer.recommend_best_shot(game_state)

    assert recommendation is not None
    assert "shot" in recommendation
    assert "difficulty" in recommendation
    assert "success_probability" in recommendation
    assert "expected_value" in recommendation


def test_shot_path_analysis(game_analyzer):
    shot = {
        "type": "normal",
        "cueBall": {"x": 0, "y": 0},
        "targetBall": {"number": 1, "position": {"x": 100, "y": 100}},
        "pocket": {"x": 200, "y": 200},
        "obstacles": [{"number": 2, "position": {"x": 50, "y": 50}}],
    }

    path_analysis = game_analyzer.analyze_shot_path(shot)
    assert "is_possible" in path_analysis
    assert "collision_points" in path_analysis
    assert "required_spin" in path_analysis


def test_safety_shot_analysis(game_analyzer):
    game_state = test_game_state
    safety_options = game_analyzer.analyze_safety_options(game_state)

    assert isinstance(safety_options, list)
    assert all("shot" in option for option in safety_options)
    assert all("defensive_value" in option for option in safety_options)


def test_position_play_analysis(game_analyzer):
    shot = {
        "type": "position",
        "cueBall": {"x": 0, "y": 0},
        "targetBall": {"number": 1, "position": {"x": 100, "y": 100}},
        "pocket": {"x": 200, "y": 200},
        "desired_position": {"x": 150, "y": 150},
    }

    position_analysis = game_analyzer.analyze_position_play(shot)
    assert "difficulty" in position_analysis
    assert "recommended_speed" in position_analysis
    assert "recommended_spin" in position_analysis


def test_invalid_shot_analysis(game_analyzer):
    invalid_shot = {
        "type": "normal",
        "cueBall": {"x": 0, "y": 0},
        # Missing target ball
        "pocket": {"x": 200, "y": 200},
    }

    with pytest.raises(ValueError):
        game_analyzer.analyze_shot_path(invalid_shot)


def test_game_state_validation(game_analyzer):
    invalid_state = {
        "balls": [],  # No balls
        "cueBall": {"position": {"x": 50, "y": 50}},
        "currentPlayer": "player1",
        # Missing gamePhase
    }

    with pytest.raises(ValueError):
        game_analyzer.recommend_best_shot(invalid_state)
