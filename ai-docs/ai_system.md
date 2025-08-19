# AI System Technical Documentation

## Overview

The DojoPool AI system provides story generation, player analysis, and real-time commentary features using OpenAI's GPT models.

## Components

### 1. Prompt Management (`src/ai/prompts.py`)

- `PromptTemplate`: Template class for managing AI prompts with variable substitution
- `PromptManager`: Manages loading and formatting of prompt templates
- Default templates for common scenarios (game stories, match previews, player profiles)

#### Usage Example

```python
from src.ai.prompts import prompt_manager

# Format a game story prompt
prompt = prompt_manager.format_prompt(
    'game_story',
    player1='John',
    player2='Alice',
    skill1='expert',
    skill2='advanced',
    style1='aggressive',
    style2='tactical'
)
```

### 2. Story Generation (`src/ai/story.py`)

- `StoryGenerator`: Core class for generating narratives
- Features:
  - Game story generation
  - Match previews
  - Player profiles
  - Branching storylines
  - Real-time commentary

#### Key Methods

- `generate_game_story(game)`: Creates narrative for completed games
- `generate_match_preview(match)`: Previews upcoming matches
- `generate_player_profile(user)`: Creates player descriptions
- `generate_branching_storyline(match, decision_points)`: Creates interactive narratives
- `generate_commentary(game_state)`: Provides real-time game commentary

### 3. AI Service (`src/ai/service.py`)

- `AIService`: Handles OpenAI API integration
- Features:
  - Text generation
  - Chat completion
  - Game style analysis
  - Error handling
  - Rate limiting

#### Configuration

```python
# Environment variables
OPENAI_API_KEY=your_api_key
AI_MODEL=gpt-3.5-turbo  # or gpt-4 for enhanced capabilities
```

## Caching System

- Story caching to reduce API calls
- Cache invalidation based on game/match updates
- Cache directory structure:
  ```
  src/ai/cache/
  ├── game_stories/
  ├── match_previews/
  ├── player_profiles/
  └── commentary/
  ```

## Testing

- Unit tests in `tests/unit/test_ai/`
- Test coverage for:
  - Prompt management
  - Story generation
  - AI service integration
  - Error handling
  - Cache management

## Performance Considerations

1. API Rate Limiting
   - 10 requests per minute for AI endpoints
   - Batch processing for multiple stories
   - Cache utilization to minimize API calls

2. Response Time Optimization
   - Async processing for non-blocking operations
   - Background job queue for long-running generations
   - Pre-generation of common narratives

3. Error Handling
   - Graceful fallbacks for API failures
   - Retry mechanism for transient errors
   - Default responses when AI is unavailable

## Security

1. API Key Management
   - Keys stored in environment variables
   - Rotating keys for production
   - Access logging and monitoring

2. Content Filtering
   - Input validation before API calls
   - Output sanitization
   - Content moderation for generated text

## Future Improvements

1. Enhanced Features
   - Multi-language support
   - Custom prompt creation UI
   - Advanced player style analysis

2. Technical Enhancements
   - Model fine-tuning for pool-specific content
   - Improved caching strategies
   - Real-time generation optimizations
