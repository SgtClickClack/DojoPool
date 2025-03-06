#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Dynamic Prompt Engineering System for Wan 2.1 Integration

This module provides a sophisticated prompt engineering system that dynamically
generates, optimizes, and adapts prompts for Wan 2.1 video generation based on
context, user preferences, and hardware capabilities.
"""

import json
import logging
import os
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional

try:
    from ..low_vram_optimizer import LowVRAMOptimizer
    from ..video_cache_manager import VideoCacheManager
except ImportError:
    # For standalone usage or testing
    LowVRAMOptimizer = None
    VideoCacheManager = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class PromptStyle(Enum):
    """Styles for prompt generation."""
    CINEMATIC = "cinematic"
    ANIME = "anime"
    KUNG_FU = "kung_fu"
    EDUCATIONAL = "educational"
    TECHNICAL = "technical"
    DRAMATIC = "dramatic"
    CASUAL = "casual"


class PromptComplexity(Enum):
    """Complexity levels for generated prompts."""
    SIMPLE = "simple"  # Basic prompts for low-VRAM systems
    STANDARD = "standard"  # Standard complexity for most systems
    DETAILED = "detailed"  # Detailed prompts for high-end systems
    ADVANCED = "advanced"  # Advanced prompts with multiple elements


class PromptCategory(Enum):
    """Categories of prompts for different use cases."""
    MATCH_HIGHLIGHT = "match_highlight"
    RULE_VISUALIZATION = "rule_visualization"
    VENUE_NARRATIVE = "venue_narrative"
    PLAYER_ACHIEVEMENT = "player_achievement"
    TOURNAMENT_ANNOUNCEMENT = "tournament_announcement"
    EDUCATIONAL_CONTENT = "educational_content"


@dataclass
class PromptTemplate:
    """Template for generating prompts with variable substitution."""
    template: str
    category: PromptCategory
    style: PromptStyle
    complexity: PromptComplexity
    default_params: Dict[str, Any] = field(default_factory=dict)
    vram_requirement_mb: int = 2048  # Minimum VRAM required for this template

    def format(self, params: Dict[str, Any]) -> str:
        """
        Format the template with the provided parameters.
        
        Args:
            params: Parameters to substitute in the template
            
        Returns:
            Formatted prompt string
        """
        # Combine default params with provided params
        combined_params = {**self.default_params, **params}

        # Format the template
        return self.template.format(**combined_params)


@dataclass
class PromptConfig:
    """Configuration for prompt generation."""
    style: PromptStyle = PromptStyle.KUNG_FU
    complexity: PromptComplexity = PromptComplexity.STANDARD
    max_length: int = 1000
    include_camera_directions: bool = True
    include_style_reference: bool = True
    optimize_for_low_vram: bool = False
    cache_generated_prompts: bool = True


class PromptEngineer:
    """
    Dynamic prompt engineering system for Wan 2.1 integration.
    
    This class provides functionality to generate, optimize, and adapt prompts
    for Wan 2.1 video generation based on context, user preferences, and
    hardware capabilities.
    """

    def __init__(
        self,
        config: Optional[PromptConfig] = None,
        low_vram_optimizer = None,
        cache_manager = None,
        templates_dir: Optional[str] = None
    ):
        """
        Initialize the prompt engineer.
        
        Args:
            config: Configuration for prompt generation
            low_vram_optimizer: Optimizer for low-VRAM environments
            cache_manager: Cache manager for prompt caching
            templates_dir: Directory containing custom prompt templates
        """
        self.config = config or PromptConfig()
        self.low_vram_optimizer = low_vram_optimizer
        self.cache_manager = cache_manager
        self.templates_dir = templates_dir or os.path.join(
            os.path.dirname(__file__), "templates"
        )

        # Load built-in templates
        self.templates = self._load_default_templates()

        # Load custom templates if available
        if os.path.exists(self.templates_dir):
            self._load_custom_templates()

        logger.info(f"Initialized PromptEngineer with {len(self.templates)} templates")

        # Initialize cache for generated prompts
        self.prompt_cache = {}

    def _load_default_templates(self) -> Dict[str, PromptTemplate]:
        """
        Load the default built-in templates.
        
        Returns:
            Dictionary of template name to PromptTemplate
        """
        templates = {}

        # Match highlight templates
        templates["match_highlight_kung_fu"] = PromptTemplate(
            template="""
Create a kung fu anime-style video showing a pool match highlight with the following details:

Players: {player1} vs {player2}
Location: {venue_name}
Key Moment: {key_moment}
Game Type: {game_type}
Style: Dramatic kung fu anime with dynamic camera movements

