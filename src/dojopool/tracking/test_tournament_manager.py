"""Tests for tournament management system."""

import pytest
from datetime import datetime, timedelta
from .tournament_manager import (
    TournamentManager,
    Tournament,
    TournamentFormat,
    TournamentStatus,
    PrizeStructure,
    TournamentMatch,
)
from .player_rankings import PlayerRankingSystem, MatchResult
from .game_tracker import Shot, BallPosition


@pytest.fixture
def ranking_system() -> PlayerRankingSystem:
    """Create a ranking system instance."""
    return PlayerRankingSystem()


@pytest.fixture
def tournament_manager(ranking_system: PlayerRankingSystem) -> TournamentManager:
    """Create a tournament manager instance."""
    return TournamentManager(ranking_system)


@pytest.fixture
def sample_tournament(tournament_manager: TournamentManager) -> Tournament:
    """Create a sample tournament."""
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=1)

    prize_structure = PrizeStructure(
        total_prize_pool=1000.0,
        placement_percentages={
            1: 0.5,  # 50% for first place
            2: 0.3,  # 30% for second place
            3: 0.2,  # 20% for third place
        },
        special_prizes={},
    )

    return tournament_manager.create_tournament(
        name="Test Tournament",
        format=TournamentFormat.SINGLE_ELIMINATION,
        start_date=start_date,
        end_date=end_date,
        venue_id="venue_1",
        min_players=4,
        max_players=16,
        entry_fee=50.0,
        prize_structure=prize_structure,
        game_type="8-ball",
        race_to=2,
    )


@pytest.fixture
def sample_match_result() -> MatchResult:
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


