"""Configuration management for the application."""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Config:
    """Application configuration."""

    openai_api_key: Optional[str] = None

    @classmethod
    def from_env(cls) -> "Config":
        """Create config from environment variables."""
        return cls(openai_api_key=os.getenv("OPENAI_API_KEY"))
