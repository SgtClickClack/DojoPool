## Key Files

- `../../tests/conftest.py` - Test fixtures and configuration
- `../../tests/factories.py` - Test data factories
- `../../tests/scripts/runTests.js` - Test runner script

## Example Test

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