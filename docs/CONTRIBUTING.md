# Contributing to DojoPool

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

### Our Pledge
We are committed to providing a friendly, safe, and welcoming environment for all contributors.

### Our Standards
- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker and Docker Compose
- Git

### Setup Development Environment
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dojopool.git
   cd dojopool
   ```

3. Set up development environment:
   ```bash
   # Backend setup
   python -m venv .venv
   source .venv/bin/activate  # Linux/Mac
   .venv\Scripts\activate     # Windows
   pip install -r requirements.txt
   pip install -r requirements-dev.txt

   # Frontend setup
   cd src/frontend
   npm install
   ```

4. Set up pre-commit hooks:
   ```bash
   pre-commit install
   ```

## Development Process

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation

### Branch Naming Convention
```
feature/issue-number-short-description
bugfix/issue-number-short-description
hotfix/issue-number-short-description
```

Example: `feature/123-add-tournament-system`

### Commit Messages
Follow the conventional commits specification:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example:
```
feat(tournament): add bracket generation system

- Implement single elimination brackets
- Add seeding algorithm
- Include tournament progression logic

Closes #123
```

## Pull Request Process

1. Update Documentation
   - Add/update API documentation
   - Update README if needed
   - Add comments for complex logic

2. Run Tests
   ```bash
   # Backend tests
   pytest
   
   # Frontend tests
   npm test
   ```

3. Create Pull Request
   - Use PR template
   - Reference related issues
   - Add screenshots for UI changes
   - Describe testing procedure

4. Code Review
   - Address review comments
   - Keep discussions focused
   - Be responsive to feedback

5. Merge Requirements
   - Passing CI/CD pipeline
   - Approved code review
   - Updated documentation
   - No merge conflicts

## Coding Standards

### Python Code Style
- Follow PEP 8
- Use type hints
- Maximum line length: 100 characters
- Use docstrings for functions and classes

Example:
```python
def calculate_ranking(player_id: int, matches: List[Match]) -> float:
    """Calculate player ranking based on match history.

    Args:
        player_id: The ID of the player
        matches: List of matches to analyze

    Returns:
        Float representing player's ranking score
    """
    pass
```

### TypeScript/JavaScript Style
- Use ESLint configuration
- Prefer TypeScript over JavaScript
- Use functional components in React
- Use hooks for state management

Example:
```typescript
interface PlayerProps {
  id: number;
  name: string;
  rank: number;
}

const Player: React.FC<PlayerProps> = ({ id, name, rank }) => {
  const [score, setScore] = useState<number>(0);
  
  return (
    <div className="player-card">
      <h2>{name}</h2>
      <p>Rank: {rank}</p>
    </div>
  );
};
```

## Testing Guidelines

### Backend Testing
- Write unit tests for all new features
- Include integration tests for API endpoints
- Test edge cases and error conditions
- Use pytest fixtures for common setup

### Frontend Testing
- Test component rendering
- Test user interactions
- Mock API calls
- Test error states
- Use React Testing Library

### Performance Testing
- Include load tests for API endpoints
- Test WebSocket performance
- Monitor memory usage
- Check bundle size

## Documentation

### API Documentation
- Document all endpoints
- Include request/response examples
- Document error responses
- Keep OpenAPI spec updated

### Code Documentation
- Add docstrings to functions
- Comment complex logic
- Update README for new features
- Include setup instructions

### User Documentation
- Update user guides
- Add screenshots
- Include troubleshooting
- Document new features

## Community

### Communication Channels
- GitHub Issues
- Discord Server
- Development Blog
- Monthly Community Calls

### Getting Help
- Check existing issues
- Read documentation
- Ask in Discord
- Join community calls

### Recognition
- Contributors list in README
- Monthly MVP recognition
- Feature highlights in blog
- Community spotlights

## Additional Resources

### Learning Resources
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://reactjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/)

### Useful Tools
- [pre-commit](https://pre-commit.com/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [pytest](https://docs.pytest.org/)

### Project Links
- [Project Board](https://github.com/orgs/dojopool/projects)
- [Documentation](https://docs.dojopool.com)
- [API Reference](https://api.dojopool.com/docs)
- [Style Guide](https://docs.dojopool.com/style-guide) 