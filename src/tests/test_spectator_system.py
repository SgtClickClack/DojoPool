import pytest
from datetime import datetime
from src.spectator.spectator_system import SpectatorSystem


@pytest.fixture
async def spectator_system():
    return SpectatorSystem()


@pytest.mark.asyncio
async def test_stream_management():
    """Test stream creation and management."""
    system = SpectatorSystem()

    # Test stream creation
    match_data = {"participants": ["Ninja123", "Samurai456"], "venue": "Epic Arena"}
    stream_key = await system.start_stream("match_1", match_data)
    assert stream_key in system.active_streams

    # Test joining stream
    success = await system.join_stream(stream_key, "spectator_1")
    assert success
    assert "spectator_1" in system.active_streams[stream_key]["spectators"]

    # Test metrics update
    assert system.active_streams[stream_key]["metrics"]["total_views"] == 1
    assert system.active_streams[stream_key]["metrics"]["peak_viewers"] == 1


@pytest.mark.asyncio
async def test_highlight_reel_generation():
    """Test highlight reel generation."""
    system = SpectatorSystem()

    # Add some highlights
    system.highlight_reels["Ninja123"] = [
        {"timestamp": datetime.now(), "description": "Amazing move!", "excitement_score": 9},
        {"timestamp": datetime.now(), "description": "Epic combo!", "excitement_score": 8},
    ]

    # Generate highlight reel
    highlights = system.generate_highlight_reel("Ninja123", timedelta(days=1))
    assert len(highlights) == 2
    assert highlights[0]["excitement_score"] > highlights[1]["excitement_score"]
