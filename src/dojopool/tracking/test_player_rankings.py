"""Tests for player rankings system."""

import pytest
from datetime import datetime, timedelta
from .player_rankings import PlayerRankingSystem, PlayerStats, MatchResult, RankingEntry, SkillLevel
from .game_tracker import Shot, BallPosition


@pytest.fixture
def ranking_system() -> PlayerRankingSystem:
    """Create a ranking system instance."""
    return PlayerRankingSystem()


@pytest.fixture
def sample_match() -> MatchResult:
    """Create a sample match result."""
    now = datetime.now()
    return MatchResult(
        match_id="test_match_1",
        winner_id="player1",
        loser_id="player2",
        winner_score=2,
        loser_score=1,
        game_type="8-ball",
        timestamp=now,
        shots=[
            Shot(
                shot_id="shot_1",
                start_time=now,
                end_time=now + timedelta(seconds=10),
                ball_positions=[
                    BallPosition(0, 0.5, 0.5, 0.9, now),  # Cue ball
                    BallPosition(1, 1.0, 0.5, 0.9, now),  # Target ball
                ],
                is_valid=True,
                type="normal",
                pocketed_balls={1},
                foul_detected=False,
                confidence=0.9,
            )
        ],
        duration=timedelta(minutes=30),
    )


@pytest.fixture
def tournament_match(sample_match: MatchResult) -> MatchResult:
    """Create a tournament match result."""
    return MatchResult(
        **{
            **sample_match.__dict__,
            "match_id": "tournament_match_1",
            "tournament_id": "tournament_1",
        }
    )


