# Contributing to DojoPool

## NGINX Configuration Guidelines

When making changes to NGINX configurations, please follow these guidelines:

### Directory Structure

```
deployment/
├── nginx/
│   ├── production/
│   │   └── nginx.conf        # Production NGINX configuration
│   ├── production.conf       # Main production configuration
│   └── test/
│       ├── nginx.conf        # Test environment configuration
│       └── nginx/
│           └── backend.conf  # Mock backend for testing
```

### Configuration Standards

1. **Security**
   - Always include appropriate security headers
   - Use modern SSL/TLS configurations
   - Implement rate limiting
   - Follow least privilege principle

2. **Performance**
   - Enable compression where appropriate
   - Configure caching correctly
   - Optimize buffer sizes
   - Use keepalive connections

3. **Maintainability**
   - Comment complex configurations
   - Use consistent naming conventions
   - Separate concerns (main config vs location blocks)
   - Keep configurations DRY

### Testing

Before submitting changes:

1. Test configurations with `nginx -t`
2. Verify SSL settings with SSL Labs
3. Test WebSocket functionality
4. Validate rate limiting
5. Check static file serving
6. Test health endpoints

### Documentation

When updating NGINX configurations:

1. Update `docs/NGINX_CONFIGURATION.md`
2. Update deployment guides if necessary
3. Document any new features or changes
4. Include troubleshooting information

### Pull Request Process

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Update documentation
5. Submit PR using the template

### Review Process

PRs modifying NGINX configurations will be reviewed for:

1. Security implications
2. Performance impact
3. Documentation completeness
4. Testing coverage
5. Compliance with standards

## General Contributing Guidelines

### Code Style

1. **Python**
   - Follow PEP 8
   - Use type hints
   - Write docstrings

2. **JavaScript**
   - Follow ESLint configuration
   - Use modern ES6+ features
   - Write JSDoc comments

3. **Documentation**
   - Write in Markdown
   - Keep documentation up-to-date
   - Include examples

### Testing

1. **Unit Tests**
   - Write tests for new features
   - Maintain test coverage
   - Use meaningful test names

2. **Integration Tests**
   - Test API endpoints
   - Verify WebSocket functionality
   - Test database interactions

3. **End-to-End Tests**
   - Test complete user flows
   - Verify frontend functionality
   - Test deployment processes

### Git Workflow

1. **Branches**
   - `main`: Production-ready code
   - `develop`: Development branch
   - Feature branches: `feature/description`
   - Hotfix branches: `hotfix/description`

2. **Commits**
   - Write clear commit messages
   - Reference issue numbers
   - Keep commits focused

3. **Pull Requests**
   - Use PR template
   - Request appropriate reviewers
   - Address review comments

### Development Environment

1. **Setup**

   ```bash
   # Clone repository
   git clone https://github.com/organization/dojopool.git
   cd dojopool

   # Create virtual environment
   python -m venv .venv
   source .venv/bin/activate  # Linux/Mac
   .venv\Scripts\activate     # Windows

   # Install dependencies
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

2. **Running Tests**

   ```bash
   # Run unit tests
   pytest tests/unit

   # Run integration tests
   pytest tests/integration

   # Run with coverage
   pytest --cov=src tests/
   ```

3. **Code Quality**

   ```bash
   # Run linters
   flake8 src tests
   pylint src tests

   # Run type checker
   mypy src
   ```

### Getting Help

- Join our Slack channel: #dojopool-dev
- Check existing issues and documentation
- Ask questions in pull requests
- Contact the maintainers

### Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).
