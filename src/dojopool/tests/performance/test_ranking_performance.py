import pytest
import time
from datetime import datetime, timedelta
from typing import List
import statistics
import asyncio
import aiohttp
import json

from dojopool.core.ranking.global_ranking import GlobalRankingService
from dojopool.models.user import User
from dojopool.models.game import Game
from dojopool.extensions import db


@pytest.fixture
def large_dataset():
    """Create a large dataset for performance testing."""
    users = []
    for i in range(1000):  # 1000 users
        user = User(
            username=f"perf_test_player_{i}", email=f"perf_player{i}@test.com", is_active=True
        )
        users.append(user)
        db.session.add(user)
    db.session.commit()

    # Create games (10,000 games)
    games = []
    for i in range(10000):
        winner_idx = i % 1000
        loser_idx = (i + 1) % 1000
        game = Game(
            winner_id=users[winner_idx].id,
            loser_id=users[loser_idx].id,
            completed_at=datetime.now() - timedelta(days=i % 30),
            type="8_BALL",
        )
        games.append(game)
        if i % 1000 == 0:  # Batch commit every 1000 games
            db.session.bulk_save_objects(games)
            db.session.commit()
            games = []

    if games:  # Commit remaining games
        db.session.bulk_save_objects(games)
        db.session.commit()

    yield users

    # Cleanup
    db.session.query(Game).delete()
    db.session.query(User).delete()
    db.session.commit()


def measure_execution_time(func):
    """Decorator to measure function execution time."""

    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        end_time = time.perf_counter()
        execution_time = end_time - start_time
        return result, execution_time

    return wrapper


@measure_execution_time
def update_rankings(ranking_service: GlobalRankingService):
    """Update global rankings."""
    return ranking_service.update_global_rankings()


@measure_execution_time
def get_player_details(ranking_service: GlobalRankingService, user_id: int):
    """Get player ranking details."""
    return ranking_service.get_player_ranking_details(user_id)


@measure_execution_time
def get_rankings_range(ranking_service: GlobalRankingService, start: int, end: int):
    """Get rankings for a range."""
    return ranking_service.get_rankings_in_range(start, end)


class TestRankingPerformance:
    """Performance tests for the ranking system."""

    def test_ranking_update_performance(self, large_dataset):
        """Test performance of global ranking updates."""
        ranking_service = GlobalRankingService()

        # Measure multiple updates
        update_times = []
        for _ in range(5):
            _, execution_time = update_rankings(ranking_service)
            update_times.append(execution_time)
            time.sleep(1)  # Wait between updates

        avg_time = statistics.mean(update_times)
        max_time = max(update_times)

        # Performance assertions
        assert avg_time < 5.0  # Average update should take less than 5 seconds
        assert max_time < 10.0  # No single update should take more than 10 seconds

    def test_player_details_performance(self, large_dataset):
        """Test performance of player details retrieval."""
        ranking_service = GlobalRankingService()

        # Update rankings first
        ranking_service.update_global_rankings()

        # Test retrieval for multiple players
        retrieval_times = []
        for user in large_dataset[:100]:  # Test first 100 players
            _, execution_time = get_player_details(ranking_service, user.id)
            retrieval_times.append(execution_time)

        avg_time = statistics.mean(retrieval_times)
        p95_time = sorted(retrieval_times)[int(len(retrieval_times) * 0.95)]

        # Performance assertions
        assert avg_time < 0.1  # Average retrieval should take less than 100ms
        assert p95_time < 0.2  # 95th percentile should be under 200ms

    def test_rankings_range_performance(self, large_dataset):
        """Test performance of rankings range retrieval."""
        ranking_service = GlobalRankingService()

        # Update rankings first
        ranking_service.update_global_rankings()

        # Test different range sizes
        range_sizes = [10, 50, 100, 500]
        for size in range_sizes:
            _, execution_time = get_rankings_range(ranking_service, 1, size)
            # Performance assertions based on range size
            assert execution_time < (size / 100)  # Scale with range size

    async def test_concurrent_requests(self, large_dataset, test_client):
        """Test performance under concurrent requests."""
        ranking_service = GlobalRankingService()
        ranking_service.update_global_rankings()

        async def make_request(session, endpoint):
            async with session.get(f"http://localhost:8000/api/rankings/{endpoint}") as response:
                return await response.json()

        async def run_concurrent_requests():
            async with aiohttp.ClientSession() as session:
                # Create 50 concurrent requests
                tasks = []
                for i in range(50):
                    if i % 2 == 0:
                        tasks.append(make_request(session, f"player/{large_dataset[i].id}"))
                    else:
                        tasks.append(make_request(session, "global?start_rank=1&end_rank=10"))

                start_time = time.perf_counter()
                await asyncio.gather(*tasks)
                end_time = time.perf_counter()

                return end_time - start_time

        total_time = await run_concurrent_requests()

        # Performance assertions for concurrent requests
        assert total_time < 5.0  # All 50 requests should complete within 5 seconds

    def test_cache_performance(self, large_dataset):
        """Test caching performance."""
        ranking_service = GlobalRankingService()

        # First request (uncached)
        _, uncached_time = get_rankings_range(ranking_service, 1, 100)

        # Second request (should be cached)
        _, cached_time = get_rankings_range(ranking_service, 1, 100)

        # Cache should provide significant speedup
        assert cached_time < uncached_time * 0.2  # Cached should be at least 5x faster

    def test_memory_usage(self, large_dataset):
        """Test memory usage during ranking operations."""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        ranking_service = GlobalRankingService()

        # Measure memory before update
        memory_before = process.memory_info().rss

        # Perform ranking update
        ranking_service.update_global_rankings()

        # Measure memory after update
        memory_after = process.memory_info().rss
        memory_increase = memory_after - memory_before

        # Memory usage assertions
        assert memory_increase < 500 * 1024 * 1024  # Should not increase by more than 500MB

    def test_database_query_performance(self, large_dataset):
        """Test database query performance."""
        ranking_service = GlobalRankingService()

        def measure_query_time():
            start_time = time.perf_counter()
            db.session.query(Game).count()
            return time.perf_counter() - start_time

        # Measure query times
        query_times = [measure_query_time() for _ in range(10)]
        avg_query_time = statistics.mean(query_times)

        # Query performance assertions
        assert avg_query_time < 0.1  # Average query should take less than 100ms

    @pytest.mark.parametrize("batch_size", [100, 500, 1000])
    def test_batch_processing_performance(self, large_dataset, batch_size):
        """Test performance with different batch sizes."""
        ranking_service = GlobalRankingService()

        start_time = time.perf_counter()

        # Process users in batches
        for i in range(0, len(large_dataset), batch_size):
            batch = large_dataset[i : i + batch_size]
            user_ids = [user.id for user in batch]

            # Perform batch operations
            db.session.query(Game).filter(
                (Game.winner_id.in_(user_ids)) | (Game.loser_id.in_(user_ids))
            ).all()

        processing_time = time.perf_counter() - start_time

        # Performance assertions based on batch size
        assert processing_time < (len(large_dataset) / batch_size) * 0.5

    def test_api_response_size(self, large_dataset, test_client):
        """Test API response size optimization."""
        ranking_service = GlobalRankingService()
        ranking_service.update_global_rankings()

        # Get rankings response
        response = test_client.get("/api/rankings/global?start_rank=1&end_rank=100")
        response_size = len(json.dumps(response.json))

        # Response size assertions
        assert response_size < 50 * 1024  # Response should be under 50KB