class TestPlayerRankingSystem:
    """Test cases for PlayerRankingSystem."""

    def test_record_match(
        self, ranking_system: PlayerRankingSystem, sample_match: MatchResult
    ) -> None:
        """Test recording a match."""
        ranking_system.record_match(sample_match)

        # Check winner stats
        winner_stats = ranking_system.get_player_stats(sample_match.winner_id)
        assert winner_stats is not None
        assert winner_stats.total_matches == 1
        assert winner_stats.matches_won == 1
        assert winner_stats.total_games == sample_match.winner_score
        assert winner_stats.games_won == sample_match.winner_score

        # Check loser stats
        loser_stats = ranking_system.get_player_stats(sample_match.loser_id)
        assert loser_stats is not None
        assert loser_stats.total_matches == 1
        assert loser_stats.matches_won == 0
        assert loser_stats.total_games == sample_match.loser_score
        assert loser_stats.games_won == 0

    def test_tournament_match(
        self, ranking_system: PlayerRankingSystem, tournament_match: MatchResult
    ) -> None:
        """Test recording a tournament match."""
        ranking_system.record_match(tournament_match)

        # Tournament matches should award more ranking points
        winner_stats = ranking_system.get_player_stats(tournament_match.winner_id)
        loser_stats = ranking_system.get_player_stats(tournament_match.loser_id)

        assert winner_stats is not None
        assert loser_stats is not None
        assert winner_stats.ranking_points > 0
        assert winner_stats.tournaments_played == 1

    def test_provisional_players(
        self, ranking_system: PlayerRankingSystem, sample_match: MatchResult
    ) -> None:
        """Test provisional player handling."""
        # Record first match
        ranking_system.record_match(sample_match)

        assert sample_match.winner_id in ranking_system._provisional_players
        assert sample_match.loser_id in ranking_system._provisional_players

        # Record enough matches to remove provisional status
        for i in range(ranking_system.provisional_games):
            match = MatchResult(**{**sample_match.__dict__, "match_id": f"match_{i}"})
            ranking_system.record_match(match)

        assert sample_match.winner_id not in ranking_system._provisional_players
        assert sample_match.loser_id not in ranking_system._provisional_players

    def test_elo_rating_changes(
        self, ranking_system: PlayerRankingSystem, sample_match: MatchResult
    ) -> None:
        """Test ELO rating updates."""
        # Record match between equal rated players
        initial_rating = ranking_system.skill_thresholds[SkillLevel.BEGINNER]
        ranking_system.record_match(sample_match)

        winner_stats = ranking_system.get_player_stats(sample_match.winner_id)
        loser_stats = ranking_system.get_player_stats(sample_match.loser_id)

        assert winner_stats is not None
        assert loser_stats is not None
        assert winner_stats.elo_rating > initial_rating
        assert loser_stats.elo_rating < initial_rating

    def test_skill_level_changes(
        self, ranking_system: PlayerRankingSystem, sample_match: MatchResult
    ) -> None:
        """Test skill level updates."""
        # Record matches until skill level changes
        initial_level = SkillLevel.NOVICE
        current_level = initial_level

        while current_level == initial_level:
            ranking_system.record_match(sample_match)
            stats = ranking_system.get_player_stats(sample_match.winner_id)
            assert stats is not None
            current_level = stats.skill_level

        assert current_level > initial_level

    def test_rating_decay(
        self, ranking_system: PlayerRankingSystem, sample_match: MatchResult
    ) -> None:
        """Test rating decay for inactive players."""
        # Record a match
        ranking_system.record_match(sample_match)

        # Get initial ratings
        winner_stats = ranking_system.get_player_stats(sample_match.winner_id)
        assert winner_stats is not None
        initial_rating = winner_stats.elo_rating

        # Simulate inactivity
        winner_stats.last_active = datetime.now() - timedelta(days=60)

        # Apply decay
        ranking_system.apply_rating_decay()

        assert winner_stats.elo_rating < initial_rating

    def test_rankings_update(
        self, ranking_system: PlayerRankingSystem, sample_match: MatchResult
    ) -> None:
        """Test rankings updates."""
        # Record multiple matches
        matches = []
        for i in range(5):
            match = MatchResult(
                **{
                    **sample_match.__dict__,
                    "match_id": f"match_{i}",
                    "winner_id": f"player{i}",
                    "loser_id": f"player{i+1}",
                }
            )
            matches.append(match)
            ranking_system.record_match(match)

        # Get rankings
        rankings = ranking_system.get_rankings()

        assert len(rankings) == 6  # 5 winners + 1 final loser
        assert rankings[0].rank == 1
        assert rankings[-1].rank == len(rankings)

        # Test filtering
        top_3 = ranking_system.get_rankings(top_n=3)
        assert len(top_3) == 3
        assert top_3[0].rank == 1

    def test_match_history(
        self, ranking_system: PlayerRankingSystem, sample_match: MatchResult
    ) -> None:
        """Test match history retrieval."""
        # Record multiple matches
        now = datetime.now()
        matches = []

        for i in range(5):
            match = MatchResult(
                **{
                    **sample_match.__dict__,
                    "match_id": f"match_{i}",
                    "timestamp": now + timedelta(days=i),
                }
            )
            matches.append(match)
            ranking_system.record_match(match)

        # Test filtering by player
        player_matches = ranking_system.get_match_history(player_id=sample_match.winner_id)
        assert len(player_matches) == 5

        # Test filtering by date
        recent_matches = ranking_system.get_match_history(start_date=now + timedelta(days=2))
        assert len(recent_matches) == 3

    def test_head_to_head(
        self, ranking_system: PlayerRankingSystem, sample_match: MatchResult
    ) -> None:
        """Test head-to-head statistics."""
        # Record matches between same players
        ranking_system.record_match(sample_match)

        # Record reverse match (player2 wins)
        reverse_match = MatchResult(
            **{
                **sample_match.__dict__,
                "match_id": "reverse_match",
                "winner_id": sample_match.loser_id,
                "loser_id": sample_match.winner_id,
            }
        )
        ranking_system.record_match(reverse_match)

        # Get head-to-head stats
        h2h = ranking_system.get_head_to_head(sample_match.winner_id, sample_match.loser_id)

        assert h2h["total_matches"] == 2
        assert h2h["player1_wins"] == 1
        assert h2h["player2_wins"] == 1
        assert len(h2h["matches"]) == 2
