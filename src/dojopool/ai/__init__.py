"""AI module for game analysis and story generation."""

from typing import Any, Dict, List, Optional, Union

# Create singleton instances
_instance = None  # AIService instance


def init_ai_service(api_key: Optional[str] = None):
    """Initialize the AI service with the given API key."""
    global _instance
    if _instance is None:
        from .service import AIService

        _instance = AIService(api_key=api_key)
    return _instance


def get_ai_service():
    """Get the current AI service instance."""
    return _instance


# Import and create instances
from .difficulty import AdaptiveDifficulty

adaptive_difficulty = AdaptiveDifficulty()

from .story import StoryGenerator

story_generator = StoryGenerator()

from .analysis import MatchAnalyzer

match_analyzer = MatchAnalyzer()

__all__ = [
    "MatchAnalyzer",
    "AdaptiveDifficulty",
    "match_analyzer",
    "adaptive_difficulty",
    "story_generator",
    "init_ai_service",
    "get_ai_service",
]
