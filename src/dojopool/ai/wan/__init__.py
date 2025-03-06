"""
Wan 2.1 Integration Package for DojoPool

This package provides integration with Wan 2.1 text-to-video generation capabilities
for creating match highlights, rule visualizations, and venue narratives.
"""

# Import modules that exist
try:
    from .highlight_generator import HighlightRequest, HighlightResponse, MatchHighlightGenerator
except ImportError:
    # These will be implemented later
    pass

try:
    from .rule_visualizer import RuleVisualizationRequest, RuleVisualizationResponse, RuleVisualizer
except ImportError:
    # These will be implemented later
    pass

try:
    from .video_manager import VideoManager, VideoMetadata
except ImportError:
    # These will be implemented later
    pass

try:
    from .prompt_engineer import (
        PromptCategory,
        PromptComplexity,
        PromptConfig,
        PromptEngineer,
        PromptStyle,
        PromptTemplate,
    )
except ImportError:
    # These will be implemented later
    pass

# Define what should be available when importing from this package
__all__ = [
    'MatchHighlightGenerator',
    'HighlightRequest',
    'HighlightResponse',
    'RuleVisualizer',
    'RuleVisualizationRequest',
    'RuleVisualizationResponse',
    'VideoManager',
    'VideoMetadata',
    'PromptEngineer',
    'PromptTemplate',
    'PromptConfig',
    'PromptStyle',
    'PromptComplexity',
    'PromptCategory'
]