The scene should include:
- Intense close-ups of the players as they prepare their shots
- Dramatic lighting effects when the cue strikes the ball
- Slow-motion sequences for the critical shots
- Martial arts-inspired visual effects for powerful shots
- {additional_details}
            """.strip(),
            category=PromptCategory.MATCH_HIGHLIGHT,
            style=PromptStyle.KUNG_FU,
            complexity=PromptComplexity.STANDARD,
            default_params={
                "player1": "Player 1",
                "player2": "Player 2",
                "venue_name": "Dojo Pool Hall",
                "key_moment": "A critical shot that determined the outcome",
                "game_type": "8-ball",
                "additional_details": ""
            },
            vram_requirement_mb=2048
        )

        # Rule visualization templates
        templates["rule_visualization_educational"] = PromptTemplate(
            template="""
Create an educational video explaining the following pool rule:

Rule: {rule_name}
Description: {rule_description}
Difficulty: {difficulty_level}

The video should:
- Use clear, well-lit scenes
- Include visual annotations and text overlays
- Demonstrate both correct and incorrect applications of the rule
- Use a step-by-step approach to explain the concept
- {additional_instructions}
            """.strip(),
            category=PromptCategory.RULE_VISUALIZATION,
            style=PromptStyle.EDUCATIONAL,
            complexity=PromptComplexity.STANDARD,
            default_params={
                "rule_name": "Basic Rule",
                "rule_description": "A fundamental rule of pool",
                "difficulty_level": "beginner",
                "additional_instructions": ""
            },
            vram_requirement_mb=1536
        )

        # Venue narrative templates
        templates["venue_narrative_cinematic"] = PromptTemplate(
            template="""
Create a cinematic introduction video for the following pool venue:

Venue: {venue_name}
Location: {venue_location}
Atmosphere: {venue_atmosphere}
Special Features: {venue_features}

