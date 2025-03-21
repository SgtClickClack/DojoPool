"""
Unit tests for the Realtime Ranking Service Module.
"""

import pytest

from dojopool.core.ranking.realtime_service import RealTimeRankingService


@pytest.mark.asyncio
async def test_update_rankings() -> None:
    service = RealTimeRankingService()
    await service.update_rankings()
    # Our dummy fetch returns a fixed list [5, 4, 3, 2, 1]
    assert service.rankings == [5, 4, 3, 2, 1]

def test_get_top_rankings() -> None:
    service = RealTimeRankingService()
    service.rankings = [100, 90, 80, 70, 60]
    top3 = service.get_top_rankings(0, 3)
    assert top3 == [100, 90, 80]
