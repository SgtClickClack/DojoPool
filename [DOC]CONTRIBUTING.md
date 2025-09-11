# Contributing to DojoPool

🎱 **Welcome to the DojoPool development community!** This guide outlines our contribution process and best practices for our hybrid pool gaming platform.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards & Quality](#code-standards--quality)
4. [Testing Requirements](#testing-requirements)
5. [Pull Request Process](#pull-request-process)
6. [Release Process](#release-process)
7. [Getting Help](#getting-help)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x (managed via `.nvmrc`)
- **Yarn**: v4.x (package manager for monorepo)
- **Python**: v3.11+ (for AI services)
- **PostgreSQL**: v13+ (database)
- **Redis**: v6+ (caching & sessions)
- **Git**: Latest version with GitHub CLI (recommended)

### Quick Setup

```bash
# 1. Clone and setup
git clone https://github.com/your-org/dojopool.git
cd dojopool
git checkout dev

# 2. Install dependencies
yarn install --immutable

# 3. Configure environment
cp env.example .env.local
# Edit .env.local with your credentials

# 4. Setup database
createdb dojopool
cd services/api
npx prisma migrate dev
npx prisma generate

# 5. Start development
yarn dev
```

For detailed setup instructions, see our [Developer Onboarding Guide](./docs/DEVELOPER_ONBOARDING.md).

---

## 🔄 Development Workflow

### Branch Strategy

```
main (production) ← dev (development) ← feature/* (features)
                                      ← bugfix/* (fixes)
                                      ← hotfix/* (urgent fixes)
```

- **`main`**: Production-ready code, deployed to production
- **`dev`**: Integration branch for ongoing development
- **Feature branches**: Created from `dev` for new features
- **Bugfix branches**: Created from `dev` for bug fixes

### Creating Feature Branches

```bash
# Always start from dev
git checkout dev
git pull origin dev

# Create descriptive feature branch
git checkout -b feature/user-authentication
# or
git checkout -b bugfix/login-validation

# Push to create remote branch
git push -u origin feature/user-authentication
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format: type(scope): description
git commit -m "feat(auth): add Google OAuth integration"
git commit -m "fix(ui): resolve mobile layout issue"
git commit -m "docs(api): update tournament endpoints"
git commit -m "test(auth): add login validation tests"
git commit -m "refactor(db): optimize query performance"
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code restructuring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Scopes:**

- `auth`: Authentication features
- `api`: Backend API changes
- `ui`: Frontend UI changes
- `db`: Database changes
- `ai`: AI/ML features
- `docs`: Documentation

---

## 💻 Code Standards & Quality

### TypeScript/JavaScript Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Airbnb config with React/JSX rules
- **Prettier**: Consistent code formatting
- **Imports**: Absolute imports with path mapping

```typescript
// ✅ Good
import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { formatDate } from '@/utils/date';

// ❌ Avoid
import React from 'react';
import { User } from '../../../types/user';
```

### Python Standards (AI Services)

- **Type Hints**: Required for all functions
- **Black**: Code formatting
- **isort**: Import sorting
- **Pylint**: Code quality

```python
# ✅ Good
from typing import List, Optional
from datetime import datetime

def process_game_data(game_id: str, players: List[str]) -> Optional[dict]:
    """Process game data for analysis."""
    pass

# ❌ Avoid
def process_game_data(game_id, players):
    pass
```

### Code Quality Checks

```bash
# Run all quality checks
yarn lint              # ESLint + Prettier
yarn type-check        # TypeScript validation
yarn test:coverage     # Unit tests with coverage

# Auto-fix issues
yarn lint:fix          # Fix linting issues
yarn format            # Format code
```

### File Organization

```
apps/web/
├── src/
│   ├── components/     # UI components (feature-based)
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript definitions
│   └── styles/        # Global styles

services/api/
├── src/
│   ├── modules/       # NestJS modules
│   ├── common/        # Shared utilities
│   ├── config/        # Configuration
│   └── main.ts        # Application entry
```

---

## 🧪 Testing Requirements

### Testing Pyramid

1. **Unit Tests** (70-80%): Individual functions/components
2. **Integration Tests** (15-20%): API endpoints, database operations
3. **End-to-End Tests** (5-10%): Complete user workflows

### Coverage Requirements

- **Overall**: ≥ 80% coverage
- **Critical Paths**: ≥ 90% coverage
- **New Features**: 100% coverage required

### Running Tests

```bash
# Unit tests
yarn test:unit

# Integration tests
yarn test:int

# All tests with coverage
yarn test:coverage

# E2E tests
yarn cypress:open

# Watch mode (development)
yarn test:watch
```

### Writing Tests

#### React Component Test

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameBoard } from './GameBoard'

describe('GameBoard', () => {
  it('should render game board correctly', () => {
    render(<GameBoard gameId="123" />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('should handle shot submission', async () => {
    const user = userEvent.setup()
    render(<GameBoard gameId="123" />)

    await user.click(screen.getByRole('button', { name: /shoot/i }))
    expect(mockSubmitShot).toHaveBeenCalled()
  })
})
```

#### API Service Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should create a game successfully', async () => {
    const gameData = { playerAId: '1', playerBId: '2' };
    const game = await service.createGame(gameData);

    expect(game).toBeDefined();
    expect(game.status).toBe('scheduled');
  });
});
```

---

## 🔄 Pull Request Process

### PR Requirements

1. **Branch**: Created from `dev`, follows naming convention
2. **Tests**: All tests pass, coverage maintained
3. **Code Quality**: Linting passes, TypeScript errors resolved
4. **Documentation**: Updated for new features/APIs
5. **Security**: Security scan passes (if applicable)

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance impact assessed
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: At least 2 approvals required
3. **Testing**: QA validation for complex features
4. **Merge**: Squash merge to maintain clean history

### PR Best Practices

- **Size**: Keep PRs small and focused (< 500 lines)
- **Description**: Clear explanation of changes and rationale
- **Testing**: Include test instructions for reviewers
- **Breaking Changes**: Clearly document API changes
- **Dependencies**: Update lockfiles and document changes

---

## 🚀 Release Process

### Release Types

- **Patch** (`1.0.1`): Bug fixes, minor improvements
- **Minor** (`1.1.0`): New features, backward compatible
- **Major** (`2.0.0`): Breaking changes

### Release Steps

1. **Preparation**

   ```bash
   # Create release branch from dev
   git checkout -b release/v1.1.0
   ```

2. **Version Update**

   ```bash
   # Update version in package.json
   yarn version --new-version 1.1.0

   # Update changelog
   # Follow: https://keepachangelog.com/
   ```

3. **Testing**

   ```bash
   # Run full test suite
   yarn test:ci

   # Deploy to staging
   yarn deploy:staging
   ```

4. **Release**

   ```bash
   # Merge to main
   git checkout main
   git merge release/v1.1.0

   # Create tag
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin main --tags

   # Deploy to production
   yarn deploy:production
   ```

---

## 🆘 Getting Help

### Resources

- **[Developer Onboarding](./docs/DEVELOPER_ONBOARDING.md)**: Complete setup guide
- **[API Documentation](./docs/api/README.md)**: Backend API reference
- **[Architecture Guide](./docs/ARCHITECTURE.md)**: System design
- **[Troubleshooting Guide](./docs/troubleshooting.md)**: Common issues

### Communication

- **Discord**: Real-time development discussions
- **GitHub Issues**: Bug reports and feature requests
- **Pull Request Comments**: Code review discussions
- **Documentation Issues**: Suggest improvements

### Asking for Help

1. **Check Documentation**: Search existing docs first
2. **GitHub Issues**: Look for similar problems
3. **Discord Community**: Ask in appropriate channels
4. **Code Reviews**: Request help from team members

### Key Contacts

- **Tech Lead**: Architecture and technical decisions
- **Product Manager**: Feature prioritization
- **DevOps Lead**: Infrastructure and deployment
- **QA Lead**: Testing strategy

---

## 🎯 Success Metrics

- **Code Quality**: All linting passes, 80%+ coverage
- **Delivery**: Consistent PR velocity and quality
- **Collaboration**: Active participation in reviews
- **Learning**: Regular documentation contributions

Thank you for contributing to DojoPool! 🎱 Your contributions help build the future of hybrid gaming experiences.
