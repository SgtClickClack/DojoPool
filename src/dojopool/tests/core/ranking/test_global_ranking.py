"""Test global ranking module."""

import asyncio
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, AsyncGenerator, Dict, List, NoReturn, Optional, Set, Tuple, Union
from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest
from flask import Flask, Request, Response, current_app
from flask.typing import ResponseReturnValue
from sqlalchemy import ForeignKey
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship, sessionmaker
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.extensions import cache, db, init_extensions
from dojopool.core.ranking import GLOBAL_RANKING, GLOBAL_RANKING_CONFIG
from dojopool.core.rankingetattr import (
    Game,
    GlobalRankingService,
    Match,
    None,
    PlayerRating,
    PlayerTitle,
    RankingEntry,
    RankingHistory,
    Role,
    Tournament,
    TournamentMatch,
    TournamentParticipant,
    "global_ranking",
    dojopool.models.game,
    dojopool.models.match,
    dojopool.models.player_ratings,
    dojopool.models.player_titles,
    dojopool.models.ranking_history,
    dojopool.models.role,
    dojopool.models.tournament,
    from,
    g,
    import,
)
from dojopool.models.user import User
from dojopool.models.venue import Venue


@pytest.fixture
async def app():
    """Create and configure a test Flask app."""
    app: Flask = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite+aiosqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = True

    # Initialize extensions
    init_extensions(app)
    return app


