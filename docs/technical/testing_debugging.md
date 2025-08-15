# Testing and Debugging Guide

## Testing Framework

### 1. Test Structure
```
tests/
├── unit/                 # Unit tests
│   ├── test_models/     # Model tests
│   ├── test_auth/       # Authentication tests
│   ├── test_api/        # API endpoint tests
│   └── test_ai/         # AI component tests
├── integration/         # Integration tests
│   ├── test_api/       # API integration tests
│   └── test_flows/     # User flow tests
└── e2e/                # End-to-end tests
    └── test_scenarios/ # User scenario tests
```

### 2. Test Categories

#### Unit Tests
- Test individual components in isolation
- Mock external dependencies
- Fast execution
- High coverage

Example:
```python
def test_user_creation():
    """Test user model creation and validation."""
    user = User(
        username="testuser",
        email="test@example.com"
    )
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert not user.is_verified
```

#### Integration Tests
- Test component interactions
- Limited mocking
- Database interactions
- API endpoint testing

Example:
```python
def test_user_registration_flow():
    """Test complete user registration process."""
    response = client.post('/auth/register', json={
        'username': 'newuser',
        'email': 'new@example.com',
        'password': 'securepass123'
    })
    assert response.status_code == 201
    assert 'verification_email_sent' in response.json
```

#### End-to-End Tests
- Test complete user scenarios
- No mocking
- Browser automation
- Real environment testing

Example:
```python
def test_game_creation_to_completion():
    """Test full game lifecycle from creation to completion."""
    # Login
    login_user(driver, 'testuser', 'password123')
    
    # Create game
    create_new_game(driver, opponent='player2')
    
    # Play game
    complete_game_actions(driver)
    
    # Verify results
    assert_game_completed(driver)
```

## Testing Best Practices

### 1. Test Organization
- One test file per module
- Clear test names describing behavior
- Group related tests in classes
- Use appropriate fixtures

Example:
```python
class TestUserAuthentication:
    """Test suite for user authentication."""
    
    def test_successful_login(self, client, user):
        """Test successful user login."""
        pass
    
    def test_failed_login_invalid_password(self, client, user):
        """Test login failure with wrong password."""
        pass
```

### 2. Test Coverage
- Aim for 80%+ coverage
- Focus on critical paths
- Test edge cases
- Test error conditions

Running coverage:
```bash
# Generate coverage report
pytest --cov=src tests/


# Generate HTML report
pytest --cov=src --cov-report=html tests/
```

### 3. Test Data
- Use fixtures for common data
- Avoid hard-coded values
- Clean up test data
- Use factories for complex objects

Example:
```python
@pytest.fixture
def game_factory():
    """Factory for creating test games."""
    def _create_game(**kwargs):
        defaults = {
            'game_type': 'eight_ball',
            'is_ranked': True,
            'status': 'pending'
        }
        defaults.update(kwargs)
        return Game(**defaults)
    return _create_game
```

## Debugging Tools and Techniques

### 1. Logging
- Use different log levels appropriately
- Include context in log messages
- Configure logging per environment

Example:
```python
import logging

logger = logging.getLogger(__name__)

def process_game_result(game_id: int):
    """Process game results and update rankings."""
    logger.info(f"Processing game {game_id}")
    try:
        game = Game.query.get(game_id)
        if not game:
            logger.error(f"Game {game_id} not found")
            return False
        
        logger.debug(f"Game data: {game.to_dict()}")
        # Process game...
        
    except Exception as e:
        logger.exception(f"Error processing game {game_id}")
        raise
```

### 2. Debugging Configuration
```python
# Development config
DEBUG = True
DEBUG_TB_ENABLED = True
DEBUG_TB_INTERCEPT_REDIRECTS = False
SQLALCHEMY_RECORD_QUERIES = True

# Production config
DEBUG = False
DEBUG_TB_ENABLED = False
```

### 3. Common Debugging Scenarios

#### Database Issues
```python
# Enable SQL logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Debug query
print(str(query.statement.compile(compile_kwargs={"literal_binds": True})))

# Check session state
print(db.session.info)
```

#### Authentication Issues
```python
# Debug token
logger.debug(f"Token payload: {token_payload}")
logger.debug(f"User claims: {get_jwt_claims()}")

# Check session
logger.debug(f"Session data: {session.items()}")
```

#### API Issues
```python
# Log request details
logger.debug(f"Request headers: {request.headers}")
logger.debug(f"Request body: {request.get_json()}")

# Log response
logger.debug(f"Response status: {response.status_code}")
logger.debug(f"Response body: {response.get_data(as_text=True)}")
```

### 4. Performance Debugging

#### Profiling
```python
from flask_profiler import Profiler

# Initialize profiler
profiler = Profiler()
profiler.init_app(app)

# Profile specific function
@profiler.profile()
def expensive_operation():
    pass
```

#### Query Optimization
```python
# Log slow queries
SQLALCHEMY_RECORD_QUERIES = True
DATABASE_QUERY_TIMEOUT = 0.5

@app.after_request
def after_request(response):
    for query in get_debug_queries():
        if query.duration >= DATABASE_QUERY_TIMEOUT:
            logger.warning(f"Slow query: {query.statement}")
    return response
```

## Error Handling

### 1. Global Error Handler
```python
@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all unhandled exceptions."""
    logger.exception("Unhandled exception")
    return {
        'error': str(e),
        'type': e.__class__.__name__
    }, 500
```

### 2. Custom Exceptions
```python
class GameError(Exception):
    """Base exception for game-related errors."""
    pass

class InvalidGameStateError(GameError):
    """Raised when game state transition is invalid."""
    pass

class PlayerNotFoundError(GameError):
    """Raised when player is not found."""
    pass
```

### 3. Error Monitoring
```python
# Sentry integration
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0
)
```

## Continuous Integration

### 1. GitHub Actions Workflow
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        pytest --cov=src tests/
        
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

### 2. Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
  
  - repo: https://github.com/PyCQA/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        additional_dependencies: [flake8-docstrings]
```

## Documentation

### 1. Test Documentation
- Document test purpose
- Include example usage
- Document fixtures and helpers
- Maintain testing guide

### 2. Debug Documentation
- Document common issues
- Include troubleshooting steps
- Provide debugging tools guide
- Update with new findings