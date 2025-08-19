# Git Workflow Guidelines

## Branch Strategy

### Main Branches

- `main`: Production-ready code
- `develop`: Integration branch for feature development
- `staging`: Pre-production testing

### Feature Development

1. Create feature branches from `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Branch naming conventions:
   - `feature/`: New features (e.g., `feature/ai-story-gen`)
   - `fix/`: Bug fixes (e.g., `fix/auth-validation`)
   - `docs/`: Documentation updates (e.g., `docs/api-guide`)
   - `refactor/`: Code refactoring (e.g., `refactor/auth-module`)

## Commit Guidelines

### Commit Message Format

```
[Type] Brief description

Detailed explanation if needed
```

### Types

- `[Feature]`: New functionality
- `[Fix]`: Bug fixes
- `[Docs]`: Documentation changes
- `[Style]`: Code style/formatting changes
- `[Refactor]`: Code refactoring
- `[Test]`: Adding or modifying tests
- `[Chore]`: Maintenance tasks

### Examples

```
[Feature] Add email verification system

- Implement SendGrid integration
- Add verification templates
- Create email verification routes
```

```
[Fix] Correct database migration issues

- Update SQLite configuration
- Fix path resolution
- Add missing environment variables
```

## Pull Request Process

### 1. Before Creating PR

- Ensure all tests pass
- Update documentation if needed
- Rebase on latest `develop`
- Resolve conflicts if any

### 2. PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Code refactoring

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Tests passing
- [ ] Merge conflicts resolved
```

### 3. Review Process

- At least one approval required
- All comments must be resolved
- CI/CD checks must pass
- No merge conflicts

## Release Process

### 1. Version Tagging

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Tag releases in `main` branch
- Update CHANGELOG.md

### 2. Release Flow

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 3. Hotfix Process

1. Create hotfix branch from `main`:
   ```bash
   git checkout main
   git checkout -b hotfix/issue-description
   ```
2. After fixing:
   ```bash
   git checkout main
   git merge hotfix/issue-description
   git checkout develop
   git merge hotfix/issue-description
   ```

## Best Practices

### 1. Keep Branches Updated

```bash
git checkout develop
git pull origin develop
git checkout your-feature-branch
git rebase develop
```

### 2. Commit Frequently

- Make small, focused commits
- Keep related changes together
- Commit working code only

### 3. Code Review Guidelines

- Review for:
  - Code quality
  - Test coverage
  - Documentation
  - Security concerns
  - Performance impact

### 4. Branch Cleanup

- Delete merged feature branches
- Regularly clean up local branches
- Keep remote repository clean

## Git Hooks

### Pre-commit Hook

```bash
#!/bin/sh
# Run linting
python -m flake8
# Run tests
python -m pytest tests/
```

### Pre-push Hook

```bash
#!/bin/sh
# Run full test suite
python -m pytest
# Check for sensitive data
git secrets --scan
```

## Troubleshooting

### Common Issues

1. Merge Conflicts

   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-branch
   git rebase develop
   # Resolve conflicts
   git rebase --continue
   ```

2. Reverting Changes

   ```bash
   # Revert last commit
   git revert HEAD

   # Revert specific commit
   git revert commit-hash
   ```

3. Stashing Changes

   ```bash
   # Stash changes
   git stash save "work in progress"

   # Apply stashed changes
   git stash pop
   ```

```
</rewritten_file>
```
