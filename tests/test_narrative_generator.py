import pytest
from datetime import datetime
from dojopool.narrative.narrative_generator import NarrativeGenerator, Event, EventType


@pytest.fixture
def narrative_generator():
    return NarrativeGenerator()


def test_generate_episode_title():
    """Test episode title generation."""
    generator = NarrativeGenerator()

    # Test battle event title
    battle_event = Event(
        timestamp=datetime.now(),
        event_type=EventType.BATTLE,
        avatar_name="Ninja123",
        title="Epic Battle",
        description="An intense battle",
        location={"name": "Dojo"},
        participants=["Ninja123", "Samurai456"],
        outcome="victory",
        moral_impact=10,
        tags=["battle"],
    )

    title = generator._generate_episode_title([battle_event])
    assert "Clash!" in title
    assert "Ninja123" in title


def test_episode_completion_conditions():
    """Test conditions for episode completion."""
    generator = NarrativeGenerator()

    # Add events that don't complete an episode
    incomplete = generator._should_complete_episode("Ninja123")
    assert not incomplete

    # Add events that complete an episode
    events = [
        Event(
            timestamp=datetime.now(),
            event_type=EventType.BATTLE,
            avatar_name="Ninja123",
            title="Battle",
            description="Battle description",
            location={"name": "Dojo"},
            participants=["Ninja123", "Samurai456"],
            outcome="victory",
            moral_impact=10,
            tags=["battle"],
        ),
        Event(
            timestamp=datetime.now(),
            event_type=EventType.MORAL_CHOICE,
            avatar_name="Ninja123",
            title="Decision",
            description="Made a choice",
            location={"name": "Dojo"},
            participants=["Ninja123"],
            outcome="good",
            moral_impact=5,
            tags=["choice"],
        ),
    ]

    for event in events:
        generator.record_event(event)

    complete = generator._should_complete_episode("Ninja123")
    assert complete
