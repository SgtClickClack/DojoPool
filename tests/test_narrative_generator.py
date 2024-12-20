"""Tests for narrative generator functionality."""
import pytest
from src.narrative.narrative_generator import NarrativeGenerator, EventType
from datetime import datetime

@pytest.fixture
def generator():
    """Create a narrative generator instance."""
    return NarrativeGenerator()

def test_record_event(generator):
    """Test recording a game event."""
    event = {
        'type': EventType.SHOT.value,
        'description': 'Player takes a shot',
        'timestamp': datetime.now()
    }
    generator.record_event(event)
    assert len(generator.events) == 1
    assert generator.events[0] == event

def test_episode_completion(generator):
    """Test episode completion conditions."""
    # Add events until episode completes
    for _ in range(10):
        event = {
            'type': EventType.SHOT.value,
            'description': 'Player takes a shot',
            'timestamp': datetime.now()
        }
        generator.record_event(event)
    
    # Episode should complete after 10 events
    assert generator.current_episode['completed']

def test_victory_completes_episode(generator):
    """Test that victory event completes episode."""
    event = {
        'type': EventType.VICTORY.value,
        'description': 'Player wins the game',
        'timestamp': datetime.now()
    }
    generator.record_event(event)
    assert generator.current_episode['completed']

def test_battle_completes_episode(generator):
    """Test that battle event completes episode."""
    event = {
        'type': EventType.BATTLE.value,
        'description': 'Epic battle ensues',
        'timestamp': datetime.now()
    }
    generator.record_event(event)
    assert generator.current_episode['completed']

def test_episode_title_generation(generator):
    """Test episode title generation."""
    # Test empty episode
    assert generator.generate_episode_title() == "A New Beginning"
    
    # Test victory episode
    event = {
        'type': EventType.VICTORY.value,
        'description': 'Player wins',
        'timestamp': datetime.now()
    }
    generator.record_event(event)
    assert generator.generate_episode_title() == "Victory at Last"

def test_get_current_episode(generator):
    """Test getting current episode data."""
    event = {
        'type': EventType.SHOT.value,
        'description': 'Player takes a shot',
        'timestamp': datetime.now()
    }
    generator.record_event(event)
    
    episode = generator.get_current_episode()
    assert 'title' in episode
    assert 'events' in episode
    assert 'start_time' in episode
    assert 'completed' in episode
    assert len(episode['events']) == 1

def test_get_event_history(generator):
    """Test getting complete event history."""
    events = [
        {
            'type': EventType.SHOT.value,
            'description': 'First shot',
            'timestamp': datetime.now()
        },
        {
            'type': EventType.FOUL.value,
            'description': 'Foul committed',
            'timestamp': datetime.now()
        }
    ]
    
    for event in events:
        generator.record_event(event)
    
    history = generator.get_event_history()
    assert len(history) == 2
    assert history == events