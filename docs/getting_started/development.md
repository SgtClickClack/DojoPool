# Development Setup Guide

This guide covers the setup and best practices for developing DojoPool.

## Development Environment

### IDE Setup

We recommend using Visual Studio Code with these extensions:
- Python
- Python Test Explorer
- Python Docstring Generator
- SQLAlchemy
- Redis
- ESLint
- Prettier

### Code Style

We follow these style guides:
- Python: PEP 8
- JavaScript: Airbnb Style Guide
- CSS: BEM methodology

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```

## Development Workflow

### 1. Branch Management

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Create a new bugfix branch
git checkout -b bugfix/issue-description

# Push your branch
git push -u origin your-branch-name
```

### 2. Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with coverage
pytest --cov=src tests/

# Run with verbose output
pytest -v
```

### 3. Database Migrations

```bash
# Create a new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Rollback migration
flask db downgrade
```

### 4. Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Development Tools

### Flask Debug Toolbar

Enable in development config:
```python
DEBUG_TB_ENABLED = True
DEBUG_TB_INTERCEPT_REDIRECTS = False
```

### Flask Shell

Custom shell context:
```python
@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Game': Game,
        'Tournament': Tournament
    }
```

### Database Utilities

```python
# Reset database
flask db-utils reset

# Create test data
flask db-utils seed

# Backup database
flask db-utils backup

# Restore database
flask db-utils restore backup_file.sql
```

## Debugging

### Python Debugger (pdb)

```python
import pdb; pdb.set_trace()
```

### Flask Debug Mode

```bash
export FLASK_DEBUG=1
flask run
```

### Logging

```python
from flask import current_app

current_app.logger.debug('Debug message')
current_app.logger.info('Info message')
current_app.logger.warning('Warning message')
current_app.logger.error('Error message')
```

## Testing

### Unit Tests

```python
def test_user_creation(client):
    """Test user creation."""
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
```

### Integration Tests

```python
def test_game_workflow(client, auth):
    """Test complete game workflow."""
    # Login
    auth.login()
    
    # Create game
    response = client.post('/games', json={
        'opponent': 'player2',
        'game_type': '8ball'
    })
    assert response.status_code == 201
    
    # Play game
    game_id = response.json['id']
    response = client.put(f'/games/{game_id}', json={
        'winner': 'testuser',
        'score': '8-5'
    })
    assert response.status_code == 200
```

### Performance Tests

```python
from locust import HttpUser, task, between

class DojoPoolUser(HttpUser):
    wait_time = between(1, 2)
    
    @task
    def view_games(self):
        self.client.get("/games")
    
    @task
    def view_tournaments(self):
        self.client.get("/tournaments")
```

## Documentation

### API Documentation

Use docstrings for API endpoints:
```python
@app.route('/api/games', methods=['POST'])
def create_game():
    """Create a new game.
    
    ---
    post:
      summary: Create a new game
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                opponent:
                  type: string
                game_type:
                  type: string
      responses:
        201:
          description: Game created successfully
    """
    # Implementation
```

### Code Documentation

Use Google-style docstrings:
```python
def calculate_ranking(player_id: int, game_history: List[Game]) -> float:
    """Calculate player ranking based on game history.
    
    Args:
        player_id: The ID of the player
        game_history: List of games played by the player
    
    Returns:
        float: The calculated ranking score
    
    Raises:
        ValueError: If player_id is not found
    """
    # Implementation
```

## Next Steps

- Review the [API Documentation](../api/README.md)
- Learn about [Testing](../development/testing.md)
- Understand the [Git Workflow](../development/git_workflow.md) 