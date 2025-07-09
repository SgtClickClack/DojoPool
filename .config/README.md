# DojoPool Configuration Directory

This directory contains all configuration files organized by purpose:

## Directory Structure

### `/environment/` - Environment Variables
- `[ENV].env.example` - Example environment variables
- `[ENV].env.production` - Production environment configuration
- `[ENV].env.test` - Test environment configuration

### `/build/` - Build & Development Tools
- `[CONFIG].babelrc` - Babel configuration
- `jest.config.js` - Jest testing configuration
- `jest.security.config.js` - Security testing configuration
- `eslint.config.mjs` - ESLint linting configuration
- `lighthouserc.js` - Lighthouse performance testing
- `mypy.ini` - Python type checking configuration
- `[CONFIG]tsconfig.json` - TypeScript configuration
- `[CONFIG]setup.cfg` - Python setup configuration
- `[FMT].prettierrc` - Code formatting configuration
- `vite.config.ts` - Vite build tool configuration
- `next.config.js` - Next.js configuration
- `performance.config.js` - Performance monitoring configuration
- `cypress.config.ts` - Cypress testing configuration
- `pytest.ini` - Python testing configuration
- `pyrightconfig.json` - Python type checking configuration

### `/database/` - Database & Data
- `prisma/` - Prisma ORM configuration and schema
- `migrations/` - Database migration files
- `init.sql` - Database initialization script

### `/deployment/` - Deployment & Infrastructure
- `docker-compose*.yml` - Docker compose configurations
- `[DOCKER]Dockerfile` - Docker container configuration
- `[DOCKER].dockerignore` - Docker ignore patterns
- `nginx/` - Nginx web server configuration
- `[FB].firebaserc` - Firebase project configuration
- `firebase.json` - Firebase hosting configuration
- `firestore.indexes.json` - Firestore database indexes
- `firestore.rules` - Firestore security rules

## Migration Notes

All configuration files have been moved from the root directory to maintain better organization. Update your scripts and documentation to reference the new paths:

**Before**: `./jest.config.js`  
**After**: `./.config/build/jest.config.js`

**Before**: `./docker-compose.yml`  
**After**: `./.config/deployment/docker-compose.yml`

## Path Updates Required

When referencing these config files in scripts or other configurations, use the new paths:

```bash
# Updated paths for common commands:
npm test                    # Uses .config/build/jest.config.js
docker-compose up           # Uses .config/deployment/docker-compose.yml
prisma generate             # Uses .config/database/prisma/schema.prisma
eslint --config .config/build/eslint.config.mjs
```