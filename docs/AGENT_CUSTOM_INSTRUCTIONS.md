# Agent Custom Instructions

## Cursor Rules (Primary Set)

### General Principles
🟢 Acknowledge these rules with an emoji at the start of every message.
🚫 Never ask the user to do something you can accomplish via commands.
📋 Always check the Roadmap and development tracking files before suggesting or starting a task. Suggest only one next task at a time—never a list.
🗂️ After every completed task, update the split tracking files (DEVELOPMENT_TRACKING_INDEX.md, DEVELOPMENT_TRACKING_PART_01.md, etc.) and the Roadmap as needed. Never update the legacy consolidated file.
🏷️ Follow the established format and required sections for new tracking entries:
Core Components
Key Features
Integration Points
File Paths
Next Priority Task

### Code Organization & Quality
📁 Place components, services, and utilities in their appropriate directories under src/.
🧩 Maintain separation of concerns; do not mix services, components, or utilities.
📝 Use proper naming conventions: PascalCase for components, camelCase for utilities.
🔄 Always look for existing code to iterate on before creating new code or patterns.
🧹 Avoid code duplication; check for similar functionality elsewhere before adding new code.
🧼 Keep the codebase clean, organized, and free of large files (refactor files >300 lines).
🛑 Avoid scripts in files unless absolutely necessary and never for single-use scripts.
🌍 Write code that respects all environments: dev, test, and prod.
🔒 Never overwrite .env files without explicit user confirmation.

### Testing
✅ Maintain a minimum of 80% code coverage with unit, integration, and performance tests.
🧪 Mock data only in tests—never in dev or prod code.
🧪 Write thorough tests for all major functionality.
🧪 Use appropriate test utilities and mocks.

### Documentation
📚 Keep documentation in sync with code using the doc-sync tool.
📝 Update README.md for major changes.
🏷️ Include comprehensive JSDoc/TSDoc comments.
🗂️ Documentation tracking must include: Core Components, Key Features, Integration Points, File Paths, Next Priority Task.

### Version Control & Commits
📝 Follow commit message format: type(scope): description
🔗 Reference issues and tasks in commits.
🧩 Keep commits focused and atomic.
🚦 Only commit intentional, relevant changes. Discard merge artifacts or corrupted files.
🔑 Never commit secrets or credentials; .gitignore must cover these files.

### MCP Integration
⚙️ Use ports 3002-3011 and proper health checks.
🏗️ Follow established integration patterns.

### Error Handling & Performance
🛡️ Implement error boundaries and consistent logging.
🔄 Include error recovery mechanisms.
🚀 Apply suggested optimizations and use performance monitoring tools.
🗃️ Follow established caching strategies.

### Workflow & Task Execution
🔄 Always kill related servers before starting a new one for testing.
🟢 Always start up a new server after making changes so the user can test.
🧠 Prefer simple solutions and avoid unnecessary complexity.
🧑‍💻 Only make changes relevant to the task at hand.
🧩 Do not introduce new patterns or technologies when fixing bugs unless all existing options are exhausted; remove old implementations if new ones are added.
🧐 Consider how changes may affect other methods and areas of the codebase.
🛑 Never touch unrelated code.


## Cursor Rules (Secondary Set)

---
description:
globs:
alwaysApply: true
---

### Cursor Rules

*   Add emoji to beginning of messages to let me know that you have read these rules
*   Consider the Roadmap and dev track file before suggesting a task. Only suggest one task, not a list of options.
*   Update Development Tracking file after completing every task
*   Always update DEVELOPMENT_TRACKING.md at /DojoPoolCombined/DEVELOPMENT_TRACKING.md
*   Follow the established format for new entries
*   Include all required sections: Core Components, Key Features, Integration Points, File Paths, Next Priority Task

### Code Organization
*   Keep components in appropriate directories under src/
*   Maintain separation of concerns between services, components, and utilities
*   Use proper file naming conventions (PascalCase for components, camelCase for utilities)

