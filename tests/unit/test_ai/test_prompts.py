"""Test prompts module."""

import pytest
from dojopool.ai.prompts import STORY_PROMPTS

def test_story_prompts_exist():
    """Test that story prompts exist."""
    assert STORY_PROMPTS is not None
    assert isinstance(STORY_PROMPTS, dict)

def test_story_prompts_have_required_styles():
    """Test that story prompts have required styles."""
    required_styles = [
        'dramatic',
        'technical',
        'casual',
        'match_dramatic',
        'match_technical',
        'match_casual',
        'tournament_dramatic',
        'tournament_technical',
        'tournament_casual'
    ]
    
    for style in required_styles:
        assert style in STORY_PROMPTS
        assert isinstance(STORY_PROMPTS[style], str)

def test_story_prompts_format():
    """Test that story prompts can be formatted."""
    test_data = {
        'player1': 'John',
        'player2': 'Jane',
        'venue': 'Pool Hall',
        'score': '5-3',
        'game_type': '8-ball',
        'winner': 'John',
        'duration': '45 minutes',
        'highlights': ['amazing shot', 'great safety']
    }
    
    # Test dramatic style
    formatted = STORY_PROMPTS['dramatic'].format(**test_data)
    assert 'John' in formatted
    assert 'Jane' in formatted
    assert 'Pool Hall' in formatted
    assert '5-3' in formatted
    assert '8-ball' in formatted
    assert '45 minutes' in formatted

def test_match_prompts_format():
    """Test that match prompts can be formatted."""
    test_data = {
        'player1': 'John',
        'player2': 'Jane',
        'venue': 'Pool Hall',
        'match_score': '3-2',
        'match_type': 'race to 5',
        'winner': 'John',
        'duration': '2 hours',
        'highlights': ['amazing shot', 'great safety']
    }
    
    # Test match dramatic style
    formatted = STORY_PROMPTS['match_dramatic'].format(**test_data)
    assert 'John' in formatted
    assert 'Jane' in formatted
    assert 'Pool Hall' in formatted
    assert '3-2' in formatted
    assert 'race to 5' in formatted
    assert '2 hours' in formatted

def test_tournament_prompts_format():
    """Test that tournament prompts can be formatted."""
    test_data = {
        'name': 'City Championship',
        'venue': 'Pool Hall',
        'prize_pool': '$1000',
        'winner': 'John',
        'duration': '3 days',
        'highlights': ['amazing shot', 'great safety']
    }
    
    # Test tournament dramatic style
    formatted = STORY_PROMPTS['tournament_dramatic'].format(**test_data)
    assert 'City Championship' in formatted
    assert 'Pool Hall' in formatted
    assert '$1000' in formatted
    assert 'John' in formatted
    assert '3 days' in formatted