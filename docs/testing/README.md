## Key Files

The testing setup includes the following key files:

- [Test Configuration](../../tests/conftest.py) - Test fixtures and configuration
- [Test Factories](../../tests/factories.py) - Test data factories
- [Test Runner](../../tests/scripts/runTests.js) - Test runner script

## Example Test

Here's a sample test function that demonstrates how to test an API endpoint:

```python
def test_user_creation(client, db):
    """Test user creation endpoint."""
    response = client.post('/api/users', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    assert 'id' in response.json
```

## Running Tests

For detailed information about pytest, visit the [pytest documentation](https://docs.pytest.org/en/stable/).

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