@pytest.fixture
async def db_session(app) -> AsyncGenerator[AsyncSession, None]:
    """Create an async database session."""
    async_session: sessionmaker = sessionmaker(db.engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session


@pytest.fixture
async def app_context(app, db_session):
    """Create app context with test data."""
    async with app.app_context():
        await db.create_all()

        # Create test users
        test_users: Any = [
            User(
                id=i,
                username=f"testuser{i}",
                email=f"test{i}@example.com",
                global_rating=1000.0 + (i * 100),
                global_rank=i,
                rank_tier="bronze",
                total_games=10,
                games_won=5,
                is_active=True,
            )
            for i in range(1, 6)
        ]

        for user in test_users:
            db_session.add(user)
        await db_session.commit()

        yield app

        await db_session.rollback()
        await db.drop_all()


@pytest.fixture
async def ranking_service(app_context, db_session):
    """Create and initialize ranking service."""
    service: GlobalRankingService = GlobalRankingService()
    await service.initialize()
    return service


@pytest.fixture
def mock_db_service():
    """Create mock database service."""
    mock: AsyncMock = AsyncMock()
    mock.execute = AsyncMock()
    mock.fetch_all = AsyncMock()
    return mock


@pytest.fixture
def mock_cache_service():
    """Create mock cache service."""
    mock: AsyncMock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock()
    return mock


@pytest.fixture
def mock_db_session() :
    """Create mock database session."""
    mock: AsyncMock = AsyncMock()
    mock.commit = AsyncMock()
    mock.rollback = AsyncMock()
    return mock


@pytest.fixture
def mock_user() :
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
def mock_cache(mock_cache_service: AsyncMock) :
    """Get mock cache service."""
    return mock_cache_service


@pytest.fixture
def sample_player_data() -> List[Dict[str, Any]]:
    """Create sample player data."""
    now: Any = datetime.now()
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
def sample_rating_history() :
    """Create sample rating history data."""
    return [
        {"user_id": 1, "rating": 1950.0},
        {"user_id": 2, "rating": 1820.0},
        {"user_id": 3, "rating": 1600.0},
    ]


class TestGlobalRankingService:
    """Test cases for GlobalRankingService."""

    @pytest.mark.asyncio
    async def test_calculate_global_rating(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
    ):
        """Test calculation of global rating."""
        user_id: int = 1

        # Setup mock data for game stats
        mock_db_service.execute.return_value.scalars.return_value = [
            Mock(winner_id=user_id, completed_at=datetime.now(), rating=1500.0)
            for _ in range(3)
        ]

        with patch("dojopool.core.rankingetattr(g, "global_ranking", None).db_service", mock_db_service):
            rating: Any = await ranking_service.calculate_global_rating(user_id)
            assert isinstance(rating, float)
            assert rating >= GLOBAL_RANKING_CONFIG["minimum_rating"]

    @pytest.mark.asyncio
    async def test_get_player_tier(
        self, app_context, ranking_service: GlobalRankingService
    ):
        """Test getting player tier based on rating."""
        tier: Any = await ranking_service.get_player_tier(2500.0)
        assert isinstance(tier, dict)
        assert all(key in tier for key in ["name", "icon", "color", "min_rating"])
        assert tier["name"] in [
            "Pool God",
            "Master",
            "Expert",
            "Intermediate",
            "Novice",
        ]

    @pytest.mark.asyncio
    async def test_calculate_win_rate(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
    ):
        """Test calculating win rate."""
        user_id: int = 1
        mock_db_service.fetch_all.return_value = [
            {"winner_id": user_id},
            {"winner_id": user_id},
            {"loser_id": user_id},
            {"winner_id": user_id},
        ]

        await ranking_service.initialize()
        win_rate: Any = await ranking_service._calculate_win_rate(user_id)
        assert win_rate == 0.75

    @pytest.mark.asyncio
    async def test_calculate_tournament_performance(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
    ):
        """Test calculating tournament performance."""
        user_id: int = 1
        mock_db_service.fetch_all.return_value = [
            {"placement": 1},
            {"placement": 2},
            {"placement": 3},
        ]

        await ranking_service.initialize()
        performance: Any = await ranking_service._calculate_tournament_performance(user_id)
        assert isinstance(performance, float)
        assert 0 <= performance <= 1

    @pytest.mark.asyncio
    async def test_update_global_rankings(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
    ):
        """Test updating global rankings."""
        # Setup mock active players
        mock_db_service.execute.return_value.scalars.return_value = [
            Mock(id=i, is_active=True) for i in range(1, 4)
        ]

        # Setup mock game data
        mock_db_service.fetch_all.return_value = [
            {"winner_id": 1, "completed_at": datetime.now()} for _ in range(5)
        ]

        with patch("dojopool.core.rankingetattr(g, "global_ranking", None).db_service", mock_db_service):
            await ranking_service.update_global_rankings()

            # Verify database was updated
            assert mock_db_service.execute.called

            # Verify cache was updated
            rankings: Any = await ranking_service.get_rankings_in_range(1, 3)
            assert len(rankings) > 0
            assert all(isinstance(r["rating"], float) for r in rankings)

    @pytest.mark.asyncio
    async def test_calculate_opponent_strength(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
    ):
        """Test calculating opponent strength."""
        user_id: int = 1
        mock_db_service.fetch_all.return_value = [
            {"opponent_id": 2, "rating": 2000},
            {"opponent_id": 3, "rating": 1800},
            {"opponent_id": 4, "rating": 2200},
        ]

        await ranking_service.initialize()
        strength: Any = await ranking_service._calculate_opponent_strength(user_id)
        assert isinstance(strength, float)
        assert 1800 <= strength <= 2200

    @pytest.mark.asyncio
    async def test_calculate_activity_score(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
    ):
        """Test calculating activity score."""
        user_id: int = 1

        await ranking_service.initialize()

        # Test high activity
        mock_db_service.fetch_all.return_value = [{}] * 25
        high_score: Any = await ranking_service._calculate_activity_score(user_id)
        assert high_score == 1.0

        # Test medium activity
        mock_db_service.fetch_all.return_value = [{}] * 10
        med_score: Any = await ranking_service._calculate_activity_score(user_id)
        assert 0 < med_score < 1

        # Test low activity
        mock_db_service.fetch_all.return_value = []
        low_score: Any = await ranking_service._calculate_activity_score(user_id)
        assert low_score == 0

    @pytest.mark.asyncio
    async def test_has_minimum_games(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
    ):
        """Test checking minimum games requirement."""
        user_id: int = 1
        min_games: Any = GLOBAL_RANKING_CONFIG["min_games_required"]

        await ranking_service.initialize()

        # Test insufficient games
        mock_db_service.fetch_all.return_value = [{}] * (min_games - 1)
        has_min: Any = await ranking_service._has_minimum_games(user_id)
        assert not has_min

        # Test sufficient games
        mock_db_service.fetch_all.return_value = [{}] * min_games
        has_min: Any = await ranking_service._has_minimum_games(user_id)
        assert has_min

    @pytest.mark.asyncio
    async def test_get_rankings_in_range(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_cache_service: AsyncMock,
    ):
        """Test getting rankings within a range."""
        # Setup mock cache data
        mock_rankings: Dict[Any, Any] = {
            "rankings": {
                str(i): {
                    "user_id": i,
                    "rating": 2000 - (i * 100),
                    "rank": i,
                    "change_24h": 0,
                    "games_played": 10,
                    "wins": 5,
                    "losses": 5,
                    "streak": 0,
                    "last_game": datetime.now().isoformat(),
                    "title": "Expert",
                }
                for i in range(1, 6)
            },
            "rank_order": list(range(1, 6)),
            "last_update": datetime.now().isoformat(),
        }
        mock_cache_service.get.return_value = mock_rankings

        with patch(
            "dojopool.core.rankingetattr(g, "global_ranking", None).cache_service", mock_cache_service
        ):
            rankings: Any = await ranking_service.get_rankings_in_range(1, 3)
            assert len(rankings) == 3
            assert rankings[0]["rating"] > rankings[1]["rating"] > rankings[2]["rating"]

    @pytest.mark.asyncio
    async def test_get_player_ranking_details(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_cache_service: AsyncMock,
    ):
        """Test getting player ranking details."""
        user_id: int = 1
        mock_data: Dict[Any, Any] = {"rating": 2000, "rank": 5, "games_played": 100, "win_rate": 0.65}
        mock_cache_service.get.return_value = mock_data

        await ranking_service.initialize()
        details: Any = await ranking_service.get_player_ranking_details(user_id)
        assert details["rating"] == 2000
        assert details["rank"] == 5
        assert details["games_played"] == 100
        assert details["win_rate"] == 0.65

    @pytest.mark.asyncio
    async def test_get_nearby_rankings(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_cache_service: AsyncMock,
    ):
        """Test getting nearby rankings."""
        user_id: int = 1
        mock_cache_service.get.return_value = [
            {"user_id": 1, "rating": 2000, "rank": 1},
            {"user_id": 2, "rating": 1900, "rank": 2},
            {"user_id": 3, "rating": 1800, "rank": 3},
        ]

        await ranking_service.initialize()
        rankings: Any = await ranking_service.get_nearby_rankings(user_id, range_size=1)
        assert len(rankings) == 2
        assert rankings[0]["user_id"] == 1
        assert rankings[1]["user_id"] == 2

    @pytest.mark.asyncio
    async def test_get_top_rankings(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
    ):
        """Test getting top rankings."""
        mock_db_service.fetch_all.return_value = [
            {"user_id": i, "rating": 2000 - i * 100} for i in range(1, 11)
        ]

        await ranking_service.initialize()
        rankings: Any = await ranking_service.get_top_rankings(limit=5)
        assert len(rankings) == 5
        assert rankings[0]["rating"] > rankings[-1]["rating"]

    @pytest.mark.asyncio
    async def test_cache_rankings(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_cache_service: AsyncMock,
    ):
        """Test caching rankings."""
        await ranking_service.initialize()
        await ranking_service._cache_rankings()
        assert mock_cache_service.set.called
        assert mock_cache_service.set.call_args[0][0] == "global_rankings"

    @pytest.mark.asyncio
    async def test_load_cached_rankings(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_cache_service: AsyncMock,
    ):
        """Test loading cached rankings."""
        mock_data: Dict[Any, Any] = {
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
        success: Any = await ranking_service._load_cached_rankings()
        assert success
        assert len(ranking_service._rankings) == 1
        assert ranking_service._rankings[1].rating == 2000.0

    @pytest.mark.asyncio
    async def test_error_handling(
        self,
        app_context,
        ranking_service: GlobalRankingService,
        mock_db_service: AsyncMock,
    ):
        """Test error handling in ranking calculations."""
        user_id: int = 1
        mock_db_service.execute.side_effect = Exception("Database error")

        with patch("dojopool.core.rankingetattr(g, "global_ranking", None).db_service", mock_db_service):
            # Should return default rating on error
            rating: Any = await ranking_service.calculate_global_rating(user_id)
            assert rating == GLOBAL_RANKING_CONFIG["initial_rating"]
