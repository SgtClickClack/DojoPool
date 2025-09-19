# 🎱 Dojo Pool

**Dojo Pool is a "Pokémon Go for pool players" — a real-time, location-based platform for social matches, tournaments, and territory control.**

<!-- Pipeline test -->

---

## ✨ Features

### 🎮 Core Gaming Features

- **World Hub Map**: Interactive map of players, Dojos (venues), and territories.
- **Territory Control**: Claim, defend, and level up Dojos; NFT-backed ownership.
- **Live Tournaments**: Brackets, live match reporting, prize pools, cross-chain support.
- **Seasons System**: Competitive seasons with leaderboards, rewards, and progression tracking.
- **Clans**: Create/join clans, clan wars, bonuses, and territory influence.

### 🤖 AI & Analysis

- **AR Coach**: AI-powered table analysis with ball detection and coaching insights.
- **AI Analysis & Commentary**: Sky-T1 referee decisions, Diception tracking, Pool God commentary.
- **Content Generation**: Highlights, tutorials, promos via Wan 2.1 and AudioCraft.
- **Real-time Match Tracking**: Computer vision for ball position and shot analysis.

### 💼 Venue Management

- **Venue Management Portal**: Owner dashboards for profile, specials, tournaments, rewards, NFTs.
- **Tournament Sponsorship**: Venue owners can sponsor tournaments with custom benefits and budgets.
- **Quest Management**: Create and manage venue-specific quests with rewards and progression.
- **Analytics Dashboard**: Revenue tracking, player analytics, and venue performance metrics.

### 👥 Social & Community

- **Player Profiles**: Stats, history, avatar evolution, achievements, ranking.
- **Direct Messaging**: Friends, DMs, notifications, and social feed integration.
- **Marketplace**: Trade NFTs, avatar items, and Dojo ownership with filters and pricing.

### 🔐 Security & Infrastructure

- **Authentication**: JWT-based auth with CSRF header and secure CORS.
- **Blockchain Integration**: Dojo Coin (ERC-20), multi-chain wallets, NFT trophies.
- **Real-time Communication**: WebSocket support for live matches and chat.

---

## 💻 Tech Stack

- **Monorepo**: Yarn v4 Workspaces
- **Frontend**: Next.js 15, React 18, TypeScript, Material-UI, Google Maps API
- **Backend**: NestJS, TypeScript, Prisma ORM, WebSockets (Socket.io)
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest, Jest, Cypress for E2E tests
- **Deployment**: Vercel (Frontend), Vercel Functions (Backend)
- **AI Services**: TensorFlow.js, Custom AI models for game analysis
- **Monitoring**: Custom monitoring system with logging and health checks

---

## 🏗️ Project Structure

This is a monorepo with two primary packages:

```bash
dojopool/
├── apps/
│   └── web/                 # Next.js frontend application
│       ├── src/             # Source code
│       ├── pages/           # Next.js pages
│       ├── components/      # React components
│       └── public/          # Static assets
├── services/
│   └── api/                 # NestJS backend API
│       ├── src/             # Source code
│       └── prisma/          # Database schema and migrations
├── src/                     # Shared source code
├── docs/                    # Project documentation
├── tests/                   # Test files
└── scripts/                 # Build and utility scripts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x (pinned via .nvmrc at the repository root)
- Python 3.11+ (required for Flask/AI services; see pyproject.toml requires-python)
- npm
- A running PostgreSQL database instance

#### Node version management (Windows/macOS/Linux)

- This repository includes a .nvmrc set to 20 to ensure a consistent Node version.
  - Windows (nvm-windows): `nvm install 20` then `nvm use 20`
  - macOS/Linux (nvm): `nvm install` then `nvm use`
- Alternatively, you can use Volta to pin and enforce versions globally: `volta pin node@20`

### Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd dojopool
   ```

2. **Install Dependencies**: From the project root, run:

   ```bash
   yarn install --immutable
   ```

3. **Set Environment Variables**: Create a `.env` file in the `services/api` directory. At a minimum, you need:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   JWT_SECRET="your-super-secret-jwt-key"
   GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
   ```

4. **Run Database Migrations**:

   ```bash
   cd services/api
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run Development Servers**: From the project root, run both services concurrently:

   ```bash
   yarn dev
   ```

   - Frontend will be available at `http://localhost:3000`.
   - Backend will be available at `http://localhost:3002` (via root `npm run dev`) or `http://localhost:8080` when starting `services/api` directly.

---

## 🧪 Running Tests

The project uses multiple testing frameworks:

```bash
# Unit tests with Vitest
yarn test:unit

# Integration tests
yarn test:int

# All tests with coverage
yarn test:coverage

# E2E tests with Cypress
yarn cypress:open
```

---

## 🏗️ Development Commands

