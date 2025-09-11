# Cursor Rules

## General Principles

- 🟢 Acknowledge these rules with an emoji at the start of every message
- 🚫 Never ask the user to do something you can accomplish via commands
- 📋 Always check the Roadmap and development tracking files before starting. Do not offer options to choose from; autonomously execute as many relevant tasks as possible per turn (no “would you like…” prompts)
- 🗂️ After every completed task, update the milestones or split tracking files (`docs/milestones/*.md` and `docs/planning/tracking/*`). Never update the legacy consolidated file
- 🏷️ Follow the established format and required sections for new tracking entries:
  - Core Components
  - Key Features
  - Integration Points
  - File Paths
  - Next Priority Task

## Code Organization & Quality

- 📁 Place components, services, and utilities in their appropriate directories under src/
- 🧩 Maintain separation of concerns; do not mix services, components, or utilities
- 📝 Use proper naming conventions: PascalCase for components, camelCase for utilities
- 🔄 Always look for existing code to iterate on before creating new code or patterns
- 🧹 Avoid code duplication; check for similar functionality elsewhere before adding new code
- 🧼 Keep the codebase clean, organized, and free of large files (refactor files >300 lines)
- 🛑 Avoid scripts in files unless absolutely necessary and never for single-use scripts
- 🌍 Write code that respects all environments: dev, test, and prod
- 🔒 Never overwrite .env files without explicit user confirmation

## Testing

- ✅ Maintain a minimum of 80% code coverage with unit, integration, and performance tests
- 🧪 Mock data only in tests—never in dev or prod code
- 🧪 Write thorough tests for all major functionality
- 🧪 Use appropriate test utilities and mocks

## Documentation

- 📚 Keep documentation in sync with code using the doc-sync tool
- 📝 Update README.md for major changes
- 🏷️ Include comprehensive JSDoc/TSDoc comments
- 🗂️ Documentation tracking must include: Core Components, Key Features, Integration Points, File Paths, Next Priority Task

## Version Control & Commits

- 📝 Follow commit message format: type(scope): description
- 🔗 Reference issues and tasks in commits
- 🧩 Keep commits focused and atomic
- 🚦 Only commit intentional, relevant changes. Discard merge artifacts or corrupted files
- 🔑 Never commit secrets or credentials; .gitignore must cover these files

## MCP Integration

- ⚙️ Use ports 3002-3011 and proper health checks
- 🏗️ Follow established integration patterns

## Error Handling & Performance

- 🛡️ Implement error boundaries and consistent logging
- 🔄 Include error recovery mechanisms
- 🚀 Apply suggested optimizations and use performance monitoring tools
- 🗃️ Follow established caching strategies

## Workflow & Task Execution

- 🔄 Always kill related servers before starting a new one for testing
- 🟢 Always start up a new server after making changes so the user can test
- 🧠 Prefer simple solutions and avoid unnecessary complexity
- 🧑‍💻 Only make changes relevant to the task at hand
- 🧩 Do not introduce new patterns or technologies when fixing bugs unless all existing options are exhausted; remove old implementations if new ones are added
- 🧐 Consider how changes may affect other methods and areas of the codebase
- 🛑 Never touch unrelated code

## Editor Configuration

```json
{
  "editor.rules": {
    "development_tracking": {
      "path": "/docs/milestones/",
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
      "required_types": ["unit", "integration", "performance"]
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
