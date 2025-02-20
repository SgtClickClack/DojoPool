"""
Unit tests for the Global Ranking Module.
"""

from datetime import datetime

import pytest

from dojopool.core.ranking import global_ranking as gr


def test_calculate_ranking() -> None:
    # Test with a valid score
    assert gr.calculate_ranking({"score": 100}) == 100.0
    # Test with missing score, defaulting to 0
    assert gr.calculate_ranking({}) == 0.0


def test_get_rankings_in_range():
    # Setup global cache with dummy data
    gr._game_cache = {
        "player1": {
            "player_id": "player1",
            "score": 50,
            "last_update": datetime.utcnow(),
        },
        "player2": {
            "player_id": "player2",
            "score": 75,
            "last_update": datetime.utcnow(),
        },
        "player3": {
            "player_id": "player3",
            "score": 25,
            "last_update": datetime.utcnow(),
        },
    }
    rankings = gr.get_rankings_in_range(0, 2)
    assert len(rankings) == 2


def test_get_global_ranking():
    gr._game_cache = {
        "player1": {
            "player_id": "player1",
            "score": 90,
            "last_update": datetime.utcnow(),
        }
    }
    rank = gr.get_global_ranking("player1")
    assert rank == 90.0


@pytest.mark.asyncio
async def test_async_get_leading_player():
    gr._game_cache = {
        "player1": {
            "player_id": "player1",
            "score": 30,
            "last_update": datetime.utcnow(),
        },
        "player2": {
            "player_id": "player2",
            "score": 60,
            "last_update": datetime.utcnow(),
        },
        "player3": {
            "player_id": "player3",
            "score": 45,
            "last_update": datetime.utcnow(),
        },
    }
    leader = await gr.async_get_leading_player()
    assert leader == "player2"


@pytest.mark.asyncio
async def test_get_recent_tournament_update_iso() -> None:
    now = datetime.utcnow()
    gr._tournament_cache = {
        "tournament1": {"ranking": 1, "last_update": now},
        "tournament2": {"ranking": 2, "last_update": None},
    }
    iso_date = await gr.get_recent_tournament_update_iso()
    assert iso_date == now.isoformat()