### Testing
*   Maintain minimum 80% code coverage
*   Include unit, integration, and performance tests
*   Use appropriate test utilities and mocks

### Documentation
*   Keep documentation in sync with code using doc-sync tool
*   Update README.md for major changes
*   Include comprehensive JSDoc/TSDoc comments

### MCP Integration
*   Use proper port handling (3002-3011)
*   Implement health checks
*   Follow the established integration patterns

### Version Control
*   Follow commit message format: type(scope): description
*   Keep commits focused and atomic
*   Reference issues and tasks in commits

### Error Handling
*   Implement proper error boundaries
*   Use consistent error logging
*   Include error recovery mechanisms

### Performance
*   Implement suggested optimizations
*   Use the performance monitoring tools
*   Follow the established caching strategies

### Additional Workflow Rules
*   After making changes, ALWAYS make sure to start up a new server so I can test it.
*   Always look for existing code to iterate on instead of creating new code.
*   Do not drastically change the patterns before trying to iterate on existing patterns.
*   Always kill all existing related servers that may have been created in previous testing before trying to start a new server.
*   Always prefer simple solutions
*   Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality
*   Write code that takes into account the different environments: dev, test, and prod
*   You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested
*   When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. And if you finally do this, make sure to remove the old implementation afterwards so we don't have duplicate logic.
*   Keep the codebase very clean and organized
*   Avoid writing scripts in files if possible, especially if the script is likely only to be run once
*   Avoid having files over 200-300 lines of code. Refactor at that point.
*   Mocking data is only needed for tests, never mock data for dev or prod
*   Never add stubbing or fake data patterns to code that affects the dev or prod environments
*   Never overwrite my .env file without first asking and confirming
*   Focus on the areas of code relevant to the task
*   Do not touch code that is unrelated to the task
*   Write thorough tests for all major functionality
*   Avoid making major changes to the patterns and architecture of how a feature works, after it has shown to work well, unless explicitly instructed
*   Always think about what other methods and areas of code might be affected by code changes


## Example JSON Editor Rules (For Reference)

```json
{
  "editor.rules": {
    "development_tracking": {
      "path": "/DojoPoolCombined/DEVELOPMENT_TRACKING.md",
      "updateFormat": "### {date}: {title}\n\n{description}\n\n**Core Components Implemented:**\n{components}\n\n**File Paths:**\n{paths}\n\n**Next Priority Task:**\n{next_task}\n\nExpected completion time: {estimated_time}"
    },
    "code_style": {
      "typescript": {
        "indent": 2,
        "maxLineLength": 100,
        "quoteMark": "single",
        "semicolons": true,
        "trailingComma": "es5"
      },
      "python": {
        "indent": 4,
        "maxLineLength": 88,
        "quoteMark": "double",
        "docstringStyle": "google"
      }
    },
    "commit_messages": {
      "format": "type(scope): description",
      "types": ["feat", "fix", "docs", "style", "refactor", "test", "chore"],
      "maxLength": 72
    },
    "file_organization": {
      "src": {
        "components": "**/*.{tsx,jsx}",
        "services": "services/**/*.ts",
        "utils": "utils/**/*.ts",
        "types": "types/**/*.ts",
        "tests": "tests/**/*.{test,spec}.{ts,tsx}"
      }
    },
    "documentation": {
      "required_sections": [
        "Core Components",
        "Key Features",
        "Integration Points",
        "File Paths",
        "Next Priority Task"
      ],
      "auto_update": true
    },
    "testing": {
      "coverage_threshold": 80,
      "required_types": [
        "unit",
        "integration",
        "performance"
      ]
    },
    "linting": {
      "typescript": {
        "extends": ["eslint:recommended", "@typescript-eslint/recommended"],
        "plugins": ["@typescript-eslint", "react-hooks"]
      },
      "python": {
        "extends": ["flake8", "black"],
        "max_line_length": 88
      }
    },
    "mcp_configuration": {
      "port": 3002,
      "fallback_ports": [3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011],
      "health_endpoint": "/health",
      "timeout": 5000
    }
  }
}
``` 