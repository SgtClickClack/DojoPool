#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for the Dynamic Prompt Engineering System

This script tests the basic functionality of the prompt engineering system
to ensure it works correctly.
"""

import logging
import sys
from pathlib import Path

# Add parent directory to path to allow imports
parent_dir = str(Path(__file__).resolve().parent.parent.parent.parent)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from dojopool.ai.wan.prompt_engineer import (
    PromptCategory,
    PromptComplexity,
    PromptConfig,
    PromptEngineer,
    PromptStyle,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def test_prompt_engineer():
    """Test the basic functionality of the prompt engineering system."""
    logger.info("Testing Dynamic Prompt Engineering System")

    # Create a prompt configuration
    config = PromptConfig(
        style=PromptStyle.KUNG_FU,
        complexity=PromptComplexity.STANDARD,
        max_length=1000,
        include_camera_directions=True,
        include_style_reference=True,
        optimize_for_low_vram=False,
        cache_generated_prompts=True
    )

    # Create the prompt engineer
    prompt_engineer = PromptEngineer(
        config=config,
        templates_dir="./templates"
    )

    # Test 1: Generate a match highlight prompt
    logger.info("Test 1: Generate a match highlight prompt")
    match_params = {
        "player1": "Alex",
        "player2": "Jordan",
        "venue_name": "Dragon's Den Pool Hall",
        "key_moment": "A behind-the-back shot that pocketed the 8-ball",
        "game_type": "8-ball",
        "additional_details": "The crowd erupted in cheers after the shot"
    }

    match_prompt = prompt_engineer.generate_prompt(
        category=PromptCategory.MATCH_HIGHLIGHT,
        params=match_params,
        style=PromptStyle.KUNG_FU,
        complexity=PromptComplexity.STANDARD
    )

    logger.info(f"Generated match highlight prompt:\n{match_prompt}\n")
    assert match_prompt is not None, "Failed to generate match highlight prompt"
    assert "Alex" in match_prompt, "Player name not found in prompt"
    assert "Jordan" in match_prompt, "Player name not found in prompt"
    assert "Dragon's Den Pool Hall" in match_prompt, "Venue name not found in prompt"

    # Test 2: Generate a tournament announcement prompt
    logger.info("Test 2: Generate a tournament announcement prompt")
    tournament_params = {
        "tournament_name": "Summer Showdown 2025",
        "tournament_date": "July 15-17, 2025",
        "tournament_location": "The Golden Cue, Downtown Metropolis",
        "prize_pool": "$5,000",
        "entry_fee": "$75",
        "special_instructions": "Include testimonials from last year's winners"
    }

    tournament_prompt = prompt_engineer.generate_prompt(
        category=PromptCategory.TOURNAMENT_ANNOUNCEMENT,
        params=tournament_params,
        style=PromptStyle.DRAMATIC,
        complexity=PromptComplexity.STANDARD
    )

    logger.info(f"Generated tournament announcement prompt:\n{tournament_prompt}\n")
    assert tournament_prompt is not None, "Failed to generate tournament announcement prompt"
    assert "Summer Showdown 2025" in tournament_prompt, "Tournament name not found in prompt"
    assert "$5,000" in tournament_prompt, "Prize pool not found in prompt"

    # Test 3: Test prompt caching
    logger.info("Test 3: Test prompt caching")

    # Generate the same prompt again (should use cache)
    cached_prompt = prompt_engineer.generate_prompt(
        category=PromptCategory.MATCH_HIGHLIGHT,
        params=match_params,
        style=PromptStyle.KUNG_FU,
        complexity=PromptComplexity.STANDARD
    )

    logger.info("Generated the same match highlight prompt again (should use cache)")
    assert cached_prompt == match_prompt, "Cached prompt does not match original prompt"

    # Clear the cache
    prompt_engineer.clear_cache()
    logger.info("Cleared the prompt cache")

    logger.info("All tests passed successfully!")


if __name__ == "__main__":
    test_prompt_engineer()
