import pytest
from dojopool.api.api_handler import APIHandler
from dojopool.narrative.narrative_generator import NarrativeGenerator
from dojopool.ranking.ranking_system import RankingSystem
from dojopool.spectator.spectator_system import SpectatorSystem


@pytest.mark.asyncio
async def test_full_battle_flow():
    """Test complete battle flow with all systems."""
    # Initialize all systems
    api_handler = APIHandler()
    narrative_gen = NarrativeGenerator()
    ranking_system = RankingSystem()
    SpectatorSystem()

    # Create test avatars
    avatar1_data = {"name": "TestNinja", "rank": 0, "followers": set()}
    avatar2_data = {"name": "TestSamurai", "rank": 0, "followers": set()}

    # Save avatars
    await api_handler.save_avatar(avatar1_data)
    await api_handler.save_avatar(avatar2_data)

    # Simulate battle
    battle_event = {
        "event_type": "battle",
        "avatar_name": "TestNinja",
        "opponent": "TestSamurai",
        "location": {"lat": 35.6762, "lng": 139.6503},
        "outcome": "victory",
    }

    # Record event
    await api_handler.save_event(battle_event)
    narrative_gen.record_event(battle_event)

    # Update rankings
    ranking_system.calculate_rank("TestNinja", {"followers": 100, "wins": 1, "total_matches": 1})

    # Generate narrative
    narrative = narrative_gen.generate_narrative("TestNinja")
    assert "TestNinja" in narrative
    assert "victory" in narrative.lower()

    # Verify database records
    events = await api_handler.get_avatar_events("TestNinja", limit=1)
    assert len(events) == 1
    assert events[0]["outcome"] == "victory"


@pytest.mark.asyncio
async def test_spectator_integration():
    """Test spectator system integration with other components."""
    APIHandler()
    spectator_system = SpectatorSystem()

    # Create a test match
    match_data = {
        "id": "test_match_1",
        "participants": ["TestNinja", "TestSamurai"],
        "venue": "Test Arena",
    }

    # Start stream
    stream_key = await spectator_system.start_stream(match_data["id"], match_data)

    # Add spectators
    await spectator_system.join_stream(stream_key, "spectator_1")
    await spectator_system.join_stream(stream_key, "spectator_2")

    # Verify stream metrics
    stream = spectator_system.active_streams[stream_key]
    assert len(stream["spectators"]) == 2
    assert stream["metrics"]["total_views"] == 2