The video should:
- Begin with an establishing shot of the venue exterior
- Transition to interior shots highlighting the unique atmosphere
- Show the pool tables with dramatic lighting
- Include shots of players engaged in games
- Emphasize the venue's special features
- {custom_elements}
            """.strip(),
            category=PromptCategory.VENUE_NARRATIVE,
            style=PromptStyle.CINEMATIC,
            complexity=PromptComplexity.DETAILED,
            default_params={
                "venue_name": "Dojo Pool Hall",
                "venue_location": "Downtown",
                "venue_atmosphere": "Energetic and competitive",
                "venue_features": "Professional tables and equipment",
                "custom_elements": ""
            },
            vram_requirement_mb=3072
        )

        # Add more default templates here...

        return templates

    def _load_custom_templates(self) -> None:
        """Load custom templates from the templates directory."""
        try:
            for filename in os.listdir(self.templates_dir):
                if filename.endswith(".json"):
                    file_path = os.path.join(self.templates_dir, filename)
                    with open(file_path, "r") as f:
                        template_data = json.load(f)

                        # Create template from JSON data
                        template = PromptTemplate(
                            template=template_data["template"],
                            category=PromptCategory(template_data["category"]),
                            style=PromptStyle(template_data["style"]),
                            complexity=PromptComplexity(template_data["complexity"]),
                            default_params=template_data.get("default_params", {}),
                            vram_requirement_mb=template_data.get("vram_requirement_mb", 2048)
                        )

                        # Add to templates dictionary
                        template_name = os.path.splitext(filename)[0]
                        self.templates[template_name] = template
                        logger.debug(f"Loaded custom template: {template_name}")
        except Exception as e:
            logger.error(f"Error loading custom templates: {str(e)}")

    def generate_prompt(
        self,
        category: PromptCategory,
        params: Dict[str, Any],
        style: Optional[PromptStyle] = None,
        complexity: Optional[PromptComplexity] = None
    ) -> str:
        """
        Generate a prompt for the specified category and parameters.
        
        Args:
            category: Category of prompt to generate
            params: Parameters for the prompt
            style: Style override (uses config default if not specified)
            complexity: Complexity override (uses config default if not specified)
            
        Returns:
            Generated prompt string
        """
        # Use provided style/complexity or fall back to config defaults
        style = style or self.config.style
        complexity = complexity or self.config.complexity

        # Check if we need to adapt for low VRAM
        if self.config.optimize_for_low_vram and self.low_vram_optimizer:
            vram_stats = self.low_vram_optimizer.get_vram_stats()
            if vram_stats.free_vram_mb < 2048:  # Less than 2GB free
                logger.info("Low VRAM detected, reducing prompt complexity")
                complexity = PromptComplexity.SIMPLE

        # Generate cache key
        cache_key = self._generate_cache_key(category, style, complexity, params)

        # Check cache if enabled
        if self.config.cache_generated_prompts and cache_key in self.prompt_cache:
            logger.debug(f"Using cached prompt for key: {cache_key}")
            return self.prompt_cache[cache_key]

        # Find appropriate template
        template = self._select_template(category, style, complexity)

        if not template:
            logger.warning(f"No template found for {category.value}, {style.value}, {complexity.value}")
            # Fall back to a simpler template if available
            template = self._select_template(category, style, PromptComplexity.SIMPLE)

            if not template:
                raise ValueError(f"No template available for {category.value}")

        # Format the template with parameters
        prompt = template.format(params)

        # Apply post-processing
        prompt = self._post_process_prompt(prompt)

        # Cache the result if caching is enabled
        if self.config.cache_generated_prompts:
            self.prompt_cache[cache_key] = prompt

        return prompt

    def _select_template(
        self,
        category: PromptCategory,
        style: PromptStyle,
        complexity: PromptComplexity
    ) -> Optional[PromptTemplate]:
        """
        Select the most appropriate template based on category, style, and complexity.
        
        Args:
            category: Prompt category
            style: Prompt style
            complexity: Prompt complexity
            
        Returns:
            Selected template or None if no matching template is found
        """
        # Try to find an exact match
        for template_name, template in self.templates.items():
            if (template.category == category and
                template.style == style and
                template.complexity == complexity):
                return template

        # If no exact match, try to find a template with matching category and style
        for template_name, template in self.templates.items():
            if template.category == category and template.style == style:
                return template

        # If still no match, try to find a template with matching category
        for template_name, template in self.templates.items():
            if template.category == category:
                return template

        return None

    def _post_process_prompt(self, prompt: str) -> str:
        """
        Apply post-processing to the generated prompt.
        
        Args:
            prompt: Raw generated prompt
            
        Returns:
            Post-processed prompt
        """
        # Ensure the prompt doesn't exceed the maximum length
        if len(prompt) > self.config.max_length:
            prompt = prompt[:self.config.max_length]

        # Add style reference if configured
        if self.config.include_style_reference:
            prompt += f"\n\nStyle: {self.config.style.value}"

        # Add camera directions if configured
        if self.config.include_camera_directions:
            prompt += "\n\nCamera: Dynamic with smooth transitions between shots"

        return prompt

    def _generate_cache_key(
        self,
        category: PromptCategory,
        style: PromptStyle,
        complexity: PromptComplexity,
        params: Dict[str, Any]
    ) -> str:
        """
        Generate a cache key for the prompt parameters.
        
        Args:
            category: Prompt category
            style: Prompt style
            complexity: Prompt complexity
            params: Prompt parameters
            
        Returns:
            Cache key string
        """
        # Create a sorted, stable representation of the parameters
        param_str = json.dumps(params, sort_keys=True)

        return f"{category.value}_{style.value}_{complexity.value}_{hash(param_str)}"

    def adapt_prompt_for_hardware(
        self,
        prompt: str,
        available_vram_mb: Optional[int] = None
    ) -> str:
        """
        Adapt a prompt for the available hardware resources.
        
        Args:
            prompt: Original prompt
            available_vram_mb: Available VRAM in MB (auto-detected if not provided)
            
        Returns:
            Adapted prompt
        """
        if not self.low_vram_optimizer:
            return prompt

        # Get available VRAM if not provided
        if available_vram_mb is None:
            vram_stats = self.low_vram_optimizer.get_vram_stats()
            available_vram_mb = vram_stats.free_vram_mb

        # Adapt based on available VRAM
        if available_vram_mb < 1024:  # Less than 1GB
            logger.info("Very low VRAM detected, simplifying prompt significantly")
            # Remove camera directions and detailed instructions
            prompt = re.sub(r"Camera:.*?\n", "", prompt)
            prompt = re.sub(r"The (scene|video) should include:.*?(?=\n\n|\Z)", "", prompt, flags=re.DOTALL)

        elif available_vram_mb < 2048:  # Less than 2GB
            logger.info("Low VRAM detected, simplifying prompt")
            # Simplify but keep core elements
            prompt = re.sub(r"- .*?\n", "", prompt)  # Remove bullet points

        elif available_vram_mb < 4096:  # Less than 4GB
            logger.info("Medium VRAM detected, making minor adjustments")
            # Keep most elements but reduce detail level
            prompt = re.sub(r"with .*?(?=\n)", "", prompt)  # Remove detailed qualifiers

        return prompt

    def save_template(self, template: PromptTemplate, name: str) -> None:
        """
        Save a custom template to the templates directory.
        
        Args:
            template: Template to save
            name: Name for the template file
        """
        # Ensure templates directory exists
        os.makedirs(self.templates_dir, exist_ok=True)

        # Create template data
        template_data = {
            "template": template.template,
            "category": template.category.value,
            "style": template.style.value,
            "complexity": template.complexity.value,
            "default_params": template.default_params,
            "vram_requirement_mb": template.vram_requirement_mb
        }

        # Save to file
        file_path = os.path.join(self.templates_dir, f"{name}.json")
        with open(file_path, "w") as f:
            json.dump(template_data, f, indent=2)

        # Add to templates dictionary
        self.templates[name] = template
        logger.info(f"Saved template: {name}")

    def clear_cache(self) -> None:
        """Clear the prompt cache."""
        self.prompt_cache = {}
        logger.debug("Cleared prompt cache")
