# DojoPool Project Structure

This document outlines the organization and structure of the DojoPool project after the cleanup and reorganization.

## Directory Structure

```text
dojopool/
├── src/                    # Source code
│   ├── api/               # API endpoints and handlers
│   ├── auth/              # Authentication and authorization
│   ├── blueprints/        # Flask blueprints
│   ├── core/              # Core application logic
│   ├── frontend/          # Frontend application code
│   ├── game/              # Game-specific logic
│   ├── mobile/            # Mobile application code
│   ├── models/            # Database models
│   ├── narrative/         # Narrative generation system
│   ├── ranking/           # Player ranking system
│   ├── routes/            # URL routing
│   ├── services/          # Business logic services
│   ├── spectator/         # Spectator mode functionality
│   ├── static/            # Static files (CSS, JS, images)
│   ├── templates/         # HTML templates
│   ├── utils/             # Utility functions
│   ├── app.py            # Main application file
│   ├── extensions.py      # Flask extensions
│   ├── decorators.py      # Custom decorators
│   └── exceptions.py      # Custom exceptions
│
├── config/                # Configuration files
│   ├── env/              # Environment configurations
│   │   ├── .env          # Production environment variables
│   │   └── .env.example  # Example environment variables
│   ├── alembic.ini       # Database migration config
│   └── pytest.ini        # Testing configuration
│
├── docs/                  # Documentation
│   ├── ROADMAP.md        # Project roadmap
│   ├── CHANGELOG.md      # Version history
│   └── technical/        # Technical documentation
│
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── helpers/          # Test helpers
│
├── scripts/              # Utility scripts
│   └── deployment/       # Deployment scripts
│
├── migrations/           # Database migrations
├── instance/            # Instance-specific files
├── .venv/               # Virtual environment
├── .github/             # GitHub configuration
├── .vscode/             # VS Code configuration
│
├── README.md            # Project overview
├── requirements.txt     # Python dependencies
├── setup.py            # Package configuration
├── pyproject.toml      # Project configuration
├── Dockerfile          # Docker configuration
└── docker-compose.yml  # Docker Compose configuration
```

## Component Details

### Source Code (`src/`)

- **api/**: RESTful API endpoints and handlers
- **auth/**: Authentication and authorization logic
- **blueprints/**: Flask blueprints for modular functionality
- **core/**: Core application logic and business rules
- **frontend/**: Frontend application code (React/Vue/etc.)
- **game/**: Game-specific logic and rules
- **mobile/**: Mobile application code
- **models/**: Database models and schemas
- **narrative/**: AI-powered narrative generation system
- **ranking/**: Player ranking and matchmaking system
- **routes/**: URL routing and request handling
- **services/**: Business logic services
- **spectator/**: Spectator mode functionality
- **static/**: Static assets (images, CSS, JavaScript)
- **templates/**: HTML templates
- **utils/**: Utility functions and helpers

### Configuration (`config/`)

- Environment-specific configuration files
- Database configuration
- Testing configuration
- Environment variables

### Documentation (`docs/`)

- Project roadmap and planning
- Technical documentation
- API documentation
- Development guides
- Changelog

### Tests (`tests/`)

- Unit tests for individual components
- Integration tests for system functionality
- Test helpers and utilities
- Performance tests

### Scripts (`scripts/`)

- Deployment scripts
- Database management scripts
- Development utilities
- CI/CD scripts

### Other Directories

- **migrations/**: Database migration files
- **instance/**: Instance-specific configuration
- **.venv/**: Python virtual environment
- **.github/**: GitHub Actions and configurations
- **.vscode/**: VS Code editor settings

## Key Files

### Root Directory

- **README.md**: Project overview and getting started guide
- **requirements.txt**: Python package dependencies
- **setup.py**: Package installation configuration
- **pyproject.toml**: Project metadata and build system requirements
- **Dockerfile**: Container configuration
- **docker-compose.yml**: Multi-container Docker configuration

### Source Directory

- **app.py**: Main application entry point
- **extensions.py**: Flask extension initialization
- **decorators.py**: Custom decorators for routes and functions
- **exceptions.py**: Custom exception classes

## Development Guidelines

1. **Code Organization**

   - Keep related functionality together in appropriate modules
   - Use clear, descriptive names for files and directories
   - Follow Python package structure conventions

2. **Configuration Management**

   - Store sensitive information in environment variables
   - Use appropriate configuration files for different environments
   - Keep configuration separate from code

3. **Testing**

   - Write tests for new functionality
   - Maintain test coverage
   - Organize tests to mirror source code structure

4. **Documentation**

   - Keep documentation up to date
   - Document new features and changes
   - Follow documentation standards

5. **Version Control**
   - Follow Git workflow guidelines
   - Use meaningful commit messages
   - Keep branches focused and well-organized

## Maintenance

The project structure should be maintained according to these guidelines:

1. New features should be added to appropriate directories
2. Keep the structure clean and organized
3. Regularly review and update documentation
4. Remove deprecated or unused code
5. Maintain consistent naming conventions
