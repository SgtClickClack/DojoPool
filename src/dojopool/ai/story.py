"""Story generation module."""

import logging
from typing import Any, Dict

from . import get_ai_service
from .prompts import STORY_PROMPTS

logger = logging.getLogger(__name__)


class StoryGenerator:
    """Story generator for pool games."""

    def __init__(self):
        """Initialize story generator."""
        self.api_service = None

    def _ensure_api_service(self):
        """Ensure API service is initialized."""
        if self.api_service is None:
            self.api_service = get_ai_service()
            if self.api_service is None:
                raise RuntimeError("AI service not initialized")

    def generate_game_story(
        self, game_data: Dict[str, Any], style: str = "dramatic"
    ) -> str:
        """Generate a story for a game.

        Args:
            game_data (Dict[str, Any]): Game data including players, shots, score, etc.
            style (str): Story style (dramatic, technical, casual)

        Returns:
            str: Generated story
        """
        try:
            self._ensure_api_service()

            # Build context from game data
            context = self._build_game_context(game_data)

            # Get style-specific prompt
            prompt = STORY_PROMPTS.get(style, STORY_PROMPTS["dramatic"])

            # Generate story
            story = self.api_service.generate_text(
                prompt=prompt.format(**context), temperature=0.8
            )

            return story or "Unable to generate story at this time."

        except Exception as e:
            logger.error(f"Story generation error: {e}")
            return "Unable to generate story at this time."

    def generate_match_story(
        self, match_data: Dict[str, Any], style: str = "dramatic"
    ) -> str:
        """Generate a story for a match.

        Args:
            match_data (Dict[str, Any]): Match data including games, players, venue, etc.
            style (str): Story style (dramatic, technical, casual)

        Returns:
            str: Generated story
        """
        try:
            self._ensure_api_service()

            # Build context from match data
            context = self._build_match_context(match_data)

            # Get style-specific prompt
            prompt = STORY_PROMPTS.get(
                f"match_{style}", STORY_PROMPTS["match_dramatic"]
            )

            # Generate story
            story = self.api_service.generate_text(
                prompt=prompt.format(**context), temperature=0.8
            )

            return story or "Unable to generate match story at this time."

        except Exception as e:
            logger.error(f"Match story generation error: {e}")
            return "Unable to generate match story at this time."

    def generate_tournament_story(
        self, tournament_data: Dict[str, Any], style: str = "dramatic"
    ) -> str:
        """Generate a story for a tournament.

        Args:
            tournament_data (Dict[str, Any]): Tournament data including matches, players, etc.
            style (str): Story style (dramatic, technical, casual)

        Returns:
            str: Generated story
        """
        try:
            self._ensure_api_service()

            # Build context from tournament data
            context = self._build_tournament_context(tournament_data)

            # Get style-specific prompt
            prompt = STORY_PROMPTS.get(
                f"tournament_{style}", STORY_PROMPTS["tournament_dramatic"]
            )

            # Generate story
            story = self.api_service.generate_text(
                prompt=prompt.format(**context), temperature=0.8
            )

            return story or "Unable to generate tournament story at this time."

        except Exception as e:
            logger.error(f"Tournament story generation error: {e}")
            return "Unable to generate tournament story at this time."

    def _build_game_context(self, game_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build context for game story generation."""
        return {
            "player1": game_data.get("player1", {}).get("username", "Player 1"),
            "player2": game_data.get("player2", {}).get("username", "Player 2"),
            "score": f"{game_data.get('score1', 0)} - {game_data.get('score2', 0)}",
            "game_type": game_data.get("game_type", "8-ball"),
            "venue": game_data.get("venue", {}).get("name", "the pool hall"),
            "shots": game_data.get("shots", []),
            "winner": game_data.get("winner", {}).get("username", "the winner"),
            "duration": game_data.get("duration", ""),
            "highlights": game_data.get("highlights", []),
        }

    def _build_match_context(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build context for match story generation."""
        return {
            "player1": match_data.get("player1", {}).get("username", "Player 1"),
            "player2": match_data.get("player2", {}).get("username", "Player 2"),
            "match_score": f"{match_data.get('score1', 0)} - {match_data.get('score2', 0)}",
            "match_type": match_data.get("match_type", "race to 5"),
            "venue": match_data.get("venue", {}).get("name", "the pool hall"),
            "games": match_data.get("games", []),
            "winner": match_data.get("winner", {}).get("username", "the winner"),
            "duration": match_data.get("duration", ""),
            "highlights": match_data.get("highlights", []),
        }

    def _build_tournament_context(
        self, tournament_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build context for tournament story generation."""
        return {
            "name": tournament_data.get("name", "the tournament"),
            "venue": tournament_data.get("venue", {}).get("name", "the pool hall"),
            "players": [
                p.get("username", f"Player {i+1}")
                for i, p in enumerate(tournament_data.get("players", []))
            ],
            "matches": tournament_data.get("matches", []),
            "winner": tournament_data.get("winner", {}).get("username", "the winner"),
            "prize_pool": tournament_data.get("prize_pool", ""),
            "duration": tournament_data.get("duration", ""),
            "highlights": tournament_data.get("highlights", []),
        }


# Create singleton instance
story_generator = None  # Initialize lazily to avoid import-time errors
