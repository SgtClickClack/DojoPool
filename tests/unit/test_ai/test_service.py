"""Test suite for AI service."""
import pytest
from unittest.mock import Mock, patch
from dojopool.ai.service import AIService

@pytest.fixture
def ai_service():
    """Create an AI service instance for testing."""
    return AIService(api_key='test-key')

def test_generate_text(ai_service):
    """Test text generation."""
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.return_value = "Generated text"
        result = ai_service.generate_text("Test prompt")
        assert result == "Generated text"
        mock_api.assert_called_once()

def test_generate_text_error_handling(ai_service):
    """Test error handling in text generation."""
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.side_effect = Exception("API error")
        result = ai_service.generate_text("Test prompt")
        assert result is None

def test_generate_chat_response(ai_service):
    """Test chat response generation."""
    messages = [{"role": "user", "content": "Hello"}]
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.return_value = "Chat response"
        result = ai_service.generate_chat_response(messages)
        assert result == "Chat response"
        mock_api.assert_called_once()

def test_analyze_game_style(ai_service):
    """Test game style analysis."""
    game_data = {"player": "test", "stats": {}}
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.return_value = "Game style analysis"
        result = ai_service.analyze_game_style(game_data)
        assert result == "Game style analysis"

def test_is_configured(ai_service):
    """Test service configuration check."""
    assert ai_service.is_configured() is True
    
    # Test with invalid API key
    with pytest.raises(ValueError):
        AIService(api_key='')
    
    # Test with no API key but with app context
    with pytest.raises(ValueError):
        AIService(api_key=None)

def test_service_without_api_key():
    """Test service initialization without API key."""
    with pytest.raises(ValueError):
        AIService()

def test_rate_limiting_handling(ai_service):
    """Test rate limiting handling."""
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.side_effect = Exception("Rate limit exceeded")
        result = ai_service.generate_text("Test prompt")
        assert result is None

def test_generate_match_preview(ai_service):
    """Test match preview generation."""
    match_data = {"player1": "test1", "player2": "test2"}
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.return_value = "Match preview"
        result = ai_service.generate_match_preview(match_data)
        assert result == "Match preview"

def test_generate_player_profile(ai_service):
    """Test player profile generation."""
    player_data = {"name": "test", "stats": {}}
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.return_value = "Player profile"
        result = ai_service.generate_player_profile(player_data)
        assert result == "Player profile"

def test_generate_game_story(ai_service):
    """Test game story generation."""
    game_data = {"winner": "test", "score": "5-3"}
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.return_value = "Game story"
        result = ai_service.generate_game_story(game_data)
        assert result == "Game story"

def test_generate_commentary(ai_service):
    """Test commentary generation."""
    game_state = {"current_frame": 1, "score": "0-0"}
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.return_value = "Commentary"
        result = ai_service.generate_commentary(game_state)
        assert result == "Commentary"

def test_generate_branching_storyline(ai_service):
    """Test branching storyline generation."""
    context = "Game situation"
    choices = ["choice1", "choice2"]
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.return_value = "Branching story"
        result = ai_service.generate_branching_storyline(context, choices)
        assert result == "Branching story"

def test_get_player_skill(ai_service):
    """Test player skill calculation."""
    player_data = {
        "wins": 80,
        "total_games": 100,
        "tournament_wins": 5,
        "average_break": 40,
        "years_playing": 5
    }
    result = ai_service._get_player_skill(player_data)
    assert result in ["Expert", "Advanced", "Intermediate", "Beginner"]

def test_cache_behavior(ai_service):
    """Test caching behavior."""
    prompt = "Test prompt"
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.return_value = "Cached response"
        # First call
        result1 = ai_service.generate_text(prompt)
        # Second call with same prompt
        result2 = ai_service.generate_text(prompt)
        assert result1 == result2
        assert mock_api.call_count == 2  # No caching implemented yet

def test_error_handling(ai_service):
    """Test general error handling."""
    with patch('dojopool.ai.service.call_openai_api') as mock_api:
        mock_api.side_effect = Exception("Test error")
        result = ai_service.generate_text("Test prompt")
        assert result is None