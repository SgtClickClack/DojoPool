# Contributing to DojoPool

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Style](#code-style)
4. [Testing](#testing)
5. [Performance](#performance)
6. [Accessibility](#accessibility)
7. [Security](#security)
8. [Documentation](#documentation)
9. [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Git

### Installation
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/dojopool.git
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

## Development Setup

### Running the Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Running Tests
```bash
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
npm run test:a11y   # Run accessibility tests
```

## Code Style

We use ESLint and Prettier for code formatting. Our style guide extends from:
- Airbnb JavaScript Style Guide
- React/JSX Style Guide
- TypeScript ESLint Recommended

### Running Linter
```bash
npm run lint        # Check code style
npm run lint:fix    # Fix code style issues
```

### Key Style Points
- Use TypeScript for type safety
- Follow functional programming principles
- Use React hooks for state management
- Write meaningful component and function names
- Keep components small and focused
- Use proper prop types and interfaces

## Testing

### Unit Tests
- Write tests for all new features
- Maintain 80% or higher coverage
- Follow the AAA pattern (Arrange, Act, Assert)
- Use meaningful test descriptions
- Mock external dependencies

### Integration Tests
- Test component interactions
- Verify data flow
- Test error scenarios
- Check boundary conditions

### Accessibility Tests
- Run axe-core tests
- Test with screen readers
- Verify keyboard navigation
- Check color contrast
- Test with different viewport sizes

## Performance

### Monitoring
- Use the PerformanceMonitor service
- Track Core Web Vitals
- Monitor memory usage
- Check network performance
- Profile render times

### Optimization
- Lazy load components
- Optimize images
- Minimize bundle size
- Use proper caching
- Implement code splitting

## Accessibility

### Requirements
- Follow WCAG 2.1 Level AA guidelines
- Use semantic HTML
- Provide proper ARIA labels
- Ensure keyboard navigation
- Support screen readers
- Maintain proper color contrast

### Testing Tools
- axe-core
- WAVE
- Lighthouse
- VoiceOver/NVDA
- Color contrast analyzers

## Security

### Guidelines
- Follow OWASP security practices
- Implement proper authentication
- Use CSRF protection
- Validate user input
- Sanitize data output
- Use secure dependencies

### Testing
- Run security audits
- Perform penetration testing
- Check for vulnerabilities
- Review access controls
- Validate data encryption

## Documentation

### Code Documentation
- Write clear comments
- Document complex logic
- Explain business rules
- Provide usage examples
- Keep documentation updated

### API Documentation
- Document all endpoints
- Provide request/response examples
- List error codes
- Explain authentication
- Include rate limits

## Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes:
   - Write code
   - Add tests
   - Update documentation
   - Run linter
   - Run tests

3. Commit your changes:
   ```bash
   git commit -m "feat: add your feature description"
   ```
   Follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request:
   - Use the PR template
   - Link related issues
   - Provide clear description
   - Add screenshots if relevant
   - Request reviews

### PR Checklist
- [ ] Code follows style guide
- [ ] Tests are passing
- [ ] Documentation is updated
- [ ] Accessibility is verified
- [ ] Performance is optimized
- [ ] Security is reviewed
- [ ] Changes are tested
- [ ] PR is linked to issue

### Review Process
1. Automated checks must pass
2. Two approvals required
3. All comments addressed
4. Documentation updated
5. Tests added/updated
6. Performance verified

## Questions?

Join our [Discord channel](https://discord.gg/dojopool) for help and discussions. 