# DojoPool Project Structure

## Overview
The DojoPool project follows a modular, feature-based structure that promotes separation of concerns and maintainability.

## Directory Structure

```
src/dojopool/
├── core/                  # Core functionality and base classes
│   ├── extensions.py     # Flask extensions
│   ├── models/           # Base models and mixins
│   └── services/         # Core services (cache, db, etc.)
├── models/               # Database models
│   ├── game.py          # Game-related models
│   ├── user.py          # User model
│   └── ...
├── services/            # Business logic services
│   ├── game_service.py  # Game-related business logic
│   ├── auth_service.py  # Authentication service
│   └── ...
├── routes/              # API routes and views
│   ├── auth/           # Authentication routes
│   ├── game/           # Game-related routes
│   └── ...
├── api/                 # API-specific code
│   ├── schemas/        # API schemas and serializers
│   └── validators/     # API request validators
├── templates/           # HTML templates
├── static/             # Static files (CSS, JS, etc.)
└── utils/              # Utility functions and helpers

## Key Components

### Models
All database models are located in `models/`. Each model is in its own file and inherits from the base model in `core/models/base.py`.

### Services
- Core services (`core/services/`): Fundamental services like caching, database access
- Business services (`services/`): Domain-specific business logic

### Routes
API routes are organized by feature in `routes/`. Each feature has its own blueprint.

### Core
The `core/` directory contains base classes, extensions, and fundamental functionality used throughout the application.

## Best Practices

1. Keep models simple and focused on data structure
2. Put business logic in services
3. Use blueprints for route organization
4. Keep views thin, delegate to services
5. Use type hints throughout the codebase
6. Follow PEP 8 style guidelines
7. Document all public APIs and complex logic

## Dependencies
- Flask: Web framework
- SQLAlchemy: ORM
- Celery: Task queue
- Redis: Caching and message broker
- Pytest: Testing framework

## Development Guidelines

1. New features should:
   - Have their own blueprint in `routes/`
   - Keep models in `models/`
   - Implement business logic in `services/`
   - Include tests in `tests/`

2. Code organization:
   - One class per file (with exceptions for closely related classes)
   - Clear separation of concerns
   - Dependency injection where possible

3. Testing:
   - Unit tests for models and services
   - Integration tests for API endpoints
   - End-to-end tests for critical flows

4. Documentation:
   - Docstrings for all public functions/methods
   - README files in major directories
   - API documentation using OpenAPI/Swagger

## Deployment

The application is designed to be deployed using Docker containers. Key files:
- `Dockerfile`: Container definition
- `docker-compose.yml`: Service orchestration
- `.env`: Environment variables (not in version control)

## Contributing

1. Follow the existing directory structure
2. Use type hints
3. Write tests
4. Update documentation
5. Follow code style guidelines 