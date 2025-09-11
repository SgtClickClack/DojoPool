# 🎱 DojoPool Developer Onboarding Guide

Welcome to the DojoPool development team! This comprehensive guide will get you up and running with our hybrid pool gaming platform that combines physical gameplay with digital technology, AI, and blockchain.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites & System Setup](#prerequisites--system-setup)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Architecture & Tech Stack](#project-architecture--tech-stack)
5. [Getting Started Workflow](#getting-started-workflow)
6. [Development Workflow & Best Practices](#development-workflow--best-practices)
7. [Testing Strategy](#testing-strategy)
8. [Deployment & CI/CD](#deployment--cicd)
9. [Troubleshooting & Common Issues](#troubleshooting--common-issues)
10. [Resources & Support](#resources--support)

---

## 🎯 Project Overview

**DojoPool** is an innovative platform that transforms traditional pool venues into "Dojos" - smart, connected gaming spaces. It merges physical pool gaming with digital technology, AI, and blockchain to create a hybrid gaming experience.

### Key Features

- **Real-time Pool Tracking**: AI-powered ball detection and shot analysis
- **Territory Control System**: Claim and defend virtual territories in physical venues
- **Tournament Management**: Live brackets, prize pools, and cross-chain support
- **AI-Powered Coaching**: Computer vision analysis with real-time feedback
- **Blockchain Integration**: NFT ownership, Dojo Coin transactions, multi-chain wallets
- **Social Features**: Player profiles, clans, achievements, and leaderboards

### Tech Stack Overview

- **Frontend**: Next.js 15, React 18, TypeScript, Material-UI, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis
- **AI Services**: Python FastAPI, TensorFlow.js, Computer Vision
- **Infrastructure**: Docker, Kubernetes, Vercel, WebSockets
- **Blockchain**: Ethereum, Solana, multi-chain wallet integration

---

## 🛠 Prerequisites & System Setup

### Required Software

#### Core Requirements

- **Node.js**: v20.x (managed via `.nvmrc`)
- **Yarn**: v4.x (package manager)
- **Python**: v3.11+ (for AI services)
- **PostgreSQL**: v13+ (database)
- **Redis**: v6+ (caching & sessions)
- **Git**: Latest version

#### Development Tools

- **Visual Studio Code** (recommended IDE)
- **Docker & Docker Compose** (for local development)
- **GitHub CLI** (optional, for enhanced Git workflow)

### Windows-Specific Setup

#### 1. Install Node.js via nvm-windows

```powershell
# Download and install nvm-windows from https://github.com/coreybutler/nvm-windows
nvm install 20
nvm use 20
```

#### 2. Install Yarn

```powershell
npm install -g yarn
```

#### 3. Install PostgreSQL

- Download from: https://www.postgresql.org/download/windows/
- Or use chocolatey: `choco install postgresql`

#### 4. Install Redis

```powershell
# Using chocolatey
choco install redis-64

# Or download from: https://redis.io/download
```

#### 5. Install Python

- Download from: https://python.org/downloads/
- Ensure pip is installed and upgraded

#### 6. Configure Environment Variables

```powershell
# Add to your PowerShell profile or system environment variables
$env:Path += ";C:\Program Files\PostgreSQL\bin"
$env:Path += ";C:\Program Files\Redis"
```

### macOS/Linux Setup

#### Using Homebrew (macOS)

```bash
# Install core dependencies
brew install node yarn python postgresql redis git

# Start services
brew services start postgresql
brew services start redis
```

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install other dependencies
sudo apt install yarn python3 postgresql redis-server git

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server
```

---

## 🚀 Development Environment Setup

### Step 1: Clone the Repository

```bash
# Clone the monorepo
git clone https://github.com/your-org/dojopool.git
cd dojopool

# Ensure you're on the main development branch
git checkout dev
git pull origin dev
```

### Step 2: Install Dependencies

```bash
# Install all workspace dependencies
yarn install --immutable

# Verify installation
yarn --version
node --version
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your local configuration
# Minimum required variables:
DATABASE_URL="postgresql://username:password@localhost:5432/dojopool"
JWT_SECRET="your-super-secret-jwt-key-here"
NEXT_PUBLIC_API_URL="http://localhost:3002/api/v1"
REDIS_URL="redis://localhost:6379"
```

### Step 4: Database Setup

```bash
# Create PostgreSQL database
createdb dojopool

# Navigate to API service
cd services/api

# Install Prisma CLI if not already installed
yarn add -D prisma

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed
```

### Step 5: Start Development Servers

```bash
# From project root, start all services
yarn dev

# This will start:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3002
# - Redis: localhost:6379
# - PostgreSQL: localhost:5432
```

### Step 6: Verify Setup

```bash
# Test API endpoints
curl http://localhost:3002/api/v1/health

# Test frontend
open http://localhost:3000

# Check database connection
cd services/api && npx prisma studio
```

---

## 🏗 Project Architecture & Tech Stack

### Monorepo Structure

```
dojopool/
├── apps/                    # Frontend applications
│   └── web/                 # Next.js frontend
├── services/                # Backend services
│   ├── api/                 # NestJS API service
│   └── ai-vision/           # Python AI services
├── packages/                # Shared packages
│   ├── ui/                  # Shared UI components
│   ├── config/              # Shared configurations
│   ├── types/               # TypeScript type definitions
│   └── prisma/              # Database schema & migrations
├── docs/                    # Documentation
├── scripts/                 # Build & utility scripts
└── tests/                   # End-to-end tests
```

### Service Architecture

#### Frontend (Next.js)

- **Framework**: Next.js 15 with App Router
- **State Management**: TanStack Query + Zustand
- **Styling**: Tailwind CSS + Material-UI
- **Maps**: Mapbox GL JS integration
- **Real-time**: Socket.IO client

#### Backend (NestJS)

- **Framework**: NestJS with modular architecture
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for sessions and caching
- **Authentication**: JWT with session-JWT hybrid
- **Real-time**: Socket.IO with Redis adapter
- **Validation**: Zod schemas

#### AI Services (Python)

- **Framework**: FastAPI
- **Computer Vision**: OpenCV + TensorFlow
- **AI Models**: Custom models for ball tracking and analysis
- **Integration**: gRPC/HTTP with main API

### Key Design Patterns

1. **Feature-based Architecture**: Components organized by feature, not technology
2. **Shared Types**: TypeScript types generated from OpenAPI schemas
3. **Dependency Injection**: NestJS modules for clean architecture
4. **Event-driven**: Redis streams for cross-service communication
5. **CQRS Pattern**: Separate read/write models where appropriate

---

## 📋 Getting Started Workflow

### Day 1: Basic Setup & Exploration

1. **Complete Environment Setup** (30-60 minutes)
   - Follow steps 1-6 above
   - Ensure all services start without errors

2. **Explore the Codebase** (60-90 minutes)

   ```bash
   # Start with the main README
   cat README.md

   # Explore key directories
   ls -la apps/web/src/
   ls -la services/api/src/

   # Check existing tests
   yarn test:unit
   ```

3. **Run Your First Test** (30 minutes)
   ```bash
   # Create a simple test to verify setup
   cd apps/web
   yarn test -- --testNamePattern="should render homepage"
   ```

### Day 2: Understanding the Domain

1. **Read Core Documentation**
   - `docs/ARCHITECTURE.md`
   - `docs/api/README.md`
   - `services/api/src/README.md`

2. **Explore Key Features**

   ```bash
   # Check tournament system
   grep -r "tournament" services/api/src/

   # Look at real-time features
   grep -r "socket" apps/web/src/
   ```

3. **Set Up Your Development Branch**
   ```bash
   git checkout -b feature/your-first-task
   ```

---

## 🔄 Development Workflow & Best Practices

### Git Workflow

```bash
# Always start from dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes with frequent commits
git add .
git commit -m "feat: add user authentication"

# Push and create PR
git push -u origin feature/your-feature-name
```

#### Commit Message Convention

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Examples:
- feat(auth): add Google OAuth integration
- fix(ui): resolve mobile layout issue
- test(api): add tournament creation tests
```

### Code Quality Standards

#### TypeScript/JavaScript

- Strict TypeScript configuration enabled
- ESLint + Prettier for code formatting
- 80%+ test coverage required
- TSDoc comments for complex functions

#### Python (AI Services)

- Type hints required
- Black for code formatting
- isort for import sorting
- Pylint for linting

### Development Commands

```bash
# Code Quality
yarn lint                    # Check all linting
yarn lint:fix               # Fix linting issues
yarn type-check             # TypeScript checking

# Testing
yarn test:unit              # Unit tests
yarn test:int               # Integration tests
yarn test:coverage          # Coverage report

# Development
yarn dev                    # Start all services
yarn dev:frontend           # Frontend only
yarn dev:backend            # Backend only

# Database
cd services/api
npx prisma studio           # Database browser
npx prisma migrate dev      # Run migrations
npx prisma generate         # Generate client
```

---

## 🧪 Testing Strategy

### Testing Pyramid

1. **Unit Tests** (80% of tests)
   - Component tests (React)
   - Service tests (NestJS)
   - Utility function tests
   - Hook tests

2. **Integration Tests** (15% of tests)
   - API endpoint tests
   - Database integration
   - Cross-service communication

3. **End-to-End Tests** (5% of tests)
   - User journey tests
   - Critical path validation

### Running Tests

```bash
# All tests with coverage
yarn test:coverage

# Watch mode for development
yarn test:watch

# Specific test patterns
yarn test -- --testNamePattern="authentication"

# E2E tests
yarn cypress:open
```

### Writing Tests

#### React Component Test

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameBoard } from './GameBoard'

describe('GameBoard', () => {
  it('should render game board', () => {
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

  it('should create a game', async () => {
    const gameData = { playerAId: '1', playerBId: '2' };
    const game = await service.createGame(gameData);
    expect(game).toBeDefined();
    expect(game.status).toBe('scheduled');
  });
});
```

---

## 🚀 Deployment & CI/CD

### Development Environment

- **Frontend**: Vercel preview deployments
- **Backend**: Local development with hot reload
- **Database**: Local PostgreSQL with migrations

### Staging Environment

```bash
# Deploy to staging
yarn deploy:staging

# Environment: staging.dojo-pool.com
# Database: Separate staging database
# Features: All features enabled for testing
```

### Production Environment

```bash
# Deploy to production
yarn deploy:production

# Environment: dojo-pool.com
# Database: Production PostgreSQL
# Features: Stable features only
```

### CI/CD Pipeline

#### GitHub Actions Workflow

- **Linting**: ESLint, Prettier, TypeScript
- **Testing**: Unit, Integration, E2E tests
- **Security**: Dependency vulnerability scanning
- **Performance**: Lighthouse CI for frontend
- **Deployment**: Automated deployment to Vercel

#### Deployment Checklist

- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Database migrations tested

---

## 🔧 Troubleshooting & Common Issues

### Environment Setup Issues

#### Node.js Version Conflicts

```bash
# Check current version
node --version

# Use correct version
nvm use 20

# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Reset database
cd services/api
npx prisma migrate reset

# Check connection
npx prisma db push
```

#### Port Conflicts

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 yarn dev:frontend
```

### Development Issues

#### Hot Reload Not Working

```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Restart development server
yarn dev
```

#### TypeScript Errors

```bash
# Check types
yarn type-check

# Generate types from API
cd packages/types
yarn generate
```

#### Test Failures

```bash
# Clear test cache
yarn test -- --clearCache

# Run specific failing test
yarn test -- --testNamePattern="failing test name"
```

### Performance Issues

#### Slow Builds

```bash
# Enable build cache
yarn build --cache

# Check bundle size
yarn build:analyze
```

#### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" yarn build
```

---

## 📚 Resources & Support

### Documentation

- **[API Documentation](./api/README.md)**: Complete API reference
- **[Architecture Guide](./ARCHITECTURE.md)**: System design and patterns
- **[Component Library](./components/README.md)**: UI component documentation
- **[Testing Guide](./testing/README.md)**: Testing best practices

### Development Tools

- **Prisma Studio**: `npx prisma studio` - Database browser
- **Storybook**: `yarn storybook` - Component development
- **Cypress**: `yarn cypress:open` - E2E testing
- **VS Code Extensions**: TypeScript, ESLint, Prettier, GitLens

### Communication

- **Discord**: Real-time chat for development discussions
- **GitHub Issues**: Bug reports and feature requests
- **Pull Request Templates**: Standardized contribution process
- **Code Reviews**: Required for all changes

### Getting Help

1. **Check Existing Documentation**: Search docs/ folder first
2. **GitHub Issues**: Search for similar issues
3. **Discord Community**: Ask in #development channel
4. **Code Reviews**: Request help from team members

### Key Contacts

- **Tech Lead**: [Name] - Architecture and technical decisions
- **Product Manager**: [Name] - Feature prioritization and requirements
- **DevOps**: [Name] - Infrastructure and deployment issues
- **QA Lead**: [Name] - Testing strategy and quality assurance

---

## 🎯 Next Steps

### Week 1 Goals

- [ ] Complete environment setup
- [ ] Run first test successfully
- [ ] Create your first pull request
- [ ] Attend daily standup

### Week 2 Goals

- [ ] Understand core domain models
- [ ] Complete first feature implementation
- [ ] Write comprehensive tests
- [ ] Participate in code review

### Ongoing Development

- Keep up with [development tracking](../DEVELOPMENT_TRACKING.md)
- Follow [coding standards](../style-guide.md)
- Contribute to [documentation](../docs/README.md)
- Participate in [team rituals](../guide/team-process.md)

---

## 🏆 Success Metrics

- **Code Quality**: All linting passes, 80%+ test coverage
- **Delivery**: Consistent pull request velocity
- **Collaboration**: Active participation in reviews and discussions
- **Learning**: Regular contribution to documentation and knowledge sharing

Welcome aboard! 🎱 We're excited to have you join the DojoPool team and contribute to building the future of hybrid gaming experiences.
