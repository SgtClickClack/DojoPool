"""Tests for AI shot recommendation system."""

import pytest
import numpy as np
from datetime import datetime
from typing import List
from .shot_recommendation import (
    ShotRecommender,
    ShotType,
    ShotDifficulty,
    BallPosition,
    ShotRecommendation,
)


@pytest.fixture
def shot_recommender() -> ShotRecommender:
    """Create a shot recommender for testing."""
    return ShotRecommender()


@pytest.fixture
def sample_table_state() -> np.ndarray:
    """Create a sample table state image."""
    # Create a 1920x1080 RGB image
    return np.zeros((1080, 1920, 3), dtype=np.uint8)


@pytest.fixture
def sample_ball_positions() -> List[BallPosition]:
    """Create sample ball positions."""
    return [
        BallPosition(x=50.0, y=50.0, ball_number=0),  # Cue ball
        BallPosition(x=70.0, y=48.0, ball_number=1, is_object_ball=True),
        BallPosition(x=30.0, y=70.0, ball_number=2),
        BallPosition(x=80.0, y=20.0, ball_number=3),
    ]


@pytest.fixture
def sample_game_context() -> dict:
    """Create sample game context."""
    return {
        "game_type": "8-ball",
        "score": (3, 2),  # (player, opponent)
        "remaining_balls": [1, 2, 3, 8],
        "is_tournament": True,
        "stage": "quarterfinal",
    }


class TestShotRecommender:
    """Test shot recommendation functionality."""

    def test_analyze_table_state(
        self, shot_recommender: ShotRecommender, sample_table_state: np.ndarray
    ) -> None:
        """Test table state analysis."""
        ball_positions = shot_recommender.analyze_table_state(
            sample_table_state, player_skill_level=5
        )

        assert isinstance(ball_positions, list)
        assert all(isinstance(pos, BallPosition) for pos in ball_positions)

        # Verify ball positions are within bounds
        for pos in ball_positions:
            assert 0 <= pos.x <= 100
            assert 0 <= pos.y <= 100
            assert isinstance(pos.ball_number, int)
            assert 0 <= pos.ball_number <= 15

    def test_get_possible_shots(
        self, shot_recommender: ShotRecommender, sample_ball_positions: List[BallPosition]
    ) -> None:
        """Test getting possible shots."""
        shots = shot_recommender.get_possible_shots(sample_ball_positions, player_skill_level=5)

        assert isinstance(shots, list)
        assert all(isinstance(shot, ShotRecommendation) for shot in shots)

        # Verify shot recommendations
        for shot in shots:
            assert isinstance(shot.shot_type, ShotType)
            assert isinstance(shot.difficulty, ShotDifficulty)
            assert 0 <= shot.success_probability <= 1
            assert 0 <= shot.required_force <= 100

            # Verify positions
            assert isinstance(shot.cue_ball_position, BallPosition)
            assert isinstance(shot.object_ball_position, BallPosition)
            assert shot.object_ball_position.is_object_ball

            # Verify pocket coordinates
            assert len(shot.target_pocket) == 2
            assert all(0 <= coord <= 100 for coord in shot.target_pocket)

            # Verify spin if present
            if shot.spin:
                assert len(shot.spin) == 2
                assert all(-1 <= spin <= 1 for spin in shot.spin)

    def test_rank_shots(
        self, shot_recommender: ShotRecommender, sample_ball_positions: List[BallPosition]
    ) -> None:
        """Test shot ranking."""
        # Get some shots to rank
        shots = shot_recommender.get_possible_shots(sample_ball_positions, player_skill_level=5)

        # Define player style
        player_style = {"aggressive": 0.8, "defensive": 0.2, "technical": 0.7}

        # Rank shots
        ranked_shots = shot_recommender.rank_shots(
            shots, player_skill_level=5, player_style=player_style
        )

        assert isinstance(ranked_shots, list)
        assert len(ranked_shots) == len(shots)

        # Verify ranking order
        prev_prob = 1.0
        for shot in ranked_shots:
            # Shots should be ordered by decreasing probability
            assert shot.success_probability <= prev_prob
            prev_prob = shot.success_probability

    def test_generate_shot_narrative(
        self,
        shot_recommender: ShotRecommender,
        sample_ball_positions: List[BallPosition],
        sample_game_context: dict,
    ) -> None:
        """Test narrative generation."""
        # Get a shot to describe
        shots = shot_recommender.get_possible_shots(sample_ball_positions, player_skill_level=5)
        assert len(shots) > 0

        # Generate narrative
        narrative = shot_recommender.generate_shot_narrative(
            shots[0], player_name="John Doe", game_context=sample_game_context
        )

        assert isinstance(narrative, str)
        assert len(narrative) > 0

        # Verify narrative contains key information
        assert shots[0].shot_type.value in narrative.lower()
        assert shots[0].difficulty.value in narrative.lower()
        assert "john doe" in narrative.lower()

        # Verify game context is incorporated
        assert "tournament" in narrative.lower()
        assert "quarterfinal" in narrative.lower()

    def test_get_recommendations(
        self,
        shot_recommender: ShotRecommender,
        sample_table_state: np.ndarray,
        sample_game_context: dict,
    ) -> None:
        """Test full recommendation pipeline."""
        recommendations = shot_recommender.get_recommendations(
            sample_table_state, player_id="player1", game_context=sample_game_context
        )

        assert isinstance(recommendations, list)
        assert all(isinstance(rec, ShotRecommendation) for rec in recommendations)

        # Verify recommendations are properly ranked
        prev_prob = 1.0
        for rec in recommendations:
            assert rec.success_probability <= prev_prob
            prev_prob = rec.success_probability

            # Verify each recommendation has a narrative
            assert isinstance(rec.narrative, str)
            assert len(rec.narrative) > 0

    def test_player_skill_adaptation(
        self,
        shot_recommender: ShotRecommender,
        sample_table_state: np.ndarray,
        sample_game_context: dict,
    ) -> None:
        """Test adaptation to different player skill levels."""
        # Get recommendations for novice player
        novice_recs = shot_recommender.get_recommendations(
            sample_table_state, player_id="novice_player", game_context=sample_game_context
        )

        # Get recommendations for expert player
        expert_recs = shot_recommender.get_recommendations(
            sample_table_state, player_id="expert_player", game_context=sample_game_context
        )

        # Expert should have more recommended shots
        assert len(expert_recs) >= len(novice_recs)

        # Expert shots should include more difficult shots
        expert_difficulties = [rec.difficulty for rec in expert_recs]
        assert ShotDifficulty.EXPERT in expert_difficulties

        novice_difficulties = [rec.difficulty for rec in novice_recs]
        assert ShotDifficulty.EXPERT not in novice_difficulties
        assert ShotDifficulty.EASY in novice_difficulties
