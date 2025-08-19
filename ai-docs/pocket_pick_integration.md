# Pocket Pick Integration for Agentic Coding

## Overview

Pocket Pick is a lightweight SQLite MCP server for personal knowledge management. Integrating Pocket Pick with your agentic coding folders (ai-docs, specs, .claude) enables scalable, cross-project knowledge sharing and instant context priming for AI coding assistants.

## Why Integrate Pocket Pick?

- Store and retrieve code snippets, docs, and reusable prompts across projects
- Create a personal knowledge base that grows over time
- Instantly prime agentic coding tools with relevant context

## Official Repo

- [Pocket Pick GitHub](https://github.com/disler/pocket-pick)

## Setup Instructions

1. Clone the Pocket Pick repo:
   ```sh
   git clone https://github.com/disler/pocket-pick.git
   cd pocket-pick
   ```
2. Install dependencies and run the MCP server (see repo README for details):
   ```sh
   pip install -r requirements.txt
   python pocket_pick.py
   ```
3. Add your ai-docs, specs, and .claude folders to Pocket Pick as knowledge sources:
   ```sh
   pocket add-folder /path/to/your/project/ai-docs
   pocket add-folder /path/to/your/project/specs
   pocket add-folder /path/to/your/project/.claude
   ```
4. Use Pocket Pick commands to search, retrieve, and manage knowledge items:
   ```sh
   pocket find "context prime"
   pocket list
   pocket get <item_id>
   ```

## Best Practices

- Regularly update your Pocket Pick database with new specs, prompts, and docs
- Use Pocket Pick to quickly onboard new projects or team members
- Leverage Pocket Pick's search and retrieval features to supercharge agentic coding workflows

## References

- [Pocket Pick GitHub](https://github.com/disler/pocket-pick)
- [Agentic Coding Video](https://www.youtube.com/watch?v=hGg3nWp7afg)
