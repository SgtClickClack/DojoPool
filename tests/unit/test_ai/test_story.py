"""Unit tests for story generation components."""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from src.ai.story import StoryGenerator
from src.models import Game, Match, User

@pytest.fixture
def story_generator():
    """Create a story generator instance for testing."""
    return StoryGenerator()

@pytest.fixture
def mock_user():
    """Create a mock user for testing."""
    user = Mock(spec=User)
    user.username = "TestPlayer"
    user.rating = 1500
    user.games_as_player1 = []
    user.games_as_player2 = []
    user.win_rate = 0.6
    return user

@pytest.fixture
def mock_game(mock_user):
    """Create a mock game for testing."""
    game = Mock(spec=Game)
    game.id = 1
    game.player1 = mock_user
    game.player2 = mock_user
    game.updated_at = datetime.now()
    return game

@pytest.fixture
def mock_match(mock_user):
    """Create a mock match for testing."""
    match = Mock(spec=Match)
    match.id = 1
    match.player1 = mock_user
    match.player2 = mock_user
    match.updated_at = datetime.now()
    return match

@pytest.mark.asyncio
async def test_get_player_style(story_generator, mock_user):
    """Test player style analysis."""
    with patch('src.ai.service.ai_service.analyze_game_style') as mock_analyze:
        mock_analyze.return_value = {'style': 'aggressive'}
        style = await story_generator._get_player_style(mock_user)
        assert style == 'aggressive'
        mock_analyze.assert_called_once()

@pytest.mark.asyncio
async def test_get_player_skill(story_generator, mock_user):
    """Test player skill determination."""
    # Test different rating levels
    mock_user.rating = 2000
    assert await story_generator._get_player_skill(mock_user) == 'expert'
    
    mock_user.rating = 1500
    assert await story_generator._get_player_skill(mock_user) == 'advanced'
    
    mock_user.rating = 1000
    assert await story_generator._get_player_skill(mock_user) == 'intermediate'
    
    mock_user.rating = 500
    assert await story_generator._get_player_skill(mock_user) == 'beginner'

@pytest.mark.asyncio
async def test_generate_game_story(story_generator, mock_game):
    """Test game story generation."""
    with patch('src.ai.service.ai_service.generate_text') as mock_generate:
        mock_generate.return_value = "An exciting game story"
        story = await story_generator.generate_game_story(mock_game)
        assert story == "An exciting game story"
        mock_generate.assert_called_once()

@pytest.mark.asyncio
async def test_generate_match_preview(story_generator, mock_match):
    """Test match preview generation."""
    with patch('src.ai.service.ai_service.generate_text') as mock_generate:
        mock_generate.return_value = "An exciting preview"
        preview = await story_generator.generate_match_preview(mock_match)
        assert preview == "An exciting preview"
        mock_generate.assert_called_once()

@pytest.mark.asyncio
async def test_generate_player_profile(story_generator, mock_user):
    """Test player profile generation."""
    with patch('src.ai.service.ai_service.generate_text') as mock_generate:
        mock_generate.return_value = "A player profile"
        profile = await story_generator.generate_player_profile(mock_user)
        assert profile == "A player profile"
        mock_generate.assert_called_once()

@pytest.mark.asyncio
async def test_generate_branching_storyline(story_generator, mock_match):
    """Test branching storyline generation."""
    decision_points = [{
        'description': 'Critical shot',
        'options': ['Take the risk', 'Play safe']
    }]
    
    with patch('src.ai.service.ai_service.generate_text') as mock_generate:
        mock_generate.side_effect = [
            "Match preview",
            "Risk outcome",
            "Safe outcome"
        ]
        
        storyline = await story_generator.generate_branching_storyline(mock_match, decision_points)
        
        assert storyline['start'] == "Match preview"
        assert len(storyline['branches']) == 1
        assert len(storyline['branches'][0]['options']) == 2
        assert mock_generate.call_count == 3

@pytest.mark.asyncio
async def test_generate_commentary(story_generator):
    """Test real-time commentary generation."""
    game_state = {
        'score': '2-1',
        'last_shot': 'Corner pocket',
        'remaining_balls': '7',
        'current_player': 'Player1',
        'table_position': 'Good position'
    }
    
    with patch('src.ai.service.ai_service.generate_commentary') as mock_generate:
        mock_generate.return_value = "Exciting commentary"
        commentary = await story_generator.generate_commentary(game_state)
        assert commentary == "Exciting commentary"
        mock_generate.assert_called_once_with(game_state)

@pytest.mark.asyncio
async def test_cache_behavior(story_generator, mock_game, tmp_path):
    """Test caching behavior of generated content."""
    # Set up temporary cache directory
    story_generator.cache_dir = tmp_path
    
    with patch('src.ai.service.ai_service.generate_text') as mock_generate:
        mock_generate.return_value = "Cached story"
        
        # First call should generate and cache
        story1 = await story_generator.generate_game_story(mock_game)
        assert story1 == "Cached story"
        assert mock_generate.call_count == 1
        
        # Second call should use cache
        story2 = await story_generator.generate_game_story(mock_game)
        assert story2 == "Cached story"
        assert mock_generate.call_count == 1  # No additional calls

@pytest.mark.asyncio
async def test_error_handling(story_generator, mock_game):
    """Test error handling in story generation."""
    with patch('src.ai.service.ai_service.generate_text') as mock_generate:
        mock_generate.return_value = None
        
        # Should return fallback text when AI generation fails
        story = await story_generator.generate_game_story(mock_game)
        assert "An exciting game between two skilled players..." in story 