class TestTournamentManager:
    """Test cases for TournamentManager."""

    def test_create_tournament(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test tournament creation."""
        assert sample_tournament.tournament_id is not None
        assert sample_tournament.name == "Test Tournament"
        assert sample_tournament.format == TournamentFormat.SINGLE_ELIMINATION
        assert sample_tournament.status == TournamentStatus.REGISTRATION
        assert "created" in sample_tournament.timestamps

    def test_register_player(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test player registration."""
        # Register players
        assert tournament_manager.register_player(sample_tournament.tournament_id, "player1")
        assert tournament_manager.register_player(sample_tournament.tournament_id, "player2")

        assert len(sample_tournament.registered_players) == 2
        assert "player1" in sample_tournament.registered_players
        assert "player2" in sample_tournament.registered_players

        # Test registration limits
        for i in range(sample_tournament.max_players):
            tournament_manager.register_player(sample_tournament.tournament_id, f"extra_player_{i}")

        # Should not allow registration when full
        assert not tournament_manager.register_player(
            sample_tournament.tournament_id, "one_too_many"
        )

    def test_start_tournament(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test tournament start."""
        # Try to start with insufficient players
        assert not tournament_manager.start_tournament(sample_tournament.tournament_id)

        # Register minimum required players
        for i in range(sample_tournament.min_players):
            tournament_manager.register_player(sample_tournament.tournament_id, f"player_{i}")

        # Start tournament
        assert tournament_manager.start_tournament(sample_tournament.tournament_id)

        assert sample_tournament.status == TournamentStatus.IN_PROGRESS
        assert "started" in sample_tournament.timestamps
        assert sample_tournament.current_round == 1
        assert len(sample_tournament.matches) > 0

    def test_single_elimination_bracket(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test single elimination bracket generation."""
        # Register 8 players
        for i in range(8):
            tournament_manager.register_player(sample_tournament.tournament_id, f"player_{i}")

        tournament_manager.start_tournament(sample_tournament.tournament_id)

        # Should have 4 first round matches
        first_round_matches = [m for m in sample_tournament.matches if m.round_number == 1]
        assert len(first_round_matches) == 4

        # All matches should have two players
        for match in first_round_matches:
            assert match.player1_id is not None
            assert match.player2_id is not None

    def test_record_match_result(
        self,
        tournament_manager: TournamentManager,
        sample_tournament: Tournament,
        sample_match_result: MatchResult,
    ) -> None:
        """Test recording match results."""
        # Register and start tournament
        tournament_manager.register_player(
            sample_tournament.tournament_id, sample_match_result.winner_id
        )
        tournament_manager.register_player(
            sample_tournament.tournament_id, sample_match_result.loser_id
        )
        tournament_manager.register_player(sample_tournament.tournament_id, "player3")
        tournament_manager.register_player(sample_tournament.tournament_id, "player4")

        tournament_manager.start_tournament(sample_tournament.tournament_id)

        # Record first match result
        assert tournament_manager.record_match_result(
            sample_tournament.tournament_id, sample_match_result
        )

        # Verify match was updated
        match = next(
            (m for m in sample_tournament.matches if m.winner_id == sample_match_result.winner_id),
            None,
        )
        assert match is not None
        assert match.completed_time is not None
        assert match.result is not None

    def test_tournament_completion(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test tournament completion and prize distribution."""
        # Register 4 players
        players = ["player1", "player2", "player3", "player4"]
        for player in players:
            tournament_manager.register_player(sample_tournament.tournament_id, player)

        tournament_manager.start_tournament(sample_tournament.tournament_id)

        # Complete all matches
        for match in sample_tournament.matches:
            if not match.completed_time:
                result = MatchResult(
                    match_id=str(match.match_id),
                    winner_id=match.player1_id,
                    loser_id=match.player2_id,
                    winner_score=2,
                    loser_score=0,
                    game_type=sample_tournament.game_type,
                    timestamp=datetime.now(),
                    shots=[],
                    duration=timedelta(minutes=30),
                )
                tournament_manager.record_match_result(sample_tournament.tournament_id, result)

        assert sample_tournament.status == TournamentStatus.COMPLETED
        assert "completed" in sample_tournament.timestamps
        assert len(sample_tournament.rankings) > 0

    def test_get_player_tournaments(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test retrieving player tournaments."""
        tournament_manager.register_player(sample_tournament.tournament_id, "player1")

        tournaments = tournament_manager.get_player_tournaments("player1")
        assert len(tournaments) == 1
        assert tournaments[0].tournament_id == sample_tournament.tournament_id

        # Test filtering by status
        tournaments = tournament_manager.get_player_tournaments(
            "player1", status=TournamentStatus.REGISTRATION
        )
        assert len(tournaments) == 1

        tournaments = tournament_manager.get_player_tournaments(
            "player1", status=TournamentStatus.COMPLETED
        )
        assert len(tournaments) == 0

    def test_get_venue_tournaments(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test retrieving venue tournaments."""
        tournaments = tournament_manager.get_venue_tournaments(sample_tournament.venue_id)
        assert len(tournaments) == 1
        assert tournaments[0].tournament_id == sample_tournament.tournament_id

        # Test filtering by status
        tournaments = tournament_manager.get_venue_tournaments(
            sample_tournament.venue_id, status=TournamentStatus.REGISTRATION
        )
        assert len(tournaments) == 1

        tournaments = tournament_manager.get_venue_tournaments(
            sample_tournament.venue_id, status=TournamentStatus.COMPLETED
        )
        assert len(tournaments) == 0

    def test_round_robin_tournament(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test round robin tournament format."""
        # Set tournament format to round robin
        sample_tournament.format = TournamentFormat.ROUND_ROBIN

        # Register 5 players (odd number to test bye handling)
        for i in range(5):
            tournament_manager.register_player(sample_tournament.tournament_id, f"player_{i}")

        tournament_manager.start_tournament(sample_tournament.tournament_id)

        # Should have correct number of matches
        # For n players: (n * (n-1)) / 2 matches total
        expected_matches = (5 * 4) // 2  # 10 matches
        assert len(sample_tournament.matches) == expected_matches

        # Complete all matches
        for match in sample_tournament.matches:
            if not match.completed_time:
                result = MatchResult(
                    match_id=str(match.match_id),
                    winner_id=match.player1_id,
                    loser_id=match.player2_id,
                    winner_score=2,
                    loser_score=0,
                    game_type=sample_tournament.game_type,
                    timestamp=datetime.now(),
                    shots=[],
                    duration=timedelta(minutes=30),
                )
                tournament_manager.record_match_result(sample_tournament.tournament_id, result)

        # Tournament should be completed
        assert sample_tournament.status == TournamentStatus.COMPLETED
        assert "completed" in sample_tournament.timestamps

        # All players should have rankings
        assert len(sample_tournament.rankings) == 5

        # Rankings should be sequential
        ranks = set(sample_tournament.rankings.values())
        assert min(ranks) == 1
        assert max(ranks) <= 5

    def test_swiss_tournament(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test Swiss tournament format."""
        # Set tournament format to Swiss
        sample_tournament.format = TournamentFormat.SWISS

        # Register 8 players
        for i in range(8):
            tournament_manager.register_player(sample_tournament.tournament_id, f"player_{i}")

        tournament_manager.start_tournament(sample_tournament.tournament_id)

        # Should have 4 first round matches
        first_round_matches = [m for m in sample_tournament.matches if m.round_number == 1]
        assert len(first_round_matches) == 4

        # Complete matches round by round
        while sample_tournament.status != TournamentStatus.COMPLETED:
            current_matches = [
                m
                for m in sample_tournament.matches
                if m.round_number == sample_tournament.current_round and not m.completed_time
            ]

            for match in current_matches:
                result = MatchResult(
                    match_id=str(match.match_id),
                    winner_id=match.player1_id,
                    loser_id=match.player2_id,
                    winner_score=2,
                    loser_score=0,
                    game_type=sample_tournament.game_type,
                    timestamp=datetime.now(),
                    shots=[],
                    duration=timedelta(minutes=30),
                )
                tournament_manager.record_match_result(sample_tournament.tournament_id, result)

        # Tournament should be completed
        assert sample_tournament.status == TournamentStatus.COMPLETED
        assert "completed" in sample_tournament.timestamps

        # All players should have rankings
        assert len(sample_tournament.rankings) == 8

        # Rankings should be sequential
        ranks = set(sample_tournament.rankings.values())
        assert min(ranks) == 1
        assert max(ranks) == 8

        # Check that players with more wins are ranked higher
        player_scores = {}
        for match in sample_tournament.matches:
            if match.winner_id:
                player_scores[match.winner_id] = player_scores.get(match.winner_id, 0) + 1

        # Higher scores should correspond to better (lower) ranks
        for player1_id, score1 in player_scores.items():
            for player2_id, score2 in player_scores.items():
                if score1 > score2:
                    assert (
                        sample_tournament.rankings[player1_id]
                        < sample_tournament.rankings[player2_id]
                    )

    def test_double_elimination_tournament(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test double elimination tournament format."""
        # Set tournament format to double elimination
        sample_tournament.format = TournamentFormat.DOUBLE_ELIMINATION

        # Register 8 players
        for i in range(8):
            tournament_manager.register_player(sample_tournament.tournament_id, f"player_{i}")

        tournament_manager.start_tournament(sample_tournament.tournament_id)

        # Should have 4 first round matches in winners bracket
        winners_matches = [m for m in sample_tournament.matches if m.round_number == 1]
        assert len(winners_matches) == 4

        # Complete winners bracket matches
        for match in winners_matches:
            result = MatchResult(
                match_id=str(match.match_id),
                winner_id=match.player1_id,
                loser_id=match.player2_id,
                winner_score=2,
                loser_score=0,
                game_type=sample_tournament.game_type,
                timestamp=datetime.now(),
                shots=[],
                duration=timedelta(minutes=30),
            )
            tournament_manager.record_match_result(sample_tournament.tournament_id, result)

        # Should generate losers bracket matches
        losers_matches = [
            m
            for m in sample_tournament.matches
            if m.round_number == 2
            and not any(
                prev_m.winner_id in (m.player1_id, m.player2_id) for prev_m in winners_matches
            )
        ]
        assert len(losers_matches) == 2

        # Complete all matches until tournament is done
        while sample_tournament.status != TournamentStatus.COMPLETED:
            current_matches = [
                m
                for m in sample_tournament.matches
                if m.round_number == sample_tournament.current_round and not m.completed_time
            ]

            for match in current_matches:
                result = MatchResult(
                    match_id=str(match.match_id),
                    winner_id=match.player1_id,
                    loser_id=match.player2_id,
                    winner_score=2,
                    loser_score=0,
                    game_type=sample_tournament.game_type,
                    timestamp=datetime.now(),
                    shots=[],
                    duration=timedelta(minutes=30),
                )
                tournament_manager.record_match_result(sample_tournament.tournament_id, result)

        # Tournament should be completed
        assert sample_tournament.status == TournamentStatus.COMPLETED
        assert "completed" in sample_tournament.timestamps

        # All players should have rankings
        assert len(sample_tournament.rankings) == 8

        # Rankings should be sequential
        ranks = set(sample_tournament.rankings.values())
        assert min(ranks) == 1
        assert max(ranks) == 8

        # Check that winners bracket champion is ranked first
        winners_champion = next(
            m.winner_id
            for m in sample_tournament.matches
            if m.round_number == max(m.round_number for m in sample_tournament.matches)
        )
        assert sample_tournament.rankings[winners_champion] == 1

    def test_round_robin_tournament_odd_players(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test round robin tournament with odd number of players."""
        # Set tournament format to round robin
        sample_tournament.format = TournamentFormat.ROUND_ROBIN

        # Register 5 players (odd number to test bye handling)
        for i in range(5):
            tournament_manager.register_player(sample_tournament.tournament_id, f"player_{i}")

        tournament_manager.start_tournament(sample_tournament.tournament_id)

        # Should have correct number of matches
        # For n players: (n * (n-1)) / 2 matches total
        expected_matches = (5 * 4) // 2  # 10 matches
        assert len(sample_tournament.matches) == expected_matches

        # Complete all matches
        for match in sample_tournament.matches:
            if not match.completed_time:
                result = MatchResult(
                    match_id=str(match.match_id),
                    winner_id=match.player1_id,
                    loser_id=match.player2_id,
                    winner_score=2,
                    loser_score=0,
                    game_type=sample_tournament.game_type,
                    timestamp=datetime.now(),
                    shots=[],
                    duration=timedelta(minutes=30),
                )
                tournament_manager.record_match_result(sample_tournament.tournament_id, result)

        # Tournament should be completed
        assert sample_tournament.status == TournamentStatus.COMPLETED
        assert "completed" in sample_tournament.timestamps

        # All players should have rankings
        assert len(sample_tournament.rankings) == 5

        # Rankings should be sequential
        ranks = set(sample_tournament.rankings.values())
        assert min(ranks) == 1
        assert max(ranks) <= 5

        # Check that each player played against every other player
        for player1 in sample_tournament.registered_players:
            opponents = set()
            for match in sample_tournament.matches:
                if match.player1_id == player1:
                    opponents.add(match.player2_id)
                elif match.player2_id == player1:
                    opponents.add(match.player1_id)
            assert len(opponents) == 4  # Should play against all other players

    def test_swiss_tournament_tiebreaks(
        self, tournament_manager: TournamentManager, sample_tournament: Tournament
    ) -> None:
        """Test Swiss tournament format with tiebreaks."""
        # Set tournament format to Swiss
        sample_tournament.format = TournamentFormat.SWISS

        # Register 8 players
        for i in range(8):
            tournament_manager.register_player(sample_tournament.tournament_id, f"player_{i}")

        tournament_manager.start_tournament(sample_tournament.tournament_id)

        # Should have 4 first round matches
        first_round_matches = [m for m in sample_tournament.matches if m.round_number == 1]
        assert len(first_round_matches) == 4

        # Complete matches with specific results to test tiebreaks
        # player_0 and player_1 will win all matches
        # player_2 and player_3 will win 2 matches
        # Others will lose all matches
        while sample_tournament.status != TournamentStatus.COMPLETED:
            current_matches = [
                m
                for m in sample_tournament.matches
                if m.round_number == sample_tournament.current_round and not m.completed_time
            ]

            for match in current_matches:
                # Determine winner based on player IDs
                if match.player1_id in ["player_0", "player_1"]:
                    winner_id = match.player1_id
                    loser_id = match.player2_id
                elif match.player2_id in ["player_0", "player_1"]:
                    winner_id = match.player2_id
                    loser_id = match.player1_id
                elif match.player1_id in ["player_2", "player_3"] and match.player2_id not in [
                    "player_0",
                    "player_1",
                ]:
                    winner_id = match.player1_id
                    loser_id = match.player2_id
                elif match.player2_id in ["player_2", "player_3"] and match.player1_id not in [
                    "player_0",
                    "player_1",
                ]:
                    winner_id = match.player2_id
                    loser_id = match.player1_id
                else:
                    winner_id = match.player1_id
                    loser_id = match.player2_id

                result = MatchResult(
                    match_id=str(match.match_id),
                    winner_id=winner_id,
                    loser_id=loser_id,
                    winner_score=2,
                    loser_score=0,
                    game_type=sample_tournament.game_type,
                    timestamp=datetime.now(),
                    shots=[],
                    duration=timedelta(minutes=30),
                )
                tournament_manager.record_match_result(sample_tournament.tournament_id, result)

        # Tournament should be completed
        assert sample_tournament.status == TournamentStatus.COMPLETED
        assert "completed" in sample_tournament.timestamps

        # All players should have rankings
        assert len(sample_tournament.rankings) == 8

        # Check specific rankings based on wins and tiebreaks
        assert sample_tournament.rankings["player_0"] in [1, 2]  # Top 2
        assert sample_tournament.rankings["player_1"] in [1, 2]  # Top 2
        assert sample_tournament.rankings["player_2"] in [3, 4]  # Mid ranks
        assert sample_tournament.rankings["player_3"] in [3, 4]  # Mid ranks

        # Check that players with more wins are ranked higher
        for player1_id in ["player_0", "player_1"]:
            for player2_id in ["player_2", "player_3"]:
                assert (
                    sample_tournament.rankings[player1_id] < sample_tournament.rankings[player2_id]
                )
            for player2_id in ["player_4", "player_5", "player_6", "player_7"]:
                assert (
                    sample_tournament.rankings[player1_id] < sample_tournament.rankings[player2_id]
                )
