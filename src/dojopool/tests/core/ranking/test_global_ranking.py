"""Test global ranking module."""

import pytest
from datetime import datetime, timedelta
from typing import AsyncGenerator, Dict, Any, List
from unittest.mock import AsyncMock, patch, Mock
from flask import Flask, current_app
import asyncio
from sqlalchemy.orm import Session

from dojopool.core.ranking.global_ranking import GlobalRankingService, RankingEntry
from dojopool.core.ranking.config import GLOBAL_RANKING_CONFIG
from dojopool.models.user import User
from dojopool.models.role import Role
from dojopool.models.game import Game
from dojopool.models.tournament import Tournament, TournamentGame
from dojopool.models.match import Match
from dojopool.models.venue import Venue
from dojopool.models.ranking_history import RankingHistory
from dojopool.extensions import init_extensions, db, db_service, cache_service
from dojopool.models.player_ratings import PlayerRating
from dojopool.models.player_titles import PlayerTitle
from dojopool.models.tournament import TournamentParticipant


@pytest.fixture
def app():
    """Create and configure a test Flask app."""
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = True
    init_extensions(app)
    return app


@pytest.fixture
def app_context(app):
    """Create app context."""
    with app.app_context():
        db.create_all()

        # Create test user
        user = User(
            username="testuser1",
            email="test1@example.com",
            global_rating=1000.0,
            global_rank=1,
            rank_tier="bronze",
            total_games=10,
            games_won=5,
        )
        db.session.add(user)
        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()


@pytest.fixture
def ranking_service(app_context):
    """Create ranking service."""
    return GlobalRankingService()


@pytest.fixture
def mock_db_service() -> AsyncMock:
    """Create mock database service."""
    mock = AsyncMock()
    mock.fetch_all = AsyncMock()
    mock.get = AsyncMock()
    mock.set = AsyncMock()
    return mock


@pytest.fixture
def mock_cache_service() -> AsyncMock:
    """Create mock cache service."""
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock()
    mock.delete = AsyncMock()
    return mock


@pytest.fixture
def mock_db_session() -> AsyncMock:
    """Create mock database session."""
    mock = AsyncMock()
    mock.commit = AsyncMock()
    mock.rollback = AsyncMock()
    return mock


@pytest.fixture
def mock_user() -> Mock:
    """Create mock user."""
    return Mock(
        id=1,
        rating=1500.0,
        games_played=10,
        wins=6,
        losses=4,
        streak=2,
        last_game=datetime.now(),
        is_active=True,
    )


@pytest.fixture
def mock_cache(mock_cache_service: AsyncMock) -> AsyncMock:
    """Get mock cache service."""
    return mock_cache_service


@pytest.fixture
def sample_player_data() -> List[Dict[str, Any]]:
    """Create sample player data."""
    now = datetime.now()
    return [
        {
            "id": 1,
            "rating": 2000.0,
            "games_played": 50,
            "wins": 30,
            "losses": 20,
            "streak": 3,
            "last_game": now,
            "previous_rating": 1950.0,
            "title_name": "Master",
        },
        {
            "id": 2,
            "rating": 1800.0,
            "games_played": 40,
            "wins": 25,
            "losses": 15,
            "streak": 2,
            "last_game": now,
            "previous_rating": 1820.0,
            "title_name": "Expert",
        },
        {
            "id": 3,
            "rating": 1600.0,
            "games_played": 30,
            "wins": 15,
            "losses": 15,
            "streak": 0,
            "last_game": now,
            "previous_rating": 1600.0,
            "title_name": "Advanced",
        },
    ]


@pytest.fixture
def sample_rating_history() -> List[Dict[str, Any]]:
    """Create sample rating history data."""
    return [
        {"user_id": 1, "rating": 1950.0},
        {"user_id": 2, "rating": 1820.0},
        {"user_id": 3, "rating": 1600.0},
    ]


