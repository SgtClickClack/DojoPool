# 🔧 DojoPool Troubleshooting Guide

This guide helps you resolve common issues encountered during DojoPool development setup, runtime, and deployment.

---

## 📋 Table of Contents

1. [Environment Setup Issues](#environment-setup-issues)
2. [Database Problems](#database-problems)
3. [Frontend Development Issues](#frontend-development-issues)
4. [Backend API Issues](#backend-api-issues)
5. [Build & Deployment Problems](#build--deployment-problems)
6. [Testing Issues](#testing-issues)
7. [Performance Problems](#performance-problems)
8. [Getting Help](#getting-help)

---

## 🛠 Environment Setup Issues

### Node.js Version Conflicts

**Problem**: `yarn dev` fails with version errors

**Symptoms**:

```
error @typescript-eslint/eslint-plugin@8.30.1: The engine "node" is incompatible with this module. Expected version ">=20.0.0".
```

**Solutions**:

#### Windows (nvm-windows)

```powershell
# Check current version
node --version

# Install correct version
nvm install 20
nvm use 20

# Verify
node --version
# Should output: v20.x.x

# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install
```

#### macOS/Linux (nvm)

```bash
# Install Node 20
nvm install 20
nvm use 20

# Set as default
nvm alias default 20

# Verify
node --version
```

#### Using Volta (Alternative)

```bash
# Install Volta
curl https://get.volta.sh | bash

# Pin Node version
volta pin node@20

# Verify
node --version
```

### Yarn Installation Issues

**Problem**: `yarn` command not found

**Solutions**:

#### Global Installation

```bash
# Install globally
npm install -g yarn

# Or using Corepack (Node 16.10+)
corepack enable
corepack prepare yarn@stable --activate
```

#### Windows Chocolatey

```powershell
choco install yarn
```

#### Verify Installation

```bash
yarn --version
# Should output: 4.x.x
```

### Python Environment Issues

**Problem**: Python dependencies fail to install

**Symptoms**:

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solutions**:

#### Create Virtual Environment

```bash
# Create venv
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Update pip

```bash
python -m pip install --upgrade pip
```

#### Python Path Issues (Windows)

```powershell
# Add Python to PATH
$env:Path += ";C:\Python311;C:\Python311\Scripts"

# Or use py launcher
py -3.11 -m pip install -r requirements.txt
```

### PostgreSQL Connection Issues

**Problem**: Database connection fails

**Symptoms**:

```
Error: P1001: Can't reach database server
```

**Solutions**:

#### Check PostgreSQL Status

```bash
# Windows Service
Get-Service postgresql*

# macOS (Homebrew)
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

#### Start PostgreSQL

```bash
# Windows
net start postgresql-x64-13

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

#### Reset Database

```bash
# Drop and recreate
dropdb dojopool
createdb dojopool

# Run migrations
cd services/api
npx prisma migrate reset
npx prisma generate
```

#### Connection String Issues

```bash
# Check .env file
DATABASE_URL="postgresql://username:password@localhost:5432/dojopool?schema=public"

# Test connection
psql -h localhost -U username -d dojopool
```

### Redis Connection Issues

**Problem**: Redis connection fails

**Symptoms**:

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions**:

#### Start Redis Server

```bash
# Windows (Service)
net start redis

# macOS (Homebrew)
brew services start redis

# Linux
sudo systemctl start redis-server
```

#### Check Redis Status

```bash
redis-cli ping
# Should respond: PONG
```

#### Configuration Issues

```bash
# Check .env
REDIS_URL=redis://localhost:6379

# Test connection
redis-cli -h localhost -p 6379
```

---

## 🗄 Database Problems

### Prisma Migration Issues

**Problem**: Migrations fail to apply

**Symptoms**:

```
Error: P3009: migrate found failed migrations
```

**Solutions**:

#### Reset Migrations

```bash
cd services/api

# Reset database and migrations
npx prisma migrate reset

# Or mark as applied
npx prisma migrate resolve --applied <migration-id>
```

#### Manual Migration

```bash
# Generate SQL
npx prisma migrate dev --create-only

# Apply manually
npx prisma db push
```

#### Schema Issues

```bash
# Validate schema
npx prisma validate

# Generate client
npx prisma generate
```

### Database Seeding Issues

**Problem**: Seed script fails

**Solutions**:

#### Run Seed Manually

```bash
cd services/api

# Direct execution
npx ts-node prisma/seed.ts

# Or through Prisma
npx prisma db seed
```

#### Check Seed File

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Your seed data
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Data Corruption Issues

**Problem**: Inconsistent database state

**Solutions**:

#### Backup First

```bash
# Create backup
pg_dump dojopool > backup.sql
```

#### Reset and Restore

```bash
# Reset database
npx prisma migrate reset

# Restore from backup if needed
psql dojopool < backup.sql
```

#### Clean State

```bash
# Clear all data
npx prisma db push --force-reset

# Re-seed
npx prisma db seed
```

---

## 🎨 Frontend Development Issues

### Hot Reload Not Working

**Problem**: Changes don't reflect in browser

**Solutions**:

#### Clear Next.js Cache

```bash
rm -rf apps/web/.next
rm -rf node_modules/.cache
```

#### Restart Development Server

```bash
# Kill existing processes
pkill -f "next dev"

# Restart
yarn dev
```

#### Check File Watching

```bash
# Some systems need polling
NEXT_WEBPACK_USEPOLLING=1 yarn dev
```

### TypeScript Errors

**Problem**: Type checking fails

**Solutions**:

#### Clear TypeScript Cache

```bash
rm -rf node_modules/.cache/tsconfig.tsbuildinfo
```

#### Check TypeScript Version

```bash
npx tsc --version
# Should be 5.8.3 or compatible
```

#### Type Declaration Issues

```bash
# Reinstall type definitions
yarn add -D @types/react @types/node

# Or update all types
yarn add -D @types/*
```

### Import Resolution Issues

**Problem**: Module not found errors

**Solutions**:

#### Check tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"]
    }
  }
}
```

#### Rebuild Dependencies

```bash
rm -rf node_modules yarn.lock
yarn install
```

### Build Failures

**Problem**: Production build fails

**Solutions**:

#### Memory Issues

```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" yarn build
```

#### Type Checking

```bash
# Skip type checking for build (temporary)
SKIP_ENV_VALIDATION=1 yarn build
```

#### Bundle Analysis

```bash
# Analyze bundle size
yarn build:analyze
```

---

## 🚀 Backend API Issues

### Port Already in Use

**Problem**: `EADDRINUSE` error

**Solutions**:

#### Find Process Using Port

```bash
# Find process (macOS/Linux)
lsof -i :3002

# Windows
netstat -ano | findstr :3002
```

#### Kill Process

```bash
# macOS/Linux
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

#### Change Port

```bash
# In .env
PORT=3003

# Or use different port
yarn dev:backend --port 3003
```

### CORS Issues

**Problem**: Frontend can't connect to API

**Solutions**:

#### Check CORS Configuration

```typescript
// services/api/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

#### Environment Variables

```bash
# .env
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
```

### Authentication Issues

**Problem**: JWT tokens not working

**Solutions**:

#### Check JWT Secret

```bash
# .env
JWT_SECRET=your-very-secure-secret-here-min-32-chars

# Generate secure secret
openssl rand -hex 32
```

#### Token Expiration

```typescript
// Check token expiry
const decoded = jwt.verify(token, secret);
// Handle expiry gracefully
```

### WebSocket Connection Issues

**Problem**: Real-time features not working

**Solutions**:

#### Check Socket.IO Configuration

```typescript
// services/api/src/app.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
```

#### Redis Adapter Issues

```typescript
// Check Redis connection for Socket.IO
import { RedisAdapter } from '@socket.io/redis-adapter';

// Ensure Redis is running and accessible
```

---

## 🏗 Build & Deployment Problems

### Vercel Deployment Issues

**Problem**: Deployment fails on Vercel

**Solutions**:

#### Build Command Issues

```bash
# Check build locally first
yarn build

# Ensure all dependencies are in package.json
# Check for missing peer dependencies
```

#### Environment Variables

```bash
# Set in Vercel dashboard:
DATABASE_URL=...
JWT_SECRET=...
NEXT_PUBLIC_API_URL=...
```

#### Build Configuration

```json
// vercel.json
{
  "buildCommand": "yarn build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Docker Build Issues

**Problem**: Docker build fails

**Solutions**:

#### Base Image Issues

```dockerfile
# Use compatible Node version
FROM node:20-alpine

# Install dependencies first (better caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
```

#### Build Context

```bash
# Build from correct directory
docker build -f Dockerfile .

# Or specify build context
docker build -f services/api/Dockerfile services/api
```

### CI/CD Pipeline Issues

**Problem**: GitHub Actions fail

**Solutions**:

#### Check Workflow Configuration

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: yarn install
      - run: yarn test:ci
```

#### Cache Issues

```yaml
# Add caching for dependencies
- uses: actions/cache@v3
  with:
    path: |
      node_modules
      .next/cache
    key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
```

---

## 🧪 Testing Issues

### Test Failures

**Problem**: Tests fail unexpectedly

**Solutions**:

#### Clear Test Cache

```bash
# Jest/Vitest cache
yarn test --clearCache

# Cypress cache
rm -rf node_modules/.cache/Cypress
```

#### Environment Issues

```bash
# Set test environment
NODE_ENV=test yarn test

# Check database for tests
npx prisma migrate reset --force
```

### Coverage Issues

**Problem**: Coverage reports inaccurate

**Solutions**:

#### Configuration Check

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

#### Source Maps

```bash
# Enable source maps for better coverage
NODE_OPTIONS="--enable-source-maps" yarn test:coverage
```

### Cypress Issues

**Problem**: E2E tests fail

**Solutions**:

#### Browser Issues

```bash
# Run in headless mode
yarn cypress:run

# Or specify browser
yarn cypress:run --browser chrome
```

#### Environment Setup

```bash
# Ensure dev server is running
yarn dev

# Check base URL in cypress.config.js
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
  },
})
```

---

## ⚡ Performance Problems

### Slow Development Server

**Problem**: `yarn dev` is slow

**Solutions**:

#### Webpack Configuration

```typescript
// next.config.js
module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};
```

#### Resource Monitoring

```bash
# Check system resources
top  # Linux/macOS
# Windows: Task Manager

# Monitor Node process
ps aux | grep node
```

### Memory Leaks

**Problem**: Application consumes too much memory

**Solutions**:

#### Memory Profiling

```bash
# Use Node.js inspector
node --inspect apps/web/server.js

# Or use clinic.js
npm install -g clinic
clinic heapprofiler -- yarn dev
```

#### Bundle Analysis

```bash
# Analyze bundle size
yarn build:analyze

# Check for large dependencies
npx webpack-bundle-analyzer
```

### Database Performance

**Problem**: Slow database queries

**Solutions**:

#### Query Optimization

```typescript
// Use Prisma's query optimization
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    // Only select needed fields
  },
  where: {
    // Add proper indexes
  },
});
```

#### Connection Pooling

```typescript
// Check connection pool settings
DATABASE_URL =
  'postgresql://user:pass@host:port/db?connection_limit=10&pool_timeout=0';
```

---

## 🆘 Getting Help

### Quick Debugging Steps

1. **Check Logs**

   ```bash
   # Development logs
   yarn dev 2>&1 | tee dev.log

   # API logs
   cd services/api && yarn start:dev 2>&1 | tee api.log
   ```

2. **Verify Environment**

   ```bash
   # Check versions
   node --version
   yarn --version
   python --version

   # Check services
   redis-cli ping
   psql -c "SELECT version();"
   ```

3. **Clean Restart**

   ```bash
   # Stop all processes
   pkill -f "node\|yarn\|next"

   # Clear caches
   rm -rf node_modules/.cache .next

   # Restart
   yarn install && yarn dev
   ```

### Common Logs to Check

- **Next.js Logs**: Build errors, hydration issues
- **NestJS Logs**: API errors, database connection issues
- **Prisma Logs**: Database migration and query issues
- **Browser Console**: Client-side errors

### When to Ask for Help

- **Issue persists** after trying solutions above
- **Error messages** are unclear or cryptic
- **System-specific issues** (environment differences)
- **Complex integration problems**

### Support Resources

- **GitHub Issues**: Search existing issues first
- **Discord Community**: Real-time help in #development
- **Team Standup**: Daily sync for blockers
- **Documentation**: Check docs/ folder for updates

---

## 🚨 Emergency Procedures

### Complete Environment Reset

**When everything fails, start fresh:**

```bash
# 1. Stop all processes
pkill -f "node\|yarn\|next\|redis\|postgres"

# 2. Clean everything
rm -rf node_modules yarn.lock .next dist
rm -rf services/api/node_modules services/api/dist

# 3. Reset database
dropdb dojopool 2>/dev/null || true
createdb dojopool

# 4. Fresh install
yarn install
cd services/api && yarn install

# 5. Setup database
npx prisma migrate reset
npx prisma generate

# 6. Start fresh
yarn dev
```

### Production Incident Response

1. **Assess Impact**: Check affected users/features
2. **Rollback**: Deploy previous working version
3. **Investigate**: Check logs and monitoring
4. **Fix**: Implement solution with tests
5. **Deploy**: Gradual rollout with monitoring

---

Remember: Most issues have been encountered before. Check the documentation, search existing issues, and don't hesitate to ask the team for help! 🎱
