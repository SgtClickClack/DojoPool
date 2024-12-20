"""AI service module."""

import os
import json
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from functools import wraps
from ratelimit import limits, sleep_and_retry
from openai import OpenAI
from flask import current_app

logger = logging.getLogger(__name__)

# Rate limiting configuration
CALLS_PER_MINUTE = 60
PERIOD = 60  # seconds

@sleep_and_retry
@limits(calls=CALLS_PER_MINUTE, period=PERIOD)
def call_openai_api(client: OpenAI, model: str, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 1000) -> Optional[str]:
    """Call OpenAI API with rate limiting."""
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise

class AIService:
    """AI service for generating stories and game narratives."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize AI service."""
        self.api_key = api_key
        if not self.api_key:
            try:
                self.api_key = current_app.config.get('OPENAI_API_KEY')
            except RuntimeError:
                self.api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4"  # Default model
        self._cache: Dict[str, Any] = {}
    
    def is_configured(self) -> bool:
        """Check if service is properly configured."""
        return bool(self.api_key)
    
    def generate_text(self, prompt: str, temperature: float = 0.7, max_tokens: int = 1000) -> Optional[str]:
        """Generate text using the OpenAI API."""
        messages = [
            {"role": "system", "content": "You are a creative writer specializing in pool and billiards content."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            return call_openai_api(
                self.client,
                self.model,
                messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
        except Exception as e:
            logger.error(f"Text generation error: {e}")
            return None
    
    def generate_chat_response(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> Optional[str]:
        """Generate a chat response."""
        try:
            return call_openai_api(
                self.client,
                self.model,
                messages,
                temperature=temperature
            )
        except Exception as e:
            logger.error(f"Chat response error: {e}")
            return None
    
    def analyze_game_style(self, game_data: Dict[str, Any]) -> Optional[str]:
        """Analyze a player's game style based on their history."""
        prompt = self._build_game_style_prompt(game_data)
        return self.generate_text(prompt, temperature=0.5)
    
    def generate_match_preview(self, match_data: Dict[str, Any]) -> Optional[str]:
        """Generate a preview for an upcoming match."""
        prompt = self._build_match_preview_prompt(match_data)
        return self.generate_text(prompt, temperature=0.8)
    
    def generate_player_profile(self, player_data: Dict[str, Any]) -> Optional[str]:
        """Generate a narrative profile for a player."""
        prompt = self._build_player_profile_prompt(player_data)
        return self.generate_text(prompt, temperature=0.7)
    
    def generate_game_story(self, game_data: Dict[str, Any]) -> Optional[str]:
        """Generate a story about a completed game."""
        prompt = self._build_game_story_prompt(game_data)
        return self.generate_text(prompt, temperature=0.8)
    
    def generate_commentary(self, game_state: Dict[str, Any], previous_commentary: Optional[str] = None) -> Optional[str]:
        """Generate real-time commentary for a game."""
        prompt = self._build_commentary_prompt(game_state, previous_commentary)
        return self.generate_text(prompt, temperature=0.8, max_tokens=200)
    
    def generate_branching_storyline(self, context: str, choices: List[str]) -> Optional[str]:
        """Generate a branching storyline based on player choices."""
        prompt = self._build_branching_story_prompt(context, choices)
        return self.generate_text(prompt, temperature=0.9)
    
    def _build_game_style_prompt(self, game_data: Dict[str, Any]) -> str:
        """Build prompt for game style analysis."""
        return f"""
        Based on the following game data, analyze the player's style:
        {json.dumps(game_data, indent=2)}
        
        Please provide:
        1. Primary playing style
        2. Strengths and weaknesses
        3. Strategic tendencies
        4. Areas for improvement
        """
    
    def _build_match_preview_prompt(self, match_data: Dict[str, Any]) -> str:
        """Build prompt for match preview."""
        return f"""
        Generate an exciting preview for this upcoming match:
        {json.dumps(match_data, indent=2)}
        
        Include:
        1. Player backgrounds and history
        2. Recent form and achievements
        3. Head-to-head record
        4. Key factors that could influence the match
        """
    
    def _build_player_profile_prompt(self, player_data: Dict[str, Any]) -> str:
        """Build prompt for player profile."""
        return f"""
        Create an engaging player profile based on this data:
        {json.dumps(player_data, indent=2)}
        
        Cover:
        1. Playing background and experience
        2. Notable achievements
        3. Playing style and techniques
        4. Personal journey in pool
        """
    
    def _build_game_story_prompt(self, game_data: Dict[str, Any]) -> str:
        """Build prompt for game story."""
        return f"""
        Tell the story of this game:
        {json.dumps(game_data, indent=2)}
        
        Include:
        1. Key moments and turning points
        2. Player strategies and adjustments
        3. Dramatic shots and decisions
        4. Final outcome and implications
        """
    
    def _build_branching_story_prompt(self, context: str, choices: List[str]) -> str:
        """Build prompt for branching storyline."""
        return f"""
        Context:
        {context}
        
        Available choices:
        {json.dumps(choices, indent=2)}
        
        Generate a branching storyline that:
        1. Considers each possible choice
        2. Creates unique consequences
        3. Maintains narrative consistency
        4. Provides engaging outcomes
        """
    
    def _build_commentary_prompt(self, game_state: Dict[str, Any], previous_commentary: Optional[str] = None) -> str:
        """Build prompt for real-time game commentary."""
        context = f"""
        Current game state:
        {json.dumps(game_state, indent=2)}
        """
        
        if previous_commentary:
            context += f"""
            Previous commentary:
            {previous_commentary}
            """
        
        return f"""
        {context}
        
        Provide engaging real-time commentary that:
        1. Describes the current game situation
        2. Analyzes player strategies and decisions
        3. Highlights interesting shots and techniques
        4. Maintains excitement and flow
        5. Builds on previous commentary if available
        """
    
    def _get_player_skill(self, player_data: Dict[str, Any]) -> str:
        """Analyze and rate a player's skill level."""
        try:
            # Calculate skill rating based on various factors
            wins = player_data.get('wins', 0)
            total_games = player_data.get('total_games', 0)
            win_rate = wins / total_games if total_games > 0 else 0
            
            # Consider other factors
            tournament_wins = player_data.get('tournament_wins', 0)
            average_break = player_data.get('average_break', 0)
            years_playing = player_data.get('years_playing', 0)
            
            # Calculate weighted score
            skill_score = (
                win_rate * 0.4 +
                min(tournament_wins / 10, 1) * 0.3 +
                min(average_break / 50, 1) * 0.2 +
                min(years_playing / 10, 1) * 0.1
            )
            
            # Convert to skill level
            if skill_score > 0.8:
                return "Expert"
            elif skill_score > 0.6:
                return "Advanced"
            elif skill_score > 0.4:
                return "Intermediate"
            else:
                return "Beginner"
            
        except Exception as e:
            logger.error(f"Error calculating player skill: {e}")
            return "Unknown"

# Create singleton instance
ai_service = None  # Initialize lazily to avoid import-time errors