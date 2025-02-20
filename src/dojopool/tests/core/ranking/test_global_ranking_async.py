"""Test global ranking module with async SQLAlchemy."""

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
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Mapped, declarative_base, mapped_column, relationship
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.rankingetattr import (
    GLOBAL_RANKING_CONFIG,
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
    "config",
    "global_ranking",
    dojopool.core.rankingetattr,
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

# Create base class for declarative models
Base: declarative_base = declarative_base()


@pytest.fixture
async def app():
    """Create and configure a test Flask app."""
    app: Flask = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite+aiosqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = True
    return app


@pytest.fixture
async def engine(app):
    """Create async engine."""
    engine: create_async_engine = create_async_engine(app.config["SQLALCHEMY_DATABASE_URI"])
    yield engine
    await engine.dispose()


@pytest.fixture
async def async_session(engine):
    """Create async session factory."""
    async_session_factory: async_sessionmaker = async_sessionmaker(engine, expire_on_commit=False)
    yield async_session_factory


@pytest.fixture
async def db_session(async_session) -> AsyncGenerator[AsyncSession, None]:
    """Create an async database session."""
    async with async_session() as session:
        yield session


@pytest.fixture
async def app_context(app, engine, db_session):
    """Create app context with test data."""
    async with app.app_context():
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

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

        async with db_session.begin():
            for user in test_users:
                db_session.add(user)

        yield app

        # Cleanup
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)


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
        assert performance > 0
