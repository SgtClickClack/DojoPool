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

_Last updated: 2025-08-01_

---

## Project-specific Quickstart (verified 2025-08-24 02:03 local)

This section captures verified, repo-specific steps and caveats for advanced contributors. All commands are PowerShell-friendly for Windows.

### Build and Development

- Node version: 20.x (package type: module). Ensure `node -v` >= 20.
- Install deps: `npm ci` (prefer CI install for deterministic lockfile resolution).
- Environment checks:
  - `npm run env:check` (non-strict) validates required env; used by `npm run dev`.
  - `npm run env:check:strict` is used by `npm run preview` and should pass before prod preview.
  - Relevant files: `config.env`, `[ENV].flaskenv`.
- Dev (Vite + backend): `npm run dev`
  - Spins up frontend via Vite (port 3000) and backend TypeScript watcher + Nodemon (port 8080 per proxy assumptions). See scripts in package.json. As of 2025-08-24, there is no root `vite.config.ts`; dev runs with Vite defaults.
  - If Node processes hang on Windows, run `npm run cleanup:node:win`.
- Dev (Next.js only, optional): `npm run dev:next -p 3001` (already baked: `dev:next` uses 3001).
- Production build (Next.js):
  - Build: `npm run build`
  - Preview: `npm run preview` (runs Next on the built output with strict env check).
  - Next.js production specifics (from next.config.js):
    - API proxy: rewrites for `/api/:path*` to `${API_BASE_URL || 'http://localhost:3002'}/api/:path*`; `/healthcheck` -> `/api/health`.
    - Security headers: HSTS, X-Frame-Options=DENY, CSP with strict defaults; Permissions-Policy; CORS headers for `/api/:path*`.
    - Images: domains `localhost`, `dojopool.com.au`; formats `webp`, `avif`; output `standalone`.
    - Webpack tuning on Windows: watchOptions polling and splitChunks vendor/mui groups; increased performance limits.
- Docker: `docker build -t dojopool .` (multi-stage build consolidates frontend + Flask via Nginx/Supervisor, exposes 5000).

Notes:

- Path aliases: In Vite/Vitest, `@` resolves to `/src`. TypeScript paths (tsconfig.json) map `@/*` to `src/*`, `src/frontend/*`, and `src/dojopool/frontend/*`.
- Module format: ESM. Use `import` syntax. For CJS interop, prefer dynamic `import()` in Node scripts.

### Testing (Vitest)

- Primary command: `npm test` maps to `vitest run --config vitest.unit.config.ts`.
- Unit test config: `vitest.unit.config.ts`
  - Environment: `jsdom`
  - Setup file: `src/tests/setup.ts` (mocks: fetch via whatwg-fetch, localStorage/sessionStorage, WebSocket, matchMedia, Intersection/ResizeObservers, rAF/cAF).
  - Include pattern: `src/tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
  - Excludes several heavy/flaky files by path (see config for the list). Keep this in mind when adding new tests.
  - Coverage output: `coverage/js/unit` (v8 provider).
- Integration test config: `vitest.integration.config.ts`
  - Environment: `node`
  - Setup: `src/tests/setup-integration.ts`
  - Include: `src/tests/integration/**/*.{test,spec}.{ts,tsx}`
  - Coverage output: `coverage/js/integration`.
- Global config: `vitest.config.ts` exists for broader patterns, but CI and `npm test` intentionally target the unit config by default.

Common commands:

- Run all unit tests: `npm test`
- Run a specific test: `npm test -- src\tests\unit\SomeFile.test.ts`
- Watch mode: `npm run test:watch`
- Coverage (unit): `npm run test:coverage`
- Integration: `npm run test:int` (coverage: `npm run test:int:coverage`)
- Full CI matrix: `npm run test:ci` (unit+integration with coverage)
- UI runner: `npm run test:ui`

Add new tests:

- Unit: place under `src/tests/unit/` using `.test.ts`/`.test.tsx`. DOM/component tests should use React Testing Library (`@testing-library/react`) and rely on jsdom + the provided mocks.
- Integration: place under `src/tests/integration/` targeting Node runtime; avoid DOM globals.
- Use the `@` alias for imports from `src/` and prefer stable, deterministic data. If a test relies on timers or random, use `vi.useFakeTimers()` or seed randomness.

Verified smoke test (demonstration):

- We validated the test runner and setup by creating a temporary file at `src\tests\unit\junie.smoke.test.ts` and executing it as follows:

```powershell
npm test -- src\tests\unit\junie.smoke.test.ts
```

- Example content used (passed locally 2025-08-24 02:03):

```ts
import { describe, it, expect } from 'vitest';

describe('Junie smoke test (unit, 2025-08-24)', () => {
  it('sanity: arithmetic and environment stubs are present', () => {
    expect(1 + 1).toBe(2);
    expect(typeof (globalThis as any).fetch).toBe('function');
    expect(typeof (globalThis as any).localStorage).toBe('object');
    expect(typeof (globalThis as any).sessionStorage).toBe('object');
    expect(typeof (globalThis as any).WebSocket).toBe('function');
  });
});
```

- Outcome (2025-08-24 02:03): 1 passed, confirming jsdom + setup mocks are active. The file has been removed after verification to keep the repository clean.

### Advanced Notes / Pitfalls

- Windows paths: When running a single test, use backslashes in PowerShell (e.g., `src\tests\unit\File.test.ts`).
- Known flaky tests are excluded in `vitest.unit.config.ts`. Do not rely on those for CI; stabilize and remove from exclude before enabling.
- Ports: Ensure 3000 (Vite), 3001 (Next dev), 5000 (Flask), 8080 (Node dev) are free.
- Backend build: TypeScript backend compiles with `tsconfig.backend.json` to `dist/backend`. The dev script watches and executes from `dist/backend` via Nodemon.
- Lint/format/type-check:
  - `npm run lint`, `npm run lint:fix`
  - `npm run format` / `npm run format:check`
  - `npm run type-check` (splits into `type-check:web` and `type-check:api`).
- Troubleshooting:
  - If dev server doesn’t reflect changes, ensure `concurrently` hasn’t left orphaned processes; run `npm run cleanup:node:win`.
  - If Next build fails due to env, run `npm run env:check:strict` and verify `config.env` / `[ENV].flaskenv`.
- ESM nuances: The repo uses ESM (`"type": "module"`). Prefer `import` and avoid bare `require` in Node scripts unless using dynamic `import()` or transpiling.
