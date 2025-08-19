"""Tests for tournament management system."""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Set
from .tournament_manager import (
    TournamentManager,
    Tournament,
    TournamentMatch,
    TournamentType,
    TournamentStatus,
    MatchStatus,
)


@pytest.fixture
def tournament_manager() -> TournamentManager:
    """Create a tournament manager for testing."""
    return TournamentManager()


@pytest.fixture
def test_tournament(tournament_manager: TournamentManager) -> Tournament:
    """Create a test tournament."""
    prize_pool: Dict[int, Decimal] = {
        1: Decimal("1000.00"),
        2: Decimal("500.00"),
        3: Decimal("250.00"),
    }

    return tournament_manager.create_tournament(
        name="Test Tournament",
        venue_id="venue1",
        tournament_type=TournamentType.SINGLE_ELIMINATION,
        start_date=datetime.now() + timedelta(days=7),
        end_date=datetime.now() + timedelta(days=8),
        entry_fee=Decimal("50.00"),
        prize_pool=prize_pool,
        max_players=16,
        min_skill_level=5,
        max_skill_level=8,
        description="Test tournament description",
        rules=["Rule 1", "Rule 2"],
    )


class TestTournamentCreation:
    """Test tournament creation functionality."""

    def test_create_tournament(self, tournament_manager: TournamentManager) -> None:
        """Test creating a tournament."""
        prize_pool = {1: Decimal("1000.00")}
        tournament = tournament_manager.create_tournament(
            name="New Tournament",
            venue_id="venue1",
            tournament_type=TournamentType.SINGLE_ELIMINATION,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=1),
            entry_fee=Decimal("25.00"),
            prize_pool=prize_pool,
            max_players=8,
        )

        assert tournament.name == "New Tournament"
        assert tournament.venue_id == "venue1"
        assert tournament.tournament_type == TournamentType.SINGLE_ELIMINATION
        assert tournament.status == TournamentStatus.ANNOUNCED
        assert tournament.entry_fee == Decimal("25.00")
        assert tournament.prize_pool == prize_pool
        assert tournament.max_players == 8
        assert not tournament.registered_players
        assert not tournament.rounds

    def test_tournament_retrieval(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test retrieving tournament."""
        tournament = tournament_manager.get_tournament(test_tournament.tournament_id)
        assert tournament == test_tournament

        # Test nonexistent tournament
        assert tournament_manager.get_tournament("nonexistent") is None


class TestPlayerRegistration:
    """Test player registration functionality."""

    def test_register_player(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test registering players."""
        # Set tournament status to registration open
        test_tournament.status = TournamentStatus.REGISTRATION_OPEN

        # Register valid player
        success = tournament_manager.register_player(
            test_tournament.tournament_id, "player1", skill_level=6
        )
        assert success
        assert "player1" in test_tournament.registered_players

        # Test skill level restrictions
        assert not tournament_manager.register_player(
            test_tournament.tournament_id, "player2", skill_level=4  # Below minimum
        )

        assert not tournament_manager.register_player(
            test_tournament.tournament_id, "player3", skill_level=9  # Above maximum
        )

    def test_registration_limits(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test registration limits."""
        test_tournament.status = TournamentStatus.REGISTRATION_OPEN
        test_tournament.max_players = 2

        # Register maximum players
        assert tournament_manager.register_player(
            test_tournament.tournament_id, "player1", skill_level=6
        )
        assert tournament_manager.register_player(
            test_tournament.tournament_id, "player2", skill_level=7
        )

        # Try to register additional player
        assert not tournament_manager.register_player(
            test_tournament.tournament_id, "player3", skill_level=6
        )

    def test_registration_status(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test registration status restrictions."""
        # Try to register when not open
        assert not tournament_manager.register_player(
            test_tournament.tournament_id, "player1", skill_level=6
        )

        # Open registration
        test_tournament.status = TournamentStatus.REGISTRATION_OPEN
        assert tournament_manager.register_player(
            test_tournament.tournament_id, "player1", skill_level=6
        )

        # Close registration
        test_tournament.status = TournamentStatus.REGISTRATION_CLOSED
        assert not tournament_manager.register_player(
            test_tournament.tournament_id, "player2", skill_level=6
        )


class TestTournamentProgress:
    """Test tournament progress functionality."""

    def test_start_tournament(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test starting a tournament."""
        # Register players
        test_tournament.status = TournamentStatus.REGISTRATION_OPEN
        players: Set[str] = {"player1", "player2", "player3", "player4"}
        for player_id in players:
            tournament_manager.register_player(
                test_tournament.tournament_id, player_id, skill_level=6
            )

        # Close registration
        test_tournament.status = TournamentStatus.REGISTRATION_CLOSED

        # Start tournament
        success = tournament_manager.start_tournament(test_tournament.tournament_id)
        assert success
        assert test_tournament.status == TournamentStatus.IN_PROGRESS

        # Verify first round matches
        assert len(test_tournament.rounds) == 1
        first_round = test_tournament.rounds[0]
        assert len(first_round.matches) == 2  # 4 players = 2 matches

        for match in first_round.matches:
            assert match.round_number == 1
            assert match.status == MatchStatus.SCHEDULED
            assert match.player1_id in players
            assert match.player2_id in players

    def test_record_match_result(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test recording match results."""
        # Setup tournament with players
        test_tournament.status = TournamentStatus.REGISTRATION_OPEN
        players = ["player1", "player2", "player3", "player4"]
        for player_id in players:
            tournament_manager.register_player(
                test_tournament.tournament_id, player_id, skill_level=6
            )

        test_tournament.status = TournamentStatus.REGISTRATION_CLOSED
        tournament_manager.start_tournament(test_tournament.tournament_id)

        # Get first match
        match = test_tournament.rounds[0].matches[0]
        match.status = MatchStatus.IN_PROGRESS

        # Record result
        success = tournament_manager.record_match_result(
            test_tournament.tournament_id,
            match.match_id,
            winner_id=match.player1_id,
            score="2-1",
            duration=timedelta(minutes=45),
            stats={"breaks": [30, 25]},
        )

        assert success
        assert match.status == MatchStatus.COMPLETED
        assert match.winner_id == match.player1_id
        assert match.score == "2-1"
        assert match.duration == timedelta(minutes=45)
        assert match.stats["breaks"] == [30, 25]

    def test_tournament_completion(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test tournament completion flow."""
        # Setup 4-player tournament
        test_tournament.status = TournamentStatus.REGISTRATION_OPEN
        players = ["player1", "player2", "player3", "player4"]
        for player_id in players:
            tournament_manager.register_player(
                test_tournament.tournament_id, player_id, skill_level=6
            )

        test_tournament.status = TournamentStatus.REGISTRATION_CLOSED
        tournament_manager.start_tournament(test_tournament.tournament_id)

        # Complete first round matches
        for match in test_tournament.rounds[0].matches:
            match.status = MatchStatus.IN_PROGRESS
            tournament_manager.record_match_result(
                test_tournament.tournament_id,
                match.match_id,
                winner_id=match.player1_id,
                score="2-0",
                duration=timedelta(minutes=30),
                stats={},
            )

        # Verify second round generated
        assert len(test_tournament.rounds) == 2
        final_match = test_tournament.rounds[1].matches[0]
        assert final_match.round_number == 2

        # Complete final match
        final_match.status = MatchStatus.IN_PROGRESS
        tournament_manager.record_match_result(
            test_tournament.tournament_id,
            final_match.match_id,
            winner_id=final_match.player1_id,
            score="3-1",
            duration=timedelta(minutes=60),
            stats={},
        )

        # Verify tournament completed
        assert test_tournament.status == TournamentStatus.COMPLETED


class TestTournamentQueries:
    """Test tournament query functionality."""

    def test_get_player_tournaments(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test retrieving player tournaments."""
        # Register player in tournament
        test_tournament.status = TournamentStatus.REGISTRATION_OPEN
        tournament_manager.register_player(test_tournament.tournament_id, "player1", skill_level=6)

        # Query tournaments
        tournaments = tournament_manager.get_player_tournaments("player1")
        assert len(tournaments) == 1
        assert tournaments[0] == test_tournament

        # Query by status
        tournaments = tournament_manager.get_player_tournaments(
            "player1", status=TournamentStatus.REGISTRATION_OPEN
        )
        assert len(tournaments) == 1

        tournaments = tournament_manager.get_player_tournaments(
            "player1", status=TournamentStatus.COMPLETED
        )
        assert not tournaments

    def test_get_venue_tournaments(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test retrieving venue tournaments."""
        tournaments = tournament_manager.get_venue_tournaments(test_tournament.venue_id)
        assert len(tournaments) == 1
        assert tournaments[0] == test_tournament

        # Query nonexistent venue
        tournaments = tournament_manager.get_venue_tournaments("nonexistent")
        assert not tournaments

    def test_get_tournament_standings(
        self, tournament_manager: TournamentManager, test_tournament: Tournament
    ) -> None:
        """Test tournament standings calculation."""
        # Setup and start tournament
        test_tournament.status = TournamentStatus.REGISTRATION_OPEN
        players = ["player1", "player2", "player3", "player4"]
        for player_id in players:
            tournament_manager.register_player(
                test_tournament.tournament_id, player_id, skill_level=6
            )

        test_tournament.status = TournamentStatus.REGISTRATION_CLOSED
        tournament_manager.start_tournament(test_tournament.tournament_id)

        # Record some match results
        for match in test_tournament.rounds[0].matches:
            match.status = MatchStatus.IN_PROGRESS
            tournament_manager.record_match_result(
                test_tournament.tournament_id,
                match.match_id,
                winner_id=match.player1_id,
                score="2-0",
                duration=timedelta(minutes=30),
                stats={},
            )

        # Get standings
        standings = tournament_manager.get_tournament_standings(test_tournament.tournament_id)

        # Verify standings
        assert len(standings) == 2  # Two winners from first round
        assert standings[0][1] == 1  # Each winner has 1 win
