# Contributing to DojoPool

## Development Workflow

### Branch Structure

- `main`: Production-ready code only
- `dev`: Development branch for ongoing work
- Feature branches: Created from `dev` for specific features

### Getting Started

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`

### Making Changes

1. Always create a new branch from `dev`:

   ```bash
   git checkout dev
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our guidelines:

   - Follow PEP 8 for Python code
   - Use consistent naming conventions
   - Add tests for new features
   - Update documentation as needed

3. Run tests before committing:

   ```bash
   pytest
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "type: description"
   ```
   Commit types:
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation
   - style: Formatting
   - refactor: Code restructuring
   - test: Adding tests
   - chore: Maintenance

### Image Assets

1. Place images in appropriate directories:

   - `static/images/core/`: Brand assets
   - `static/images/features/`: Feature illustrations
   - `static/images/icons/`: UI icons
   - `static/images/backgrounds/`: Background images

2. Follow naming conventions:

   - Use lowercase for all files except core brand assets
   - No spaces in filenames
   - Use descriptive names

3. Run image tests:
   ```bash
   pytest tests/test_image_assets.py
   ```

### Pull Requests

1. Push your feature branch:

   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request to merge into `dev`
3. Ensure all tests pass
4. Get code review approval
5. Merge using squash and merge

### Releasing

1. Merge `dev` into `main`:

   ```bash
   git checkout main
   git merge dev
   ```

2. Tag the release:
   ```bash
   git tag -a v1.x.x -m "Release description"
   git push origin v1.x.x
   ```

## Code Quality

- Run linters before committing
- Maintain test coverage
- Follow security best practices
- Keep dependencies updated

## Documentation

- Update README.md for major changes
- Maintain inline documentation
- Update API documentation
- Keep CHANGELOG.md current

## Questions?

- Open an issue for discussions
- Tag maintainers for urgent matters
- Join our developer chat
