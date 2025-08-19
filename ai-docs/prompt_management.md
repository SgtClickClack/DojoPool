# Prompt Management System

This document summarizes the prompt management system for DojoPool's AI features. It covers Python and TypeScript prompt templates, their usage, and integration points.

## Python Prompt Management

- **File:** `src/ai/prompts.py`
- **Classes:**
  - `PromptTemplate`: Handles prompt templates with variable substitution.
  - `PromptManager`: Loads and formats prompt templates for different scenarios (game stories, match previews, player profiles).
- **Usage Example:**
  ```python
  from src.ai.prompts import prompt_manager
  prompt = prompt_manager.format_prompt('game_story', player1='John', player2='Alice')
  ```

## TypeScript Prompt Templates

- **File:** `src/dojopool/ai/prompts.ts`
- **Structure:**
  - `PROMPT_TEMPLATES`: Object containing reusable prompt templates for stories, challenges, feedback, and progression.
  - `generateStoryPrompt`: Function to generate prompts by merging context and template parameters.

## Python Utility Templates

- **File:** `src/dojopool/utils/prompt_templates.py`
- **Templates:**
  - `STORY_PROMPT_TEMPLATE`: For match recaps.
  - `RECOMMENDATION_PROMPT_TEMPLATE`: For personalized recommendations.
  - `ANALYSIS_PROMPT_TEMPLATE`: For detailed match analysis.

## Integration Points

- Used by AI services for generating narratives, feedback, and analysis.
- Supports both backend (Python) and frontend (TypeScript) workflows.

## Best Practices

- Store reusable templates in `.claude/` for agentic coding workflows.
- Document new templates and update this file as needed.
