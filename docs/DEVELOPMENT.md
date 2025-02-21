# Development Guide

## Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- Docker and Docker Compose
- Redis (for development)
- Git

## Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/SgtClickClack/DojoPool.git
cd DojoPool
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Unix/macOS
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
# Backend dependencies
pip install -r requirements.txt
pip install -r dev-requirements.txt

# Frontend dependencies
cd frontend
npm install
```

4. Set up environment variables:
```bash
# Copy example environment files
cp config/development/.env.example config/development/.env
cp frontend/.env.example frontend/.env.local
```

5. Initialize the database:
```bash
python scripts/database/init_db.py
```

## Development Workflow

### Running the Application

1. Start the backend server:
```bash
# Development mode
python src/dojopool/server.py

# Or using the PowerShell script
.\scripts\run_server.ps1
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Start Redis (required for rate limiting and caching):
```bash
# Using Docker
docker run -d -p 6379:6379 redis

# Or as a Windows service if installed
net start Redis
```

### Running Tests

```bash
# Run all tests with coverage
pytest tests/ --cov=src/dojopool

# Run specific test file
pytest tests/test_game.py

# Run tests with specific marker
pytest -m "integration"
```

### Code Quality Tools

```bash
# Format code
black src/
isort src/

# Run type checking
mypy src/

# Run linting
flake8 src/

# Run all checks
./scripts/check_code_quality.sh
```

### Database Migrations

```bash
# Create a new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Rollback migration
flask db downgrade
```

## Docker Development

1. Build and run all services:
```bash
docker-compose up --build
```

2. Run specific service:
```bash
docker-compose up backend
```

3. Run tests in Docker:
```bash
docker-compose -f docker-compose.test.yml up
```

## API Documentation

The API documentation is available at:
- Development: http://localhost:8080/api/docs
- Production: https://api.dojopool.com/docs

You can also generate the documentation locally:
```bash
python scripts/generate_api_docs.py
```

## Debugging

1. VS Code Configuration:
   - Use the provided launch configurations in `.vscode/launch.json`
   - Set breakpoints in your code
   - Press F5 to start debugging

2. PyCharm Configuration:
   - Open Run/Debug Configurations
   - Add new Python configuration
   - Set script path to `src/dojopool/server.py`
   - Set working directory to project root

## Common Issues

1. **Redis Connection Error**
   - Ensure Redis is running
   - Check Redis connection settings in `.env`

2. **Database Migration Conflicts**
   - Remove the database file and run migrations again
   - Check for pending migrations

3. **Frontend Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

## Best Practices

1. **Code Style**
   - Follow PEP 8 guidelines
   - Use type hints
   - Write docstrings for all functions/classes
   - Keep functions small and focused

2. **Git Workflow**
   - Create feature branches from `develop`
   - Use conventional commit messages
   - Keep PRs focused and small
   - Request reviews early

3. **Testing**
   - Write tests for new features
   - Maintain test coverage above 80%
   - Include integration tests
   - Mock external services

4. **Security**
   - Never commit secrets
   - Use environment variables
   - Follow security guidelines
   - Regular dependency updates

## Contributing

Please read [CONTRIBUTING.md](../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests. 