```bash
# Development
yarn dev                      # Start both frontend and backend
yarn dev:backend              # Start only backend
yarn build                    # Build frontend
yarn build:backend            # Build backend

# Code Quality
yarn lint                     # Run ESLint
yarn lint:fix                 # Fix ESLint issues
yarn format                   # Format code with Prettier
yarn type-check               # TypeScript type checking

# AI-Assisted Development
yarn ai:explain-error         # Get AI explanation of errors
yarn ai:fix                   # AI-assisted bug fixes
yarn ai:refactor              # AI-assisted code refactoring
```

---

## 🔧 Configuration

### Environment Variables

Key environment variables needed:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="..."

# External APIs
GOOGLE_MAPS_API_KEY="..."
OPENAI_API_KEY="..."

# Blockchain
ETHEREUM_RPC_URL="..."
SOLANA_RPC_URL="..."
```

### Database Schema

The project uses Prisma ORM with PostgreSQL. Key models include:

- **Users**: Player accounts and profiles
- **Venues**: Physical pool locations
- **Matches**: Game records and statistics
- **Tournaments**: Competition structures
- **Territories**: Venue control and ownership

---

## 🚀 Deployment

### Vercel Deployment

This project is configured for one-click deployment to **Vercel**:

1. **Frontend**: Automatically deploys from `apps/web/`
2. **Backend**: Deployed as Vercel Functions
3. **Database**: Uses Vercel Postgres or external PostgreSQL

### Environment Setup

1. Configure environment variables in Vercel dashboard
2. Set up database connection
3. Configure custom domains if needed

---

## 📚 Documentation

- **API Documentation**: Available in `docs/api/`
- **Component Documentation**: Component usage in `docs/components/`
- **Feature Specifications**: Detailed specs in `specs/`
- **Development Guides**: Setup and contribution guides in `docs/`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style

- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Conventional commit messages
- 80%+ test coverage required

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For technical support or questions:

- Check the documentation in `docs/`
- Review existing issues
- Contact the development team

---

## 🗺️ Roadmap

- **Phase 1**: Core platform and basic features ✅
- **Phase 2**: AI integration, AR Coach, and Venue Sponsorship Portal ✅
- **Phase 3**: Global scaling and franchise system 📋
- **Phase 4**: Advanced AI and blockchain features 📋

### 🎯 Recent Releases

#### v3.0.0 - Feature Complete Release ✨

- **AR Coach System**: AI-powered table analysis and ball detection
- **Venue Sponsorship Portal**: Tournament sponsorship and quest management
- **Seasons System**: Competitive seasons with leaderboards and rewards
- **Enhanced Tournament System**: Live brackets and cross-chain support
- **Security Updates**: Dependency security audit and fixes
- **Code Quality**: Consistent formatting and documentation updates

---

_Built with ❤️ by the Dojo Pool development team_

---

## 🧰 Troubleshooting (Windows)

### Clean up orphan Node.js processes

If development servers have been stopped but Node.js processes remain running in the background, use the safe, specific cleanup flow below. Avoid broad search patterns that could match protected Windows processes (e.g., wlanext).

Option A — via Yarn script (recommended):

1. Open PowerShell as Administrator.
2. Run:

```bash
yarn cleanup:node:win
```

Option B — run the command directly (in elevated PowerShell):

```bash
Get-Process -Name "node" | Stop-Process -Force
```

Option C — run the helper script directly (in elevated PowerShell):

```bash
powershell -ExecutionPolicy Bypass -File scripts\cleanup-node-processes.ps1
```

Notes:

- Running as Administrator is required; otherwise Windows may block termination of certain processes.
- The script targets only "node" processes to avoid stopping unrelated or protected system processes.

---

## 🔐 Security

- Security headers are enabled in the NestJS API via Helmet (see services/api/src/main.ts).
- Basic rate limiting is applied using express-rate-limit (100 requests per 15 minutes per IP).
- CORS is enabled with credentials support and a configurable allowed origin (FRONTEND_URL or http://localhost:3000).

### CSRF Protection (Documentation)

Our frontend uses the standard Double Submit Cookie pattern for CSRF protection in a stateless JWT architecture:

- The frontend sets/reads a CSRF token value in a cookie (e.g., `csrfToken`).
- For every state-changing request (POST/PUT/PATCH/DELETE), the frontend also sends this value in a custom header (e.g., `X-CSRF-Token`).
- The backend remains stateless: it validates that the CSRF header value equals the CSRF cookie value. No server-side session storage is required and no additional CSRF middleware is needed at this time.
- Ensure the frontend includes the `X-CSRF-Token` header and requests are sent with `credentials: 'include'`; the API CORS config allows credentials and the custom header.

This approach aligns with a stateless JWT setup and avoids server-side CSRF state. For additional hardening, consider SameSite/Lax cookies and HTTPS-only environments in production.
