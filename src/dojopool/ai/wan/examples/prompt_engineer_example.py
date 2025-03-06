#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Dynamic Prompt Engineering System Example

This script demonstrates how to use the prompt engineering system to generate
optimized prompts for Wan 2.1 video generation with different styles, complexities,
and hardware capabilities.
"""

import logging
import sys
from pathlib import Path

# Add parent directory to path to allow imports
parent_dir = str(Path(__file__).resolve().parent.parent.parent.parent)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from dojopool.ai.wan.low_vram_optimizer import LowVRAMOptimizer
from dojopool.ai.wan.prompt_engineer import (
    PromptCategory,
    PromptComplexity,
    PromptConfig,
    PromptEngineer,
    PromptStyle,
    PromptTemplate,
)
from dojopool.ai.wan.video_cache_manager import VideoCacheManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def main():
    """Run the prompt engineering example."""
    logger.info("Starting Dynamic Prompt Engineering Example")

    # Create a low-VRAM optimizer
    optimizer = LowVRAMOptimizer(
        max_vram_usage_mb=2048,  # 2GB max VRAM usage
        batch_size=1,
        precision="fp16",
        enable_vram_monitoring=True
    )

    # Create a video cache manager
    cache_manager = VideoCacheManager(
        cache_dir="./cache/prompts",
        max_cache_size_gb=0.1  # 100MB
    )

    # Create a prompt configuration
    config = PromptConfig(
        style=PromptStyle.KUNG_FU,
        complexity=PromptComplexity.STANDARD,
        max_length=1000,
        include_camera_directions=True,
        include_style_reference=True,
        optimize_for_low_vram=True,
        cache_generated_prompts=True
    )

    # Create the prompt engineer
    prompt_engineer = PromptEngineer(
        config=config,
        low_vram_optimizer=optimizer,
        cache_manager=cache_manager,
        templates_dir="./templates"
    )

    # Example 1: Generate a match highlight prompt
    logger.info("Example 1: Generate a match highlight prompt")
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

    # Example 2: Generate a rule visualization prompt
    logger.info("Example 2: Generate a rule visualization prompt")
    rule_params = {
        "rule_name": "The Three-Foul Rule",
        "rule_description": "If a player commits three consecutive fouls, they lose the game",
        "difficulty_level": "intermediate",
        "additional_instructions": "Show examples of common fouls and how to track them"
    }

    rule_prompt = prompt_engineer.generate_prompt(
        category=PromptCategory.RULE_VISUALIZATION,
        params=rule_params,
        style=PromptStyle.EDUCATIONAL,
        complexity=PromptComplexity.DETAILED
    )

    logger.info(f"Generated rule visualization prompt:\n{rule_prompt}\n")

    # Example 3: Adapt a prompt for low-VRAM hardware
    logger.info("Example 3: Adapt a prompt for low-VRAM hardware")

    # First, generate a detailed prompt
    venue_params = {
        "venue_name": "The Golden Cue",
        "venue_location": "Downtown Metropolis",
        "venue_atmosphere": "Upscale and sophisticated with traditional decor",
        "venue_features": "Championship tables, premium equipment, and private rooms",
        "custom_elements": "Include shots of the venue's famous wall of champions"
    }

    detailed_prompt = prompt_engineer.generate_prompt(
        category=PromptCategory.VENUE_NARRATIVE,
        params=venue_params,
        style=PromptStyle.CINEMATIC,
        complexity=PromptComplexity.DETAILED
    )

    logger.info(f"Original detailed prompt ({len(detailed_prompt)} chars):\n{detailed_prompt}\n")

    # Now adapt it for low-VRAM hardware
    adapted_prompt = prompt_engineer.adapt_prompt_for_hardware(
        prompt=detailed_prompt,
        available_vram_mb=1024  # Simulate a 1GB VRAM environment
    )

    logger.info(f"Adapted prompt for low VRAM ({len(adapted_prompt)} chars):\n{adapted_prompt}\n")

    # Example 4: Create and save a custom template
    logger.info("Example 4: Create and save a custom template")

    custom_template = PromptTemplate(
        template="""
Create a tournament announcement video for the following pool tournament:

Tournament: {tournament_name}
Date: {tournament_date}
Location: {tournament_location}
Prize Pool: {prize_pool}
Entry Fee: {entry_fee}

The video should:
- Begin with an exciting tournament logo reveal
- Show highlights from previous tournaments
- Feature the venue where it will be held
- Include text overlays with key information
- End with registration details
- {special_instructions}
        """.strip(),
        category=PromptCategory.TOURNAMENT_ANNOUNCEMENT,
        style=PromptStyle.DRAMATIC,
        complexity=PromptComplexity.STANDARD,
        default_params={
            "tournament_name": "Championship Series",
            "tournament_date": "Next Weekend",
            "tournament_location": "Main Street Pool Hall",
            "prize_pool": "$1,000",
            "entry_fee": "$50",
            "special_instructions": ""
        },
        vram_requirement_mb=2048
    )

    prompt_engineer.save_template(custom_template, "tournament_announcement_dramatic")

    # Use the custom template
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

    # Example 5: Demonstrate caching
    logger.info("Example 5: Demonstrate prompt caching")

    # Generate the same prompt again (should use cache)
    cached_prompt = prompt_engineer.generate_prompt(
        category=PromptCategory.MATCH_HIGHLIGHT,
        params=match_params,
        style=PromptStyle.KUNG_FU,
        complexity=PromptComplexity.STANDARD
    )

    logger.info("Generated the same match highlight prompt again (should use cache)")

    # Clear the cache
    prompt_engineer.clear_cache()
    logger.info("Cleared the prompt cache")

    logger.info("Dynamic Prompt Engineering Example completed successfully")


if __name__ == "__main__":
    main()
