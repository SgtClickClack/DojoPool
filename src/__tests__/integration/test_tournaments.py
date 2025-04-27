import pytest
from DojoPool.tournament.types import TournamentPlayer, TournamentConfig, MatchResult
from DojoPool.tournament.TournamentService import TournamentService

# Test data
test_players = [
    {
        "id": "1",
        "name": "Player 1",
        "rating": 1500,
        "stats": {"wins": 0, "losses": 0, "tournamentWins": 0, "averageFinish": 0},
        "achievements": [],
    },
    {
        "id": "2",
        "name": "Player 2",
        "rating": 1400,
        "stats": {"wins": 0, "losses": 0, "tournamentWins": 0, "averageFinish": 0},
        "achievements": [],
    },
    {
        "id": "3",
        "name": "Player 3",
        "rating": 1300,
        "stats": {"wins": 0, "losses": 0, "tournamentWins": 0, "averageFinish": 0},
        "achievements": [],
    },
    {
        "id": "4",
        "name": "Player 4",
        "rating": 1200,
        "stats": {"wins": 0, "losses": 0, "tournamentWins": 0, "averageFinish": 0},
        "achievements": [],
    },
]

test_config = {
    "format": "double_elimination",
    "name": "Test Tournament",
    "minPlayers": 4,
    "maxPlayers": 16,
    "startDate": "2024-02-07T00:00:00.000Z",
    "rules": {
        "matchFormat": "race_to_5",
        "scoring": "standard",
        "tiebreakers": ["head_to_head", "game_differential"],
    },
}


@pytest.fixture
def tournament_service():
    return TournamentService()


@pytest.fixture
def tournament_with_players(tournament_service):
    tournament_id = tournament_service.createTournament(
        format="double_elimination", players=test_players, config=test_config
    )
    return tournament_id, tournament_service


def test_tournament_creation(tournament_service):
    tournament_id = tournament_service.createTournament(
        format="double_elimination", players=test_players, config=test_config
    )
    assert tournament_id is not None
    tournament = tournament_service.getTournament(tournament_id)
    assert tournament is not None


def test_get_current_round_matches(tournament_with_players):
    tournament_id, service = tournament_with_players
    matches = service.getCurrentRoundMatches(tournament_id)
    assert len(matches) == 2  # For 4 players, should have 2 first round matches


def test_submit_match_result(tournament_with_players):
    tournament_id, service = tournament_with_players
    matches = service.getCurrentRoundMatches(tournament_id)
    first_match = matches[0]

    result = {
        "winner": first_match.player1,
        "loser": first_match.player2,
        "stats": {
            "duration": 3600,  # 1 hour
            "score": "5-3",
            "highlights": ["Break and run in rack 3"],
        },
    }

    service.submitMatchResult(tournament_id, first_match.id, result)
    updated_match = service.getTournament(tournament_id).findMatch(first_match.id)
    assert updated_match.winner.id == first_match.player1.id
    assert updated_match.status == "complete"


def test_get_standings(tournament_with_players):
    tournament_id, service = tournament_with_players
    standings = service.getStandings(tournament_id)
    assert len(standings) == 4  # Should have all players
    # Initially sorted by rating since no matches played
    assert standings[0].id == "1"  # Highest rated player


def test_tournament_completion(tournament_with_players):
    tournament_id, service = tournament_with_players

    # Play out the tournament
    while not service.getTournamentState(tournament_id).isComplete:
        matches = service.getCurrentRoundMatches(tournament_id)
        if not matches:
            break

        for match in matches:
            # Always have player1 win for predictable results
            result = {
                "winner": match.player1,
                "loser": match.player2,
                "stats": {"duration": 3600, "score": "5-0", "highlights": []},
            }
            service.submitMatchResult(tournament_id, match.id, result)

    final_state = service.getTournamentState(tournament_id)
    assert final_state.isComplete
    standings = service.getStandings(tournament_id)
    assert len(standings) == 4


def test_invalid_tournament_id(tournament_service):
    with pytest.raises(Exception):
        tournament_service.getTournament("invalid_id")


def test_invalid_match_result(tournament_with_players):
    tournament_id, service = tournament_with_players
    with pytest.raises(Exception):
        service.submitMatchResult(
            tournament_id, "invalid_match_id", {"winner": test_players[0], "loser": test_players[1]}
        )
