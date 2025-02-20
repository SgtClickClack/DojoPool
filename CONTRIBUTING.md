# Contributing to DojoPool

First off, thank you for considering contributing to DojoPool! It's people like you that make DojoPool such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots and animated GIFs if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide the following information:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the Python style guide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

1. Fork the repo
2. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/my-feature
   ```
3. Make your changes
4. Run the tests:
   ```bash
   pytest
   ```
5. Run the linters:
   ```bash
   black .
   ruff check .
   mypy src/dojopool
   ```
6. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: add some feature"
   ```
7. Push to your fork:
   ```bash
   git push origin feature/my-feature
   ```
8. Create a Pull Request

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

* feat: A new feature
* fix: A bug fix
* docs: Documentation only changes
* style: Changes that do not affect the meaning of the code
* refactor: A code change that neither fixes a bug nor adds a feature
* perf: A code change that improves performance
* test: Adding missing tests or correcting existing tests
* chore: Changes to the build process or auxiliary tools

## Setting Up Development Environment

1. Install Python 3.9 or higher
2. Install Node.js 16 or higher
3. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/DojoPool.git
   cd DojoPool
   ```
4. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```
6. Install frontend dependencies:
   ```bash
   cd src/dojopool/frontend
   npm install
   ```
7. Set up pre-commit hooks:
   ```bash
   pre-commit install
   ```

## Code Style

* Python: Follow PEP 8 and use Black for formatting
* JavaScript/TypeScript: Follow the project's ESLint configuration
* Use type hints in Python code
* Write docstrings for all public functions
* Keep functions small and focused
* Use meaningful variable names

## Testing

* Write unit tests for all new code
* Maintain or increase the test coverage
* Use pytest fixtures appropriately
* Mock external services
* Test edge cases

## Documentation

* Update the README.md if needed
* Add JSDoc comments for JavaScript/TypeScript
* Update API documentation
* Include docstrings for Python functions
* Document complex algorithms
* Update changelog

## Questions?

Feel free to contact the development team if you have any questions. 