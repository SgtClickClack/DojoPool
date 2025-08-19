# AI Referee (Sky-T1) Integration

## Overview

The Sky-T1 AI Referee system provides automated rule interpretation, foul detection, and decision explanation for real-time pool games. It integrates with the game tracking system to enhance fairness, transparency, and player experience.

## Architecture

- Receives real-time game state and shot data from the tracking system
- Applies rule interpretation and foul detection logic using prompt templates
- Returns decisions and explanations to the game UI and logs

## Integration Points

- Game tracking system (data source)
- User interface (decision display)
- Logging system (decision review)
- .claude/ prompt templates for rule interpretation, foul detection, and decision explanation

## Usage Example

1. Game state is updated after each shot
2. AI Referee receives the new state and analyzes for rule violations or fouls
3. If a decision is made, the system:
   - Updates the UI with the decision and explanation
   - Logs the decision for review

## Prompt Templates

- `.claude/ai_referee_rule_interpretation.prompt`
- `.claude/ai_referee_foul_detection.prompt`
- `.claude/ai_referee_decision_explanation.prompt`

## Best Practices

- Keep prompt templates up to date with rulebook changes
- Log all decisions for transparency and review
- Provide clear, player-friendly explanations for all decisions