class TestGlobalRankingService:
    @pytest.mark.asyncio
    async def test_calculate_global_rating(
        self, app_context, ranking_service: GlobalRankingService, mock_db_service: AsyncMock
    ):
        """Test calculating global rating."""
        user_id = 1
        mock_db_service.fetch_all.return_value = [
            {"winner_id": user_id, "completed_at": datetime.now()},
            {"winner_id": user_id, "completed_at": datetime.now()},
            {"loser_id": user_id, "completed_at": datetime.now()},
        ]

        await ranking_service.initialize()
        rating = await ranking_service.calculate_global_rating(user_id)
        assert isinstance(rating, float)
        assert 0 <= rating <= 3000

    @pytest.mark.asyncio
    async def test_get_player_tier(self, app_context, ranking_service: GlobalRankingService):
        """Test getting player tier."""
        await ranking_service.initialize()
        tier = await ranking_service.get_player_tier(2500)
        assert tier["name"] == "Pool God"

        tier = await ranking_service.get_player_tier(2000)
        assert tier["name"] == "Master"

        tier = await ranking_service.get_player_tier(1000)
        assert tier["name"] == "Novice"

    @pytest.mark.asyncio
    async def test_calculate_win_rate(
        self, app_context, ranking_service: GlobalRankingService, mock_db_service: AsyncMock
    ):
        """Test calculating win rate."""
        user_id = 1
        mock_db_service.fetch_all.return_value = [
            {"winner_id": user_id},
            {"winner_id": user_id},
            {"loser_id": user_id},
            {"winner_id": user_id},
        ]

        await ranking_service.initialize()
        win_rate = await ranking_service._calculate_win_rate(user_id)
        assert win_rate == 0.75

    @pytest.mark.asyncio
    async def test_calculate_tournament_performance(
        self, app_context, ranking_service: GlobalRankingService, mock_db_service: AsyncMock
    ):
        """Test calculating tournament performance."""
        user_id = 1
        mock_db_service.fetch_all.return_value = [
            {"placement": 1},
            {"placement": 2},
            {"placement": 3},
        ]

        await ranking_service.initialize()
        performance = await ranking_service._calculate_tournament_performance(user_id)
        assert isinstance(performance, float)
        assert 0 <= performance <= 1

    @pytest.mark.asyncio
    async def test_update_global_rankings(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
        sample_player_data: List[Dict[str, Any]],
        sample_rating_history: List[Dict[str, Any]],
    ) -> None:
        """Test updating global rankings."""
        mock_db_service.fetch_all.side_effect = [sample_player_data, sample_rating_history]

        await ranking_service.initialize()
        await ranking_service.update_global_rankings()

        assert mock_db_service.fetch_all.call_count == 2
        assert len(ranking_service._rankings) == 3
        assert len(ranking_service._rank_order) == 3

        player1 = ranking_service._rankings[1]
        assert player1.rating == 2000.0
        assert player1.rank == 1
        assert player1.change_24h == 50.0

    @pytest.mark.asyncio
    async def test_calculate_opponent_strength(
        self, app_context, ranking_service: GlobalRankingService, mock_db_service: AsyncMock
    ):
        """Test calculating opponent strength."""
        user_id = 1
        mock_db_service.fetch_all.return_value = [
            {"opponent_id": 2, "rating": 2000},
            {"opponent_id": 3, "rating": 1800},
            {"opponent_id": 4, "rating": 2200},
        ]

        await ranking_service.initialize()
        strength = await ranking_service._calculate_opponent_strength(user_id)
        assert isinstance(strength, float)
        assert 1800 <= strength <= 2200

    @pytest.mark.asyncio
    async def test_calculate_activity_score(
        self, app_context, ranking_service: GlobalRankingService, mock_db_service: AsyncMock
    ):
        """Test calculating activity score."""
        user_id = 1

        await ranking_service.initialize()

        # Test high activity
        mock_db_service.fetch_all.return_value = [{}] * 25
        high_score = await ranking_service._calculate_activity_score(user_id)
        assert high_score == 1.0

        # Test medium activity
        mock_db_service.fetch_all.return_value = [{}] * 10
        med_score = await ranking_service._calculate_activity_score(user_id)
        assert 0 < med_score < 1

        # Test low activity
        mock_db_service.fetch_all.return_value = []
        low_score = await ranking_service._calculate_activity_score(user_id)
        assert low_score == 0

    @pytest.mark.asyncio
    async def test_has_minimum_games(
        self, app_context, ranking_service: GlobalRankingService, mock_db_service: AsyncMock
    ):
        """Test checking minimum games requirement."""
        user_id = 1
        min_games = GLOBAL_RANKING_CONFIG["min_games_required"]

        await ranking_service.initialize()

        # Test insufficient games
        mock_db_service.fetch_all.return_value = [{}] * (min_games - 1)
        has_min = await ranking_service._has_minimum_games(user_id)
        assert not has_min

        # Test sufficient games
        mock_db_service.fetch_all.return_value = [{}] * min_games
        has_min = await ranking_service._has_minimum_games(user_id)
        assert has_min

    @pytest.mark.asyncio
    async def test_get_rankings_in_range(
        self, app_context, ranking_service: GlobalRankingService, mock_cache_service: AsyncMock
    ):
        """Test getting rankings in range."""
        mock_rankings = [{"user_id": i, "rating": 2000 - i * 100} for i in range(1, 21)]
        mock_cache_service.get.return_value = mock_rankings

        await ranking_service.initialize()

        # Test valid range
        rankings = await ranking_service.get_rankings_in_range(1, 10)
        assert len(rankings) == 10
        assert rankings[0]["rating"] > rankings[-1]["rating"]

        # Test range exceeding available rankings
        rankings = await ranking_service.get_rankings_in_range(15, 25)
        assert len(rankings) == 6

    @pytest.mark.asyncio
    async def test_get_player_ranking_details(
        self, app_context, ranking_service: GlobalRankingService, mock_cache_service: AsyncMock
    ):
        """Test getting player ranking details."""
        user_id = 1
        mock_data = {"rating": 2000, "rank": 5, "games_played": 100, "win_rate": 0.65}
        mock_cache_service.get.return_value = mock_data

        await ranking_service.initialize()
        details = await ranking_service.get_player_ranking_details(user_id)
        assert details["rating"] == 2000
        assert details["rank"] == 5
        assert details["games_played"] == 100
        assert details["win_rate"] == 0.65

    @pytest.mark.asyncio
    async def test_get_nearby_rankings(
        self, app_context, ranking_service: GlobalRankingService, mock_cache_service: AsyncMock
    ):
        """Test getting nearby rankings."""
        user_id = 1
        mock_cache_service.get.return_value = [
            {"user_id": 1, "rating": 2000, "rank": 1},
            {"user_id": 2, "rating": 1900, "rank": 2},
            {"user_id": 3, "rating": 1800, "rank": 3},
        ]

        await ranking_service.initialize()
        rankings = await ranking_service.get_nearby_rankings(user_id, range_size=1)
        assert len(rankings) == 2
        assert rankings[0]["user_id"] == 1
        assert rankings[1]["user_id"] == 2

    @pytest.mark.asyncio
    async def test_get_top_rankings(
        self, app_context, ranking_service: GlobalRankingService, mock_db_service: AsyncMock
    ):
        """Test getting top rankings."""
        mock_db_service.fetch_all.return_value = [
            {"user_id": i, "rating": 2000 - i * 100} for i in range(1, 11)
        ]

        await ranking_service.initialize()
        rankings = await ranking_service.get_top_rankings(limit=5)
        assert len(rankings) == 5
        assert rankings[0]["rating"] > rankings[-1]["rating"]

    @pytest.mark.asyncio
    async def test_cache_rankings(
        self, app_context, ranking_service: GlobalRankingService, mock_cache_service: AsyncMock
    ):
        """Test caching rankings."""
        await ranking_service.initialize()
        await ranking_service._cache_rankings()
        assert mock_cache_service.set.called
        assert mock_cache_service.set.call_args[0][0] == "global_rankings"

    @pytest.mark.asyncio
    async def test_load_cached_rankings(
        self, app_context, ranking_service: GlobalRankingService, mock_cache_service: AsyncMock
    ):
        """Test loading cached rankings."""
        mock_data = {
            "rankings": {
                "1": {
                    "user_id": 1,
                    "rating": 2000.0,
                    "rank": 1,
                    "change_24h": 50.0,
                    "games_played": 50,
                    "wins": 30,
                    "losses": 20,
                    "streak": 3,
                    "last_game": datetime.now().isoformat(),
                    "title": "Master",
                }
            },
            "rank_order": [1],
            "last_update": datetime.now().isoformat(),
        }
        mock_cache_service.get.return_value = mock_data

        await ranking_service.initialize()
        success = await ranking_service._load_cached_rankings()
        assert success
        assert len(ranking_service._rankings) == 1
        assert ranking_service._rankings[1].rating == 2000.0
