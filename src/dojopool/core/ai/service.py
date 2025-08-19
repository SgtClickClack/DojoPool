"""AI service for text generation and analysis."""

from typing import Optional

import openai

from ..config import Config


class AIService:
    """Service for AI-powered text generation and analysis."""

    def __init__(self, config: Optional[Config] = None):
        """Initialize the AI service."""
        self.config = config
        if config and config.openai_api_key:
            openai.api_key = config.openai_api_key

    async def generate_text(self, prompt: str) -> Optional[str]:
        """
        Generate text using OpenAI's GPT model.

        Args:
            prompt: The prompt to generate text from

        Returns:
            Generated text or None if generation fails
        """
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a pool game analysis expert."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=500,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating text: {str(e)}")
            return None
