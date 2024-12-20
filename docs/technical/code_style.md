# DojoPool Code Style Guide

## General Guidelines

### 1. File Organization
- One class per file (with related helper classes/functions)
- Group related files in appropriate modules
- Use clear, descriptive filenames in snake_case
- Follow the established directory structure:
  ```
  src/
  ├── api/          # API endpoints and handlers
  ├── auth/         # Authentication related code
  ├── models/       # Database models
  ├── templates/    # HTML templates
  ├── static/       # Static assets
  └── ai/           # AI-related components
  ```

### 2. Imports
- Group imports in the following order:
  1. Standard library imports
  2. Third-party imports
  3. Local application imports
- Use absolute imports for application modules
- Example:
  ```python
  import os
  from typing import Dict, List, Optional
  
  from flask import current_app
  import openai
  
  from src.models import User
  from src.auth.utils import verify_token
  ```

### 3. Python Code Style
- Follow PEP 8 guidelines
- Use type hints for function arguments and return values
- Write docstrings for all public functions and classes
- Example:
  ```python
  def get_user_stats(user_id: int) -> Dict[str, Any]:
      """Get statistics for a user.
      
      Args:
          user_id: The user's ID
          
      Returns:
          Dictionary containing user statistics
          
      Raises:
          ValueError: If user_id is invalid
      """
      pass
  ```

### 4. JavaScript Code Style
- Use ES6+ features
- Prefer const over let, avoid var
- Use arrow functions for callbacks
- Example:
  ```javascript
  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch('/api/v1/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
  };
  ```

### 5. HTML/CSS Style
- Use semantic HTML5 elements
- Follow BEM naming convention for CSS classes
- Keep styles modular and reusable
- Example:
  ```html
  <article class="game-card">
    <header class="game-card__header">
      <h2 class="game-card__title">Match Details</h2>
    </header>
    <div class="game-card__content">
      <!-- Content here -->
    </div>
  </article>
  ```

## Code Documentation

### 1. Function Documentation
- Document parameters, return values, and exceptions
- Include usage examples for complex functions
- Example:
  ```python
  def analyze_game_style(games: List[Dict]) -> Dict[str, Any]:
      """Analyze a player's game style from their history.
      
      Args:
          games: List of game dictionaries containing:
              - player_id: ID of the player
              - shots: List of shots taken
              - outcome: Game outcome
              
      Returns:
          Dictionary containing:
          - style: Identified playing style
          - confidence: Confidence score (0-1)
          - traits: List of identified traits
          
      Example:
          >>> games = [{"player_id": 1, "shots": [...], "outcome": "win"}]
          >>> analyze_game_style(games)
          {"style": "aggressive", "confidence": 0.8, "traits": ["risk-taker"]}
      """
      pass
  ```

### 2. Class Documentation
- Document class purpose and usage
- Include examples for important methods
- Example:
  ```python
  class StoryGenerator:
      """Service for generating game stories and match narratives.
      
      This class handles the generation of engaging narratives for games,
      matches, and player profiles using AI models.
      
      Attributes:
          cache_dir: Directory for caching generated stories
          
      Example:
          >>> generator = StoryGenerator()
          >>> story = await generator.generate_game_story(game)
      """
      pass
  ```

## Error Handling

### 1. Exception Handling
- Use specific exception types
- Handle exceptions at appropriate levels
- Log errors with context
- Example:
  ```python
  try:
      result = await ai_service.generate_text(prompt)
  except OpenAIError as e:
      current_app.logger.error(f"AI generation failed: {e}")
      return {"error": "Story generation failed"}
  except ValueError as e:
      current_app.logger.warning(f"Invalid prompt: {e}")
      return {"error": "Invalid input"}
  ```

### 2. API Error Responses
- Use consistent error response format
- Include helpful error messages
- Example:
  ```python
  def handle_validation_error(error):
      return {
          "error": {
              "code": "VALIDATION_ERROR",
              "message": str(error),
              "details": error.details
          }
      }, 400
  ```

## Testing

### 1. Test Organization
- Group tests by functionality
- Use descriptive test names
- Include both positive and negative test cases
- Example:
  ```python
  class TestStoryGenerator:
      @pytest.mark.asyncio
      async def test_generate_game_story_success(self):
          """Test successful game story generation."""
          pass
          
      @pytest.mark.asyncio
      async def test_generate_game_story_invalid_game(self):
          """Test story generation with invalid game data."""
          pass
  ```

### 2. Test Documentation
- Document test purpose and scenarios
- Include setup requirements
- Example:
  ```python
  @pytest.mark.asyncio
  async def test_player_style_analysis():
      """Test player style analysis with various game histories.
      
      Scenarios tested:
      1. Player with aggressive style
      2. Player with defensive style
      3. Player with mixed style
      4. New player with no history
      """
      pass
  ```

## Version Control

### 1. Commit Messages
- Use clear, descriptive commit messages
- Follow the format: `[Type] Description`
- Types: Feature, Fix, Docs, Style, Refactor, Test
- Example:
  ```
  [Feature] Add AI-powered match commentary
  [Fix] Correct player statistics calculation
  [Docs] Update API documentation
  ```

### 2. Branch Names
- Use feature branches for new functionality
- Follow the format: `feature/description`
- Example:
  ```
  feature/ai-commentary
  fix/auth-validation
  docs/api-guide
  ``` 