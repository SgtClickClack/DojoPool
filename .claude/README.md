# .claude

This folder contains reusable prompt templates for AI coding assistants (Claude, Cursor, Codex, etc). Each `.prompt` file is a ready-to-use template for generating consistent, high-quality AI outputs. Add new prompt templates here as needed for your workflows.

## Purpose

- **Reusable Prompts & Context Priming:** Store all reusable prompts, context priming scripts, and agentic commands here. These help AI tools quickly get the right context and automate common workflows.
- **Slash-Commands & Templates:** Organize prompts for common tasks, context priming, feedback, and more.

## Best Practices

- Name prompt files clearly by their function (e.g., `context_prime.prompt`, `feedback.prompt`).
- Keep prompts concise, focused, and easy to adapt for new tasks.
- Add new prompts as workflows evolve and remove outdated ones.
- Reference related specs in `/specs` and docs in `/ai-docs` for maximum context.
- Consider adding a `commands/` subfolder for complex or multi-step agentic workflows (optional).

## Folder Relationships

- `.claude/`: Reusable prompts and context priming scripts
- `ai-docs/`: Persistent knowledge base for AI/agentic tools
- `specs/`: Feature plans and agentic coding specs

For best results, keep this folder organized and cross-reference with `/ai-docs` and `/specs` folders.
