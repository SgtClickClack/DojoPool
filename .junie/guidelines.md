# DojoPool Development Guidelines

## Project Architecture

DojoPool is a complex gaming platform with AI-driven features, real-time capabilities, and blockchain integration. The project uses a hybrid architecture:

- **Frontend**: Next.js 15.3.5 with React 18.2.0, TypeScript, and modern UI libraries (Chakra UI, Material-UI, Ant Design)
- **Backend**: Node.js/Express with TypeScript, plus Flask components for Python services
- **AI/ML**: TensorFlow.js for client-side ML, OpenAI integration for AI services
- **Real-time**: WebSocket support with Socket.io
- **Database**: MongoDB with Mongoose, Prisma ORM support
- **3D Graphics**: Three.js with React Three Fiber for 3D game elements

## Build & Configuration

### Development Environment Setup

1. **Node.js Requirements**: Node.js 20+ (as specified in Dockerfile)
2. **Package Manager**: npm (package-lock.json present)
3. **TypeScript**: Version 5.8.3 with strict mode enabled

### Build Systems

The project uses **dual build systems**:

#### Next.js (Production)
```bash
npm run build    # Build for production
npm run preview  # Preview production build
```
- API proxy to Flask backend on port 5000
- Optimized webpack configuration with code splitting
- Security headers and CORS configuration
- Image optimization with WebP/AVIF support

#### Vite (Development)
```bash
npm run dev      # Start development with concurrent frontend/backend
```
- API proxy to backend on port 8080
- Hot module replacement
- Faster development builds

### Environment Configuration

- **Frontend Port**: 3000 (Vite), Next.js uses default
- **Backend Port**: 5000 (Flask), 8080 (Node.js dev server)
- **Path Aliases**: `@/*` maps to `./src/*`
- **Module System**: ESNext with ES modules

### Docker Deployment

Multi-stage Docker build:
```bash
docker build -t dojopool .
```
- Frontend build stage with Node.js 20-alpine
- Python backend with Flask/Gunicorn
- Nginx + Supervisor for production serving
- Exposes port 5000

## Testing Infrastructure

### Primary Testing Framework: Vitest

**Configuration**: `vitest.config.ts`
- Environment: jsdom for DOM testing
- Setup file: `src/tests/setup.ts`
- Global test utilities enabled

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui

# CI mode
npm run test:ci
```

### Test Setup & Mocking

The test environment includes comprehensive mocking:
- **Browser APIs**: IntersectionObserver, ResizeObserver, matchMedia
- **Storage**: localStorage, sessionStorage
- **Network**: fetch, WebSocket
- **Animation**: requestAnimationFrame, cancelAnimationFrame
- **Console**: Mocked console methods for clean test output

### Writing Tests

Example test structure:
```typescript
import { describe, it, expect } from 'vitest';

describe('Component/Service Name', () => {
  it('should test specific functionality', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Adding New Tests

1. Create test files with `.test.ts` or `.test.tsx` extension
2. Place in appropriate directory structure under `src/`
3. Import from `vitest` for test utilities
4. Use React Testing Library for component tests
5. Follow existing patterns in `src/tests/` directory

## Development Guidelines

### Code Style & Linting

```bash
npm run lint        # Check code style
npm run lint:fix    # Auto-fix linting issues
npm run format      # Format code with Prettier
npm run type-check  # TypeScript type checking
```

### Project Structure

Key directories:
- `src/ai/` - AI and ML services
- `src/backend/` - Node.js backend services
- `src/components/` - Reusable React components
- `src/services/` - Business logic services
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `src/tests/` - Test files and setup

### Security Considerations

- CSRF protection with `csrf-csrf`
- Rate limiting with `express-rate-limit`
- Input validation with `express-validator`
- Security headers via Helmet
- Content Security Policy configured

### Performance Optimization

- Code splitting configured in webpack
- Image optimization with Sharp
- Compression middleware
- Redis for caching and sessions
- Monitoring with Prometheus metrics

### Database & State Management

- **MongoDB**: Primary database with Mongoose ODM
- **Prisma**: Alternative ORM support
- **Redis**: Caching and session storage
- **React Query**: Client-side state management
- **Context API**: Global state management

### AI/ML Integration

- **TensorFlow.js**: Client-side machine learning
- **OpenAI API**: AI-powered features
- **Custom AI Services**: Located in `src/ai/` directory

### Real-time Features

- **Socket.io**: WebSocket communication
- **Real-time Match Tracking**: Live game updates
- **Tournament Analytics**: Real-time statistics

## Debugging & Troubleshooting

### Common Issues

1. **Dependency Conflicts**: The project has some peer dependency warnings with Three.js versions. These are non-critical but should be monitored.

2. **Port Conflicts**: Ensure ports 3000, 5000, and 8080 are available for development.

3. **Environment Variables**: Check `.flaskenv` and environment configuration for required variables.

### Development Tools

- **WebStorm/VS Code**: TypeScript support configured
- **Git Hooks**: Pre-commit hooks configured with `.pre-commit-config.yaml`
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting

### Monitoring & Logging

- **Winston**: Structured logging
- **Prometheus**: Metrics collection
- **Custom monitoring**: Located in `src/monitoring/`

## Additional Notes

- The project supports both development and production environments with different configurations
- Firebase integration available for additional backend services
- Blockchain integration with Ethers.js for Web3 features
- Comprehensive error handling and validation throughout the application
- Modular architecture allows for easy feature additions and maintenance

---

*Last updated: 2025-08-01*