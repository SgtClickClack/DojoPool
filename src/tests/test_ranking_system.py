import pytest
from src.ranking.ranking_system import RankingSystem, RankTier


@pytest.fixture
def ranking_system():
    return RankingSystem()


def test_calculate_rank():
    """Test rank calculation."""
    system = RankingSystem()

    # Test novice rank
    novice_stats = {
        "followers": 10,
        "wins": 5,
        "total_matches": 10,
        "active_spectators": set(["fan1"]),
        "highlight_reels": [],
    }
    novice_rank = system.calculate_rank("Novice1", novice_stats)
    assert novice_rank["tier"] == RankTier.NOVICE

    # Test legend rank
    legend_stats = {
        "followers": 1000,
        "wins": 95,
        "total_matches": 100,
        "active_spectators": set(["fan1", "fan2", "fan3"]),
        "highlight_reels": ["reel1", "reel2", "reel3"],
    }
    legend_rank = system.calculate_rank("Legend1", legend_stats)
    assert legend_rank["tier"] == RankTier.LEGEND


def test_sponsorship_eligibility():
    """Test sponsorship eligibility."""
    system = RankingSystem()

    # Test ineligible avatar
    ineligible_stats = {"followers": 10, "wins": 5, "total_matches": 10}
    system.calculate_rank("Ineligible1", ineligible_stats)
    sponsorship = system.process_sponsorship("Ineligible1")
    assert sponsorship is None

    # Test eligible avatar
    eligible_stats = {"followers": 1000, "wins": 95, "total_matches": 100}
    system.calculate_rank("Eligible1", eligible_stats)
    sponsorship = system.process_sponsorship("Eligible1")
    assert sponsorship is not None
    assert sponsorship.tier == RankTier.LEGEND.name
