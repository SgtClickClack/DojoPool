# DojoPool Test Suite

## Structure

- `backup/`, `core/`, `e2e/`, `performance/`: Python test modules grouped by domain.
- `__mocks__/`: Python test mocks.
- `frontend/__tests__/`: Frontend unit and integration tests (TypeScript/React).
- `frontend/cypress/support/`: Cypress E2E and performance helpers.

## Naming Conventions
- Python: `test_*.py` for all test modules.
- TypeScript: `*.test.ts` or `*.test.tsx` for all test modules.

## Running Tests

### Python
- From the `src/dojopool/` root:
  ```
  pytest tests/
  ```

### Frontend (Jest)
- From the `src/dojopool/frontend/` directory:
  ```
  npm test
  # or
  yarn test
  ```

### Cypress (E2E)
- From `src/dojopool/frontend/`:
  ```
  npx cypress open
  ```

## Adding New Tests
- Place new test files in the relevant domain folder.
- Follow naming conventions for discoverability.
- Use mocks/utilities from `__mocks__` or `utils/` as needed.

---

For more details, see `frontend/docs/TESTING_ROADMAP.md` and `frontend/docs/testing-practices.md`.
