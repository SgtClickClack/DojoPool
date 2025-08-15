## Testing Documentation

This project uses pytest for testing. For detailed information about pytest, visit the [pytest documentation](https://docs.pytest.org/en/stable/).

### Key Files

- `tests/conftest.py` - Test fixtures and configuration
- `tests/factories.py` - Test data factories
- `tests/scripts/runTests.js` - Test runner script

### Running Tests

Run all tests:
```bash
pytest
```

Run specific test file:
```bash
pytest tests/test_file.py
```

Run with coverage:
```bash
pytest --cov=src/dojopool
```

Run with verbose output:
```bash
pytest -v
``` 