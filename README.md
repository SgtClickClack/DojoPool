# 🎱 Dojo Pool

**Dojo Pool is a "Pokémon Go for pool players" — a real-time, location-based platform for social matches, tournaments, and territory control.**

---

## ✨ Features

- **World Hub Map**: An interactive map displaying players, dojos (venues), and territories.
- **Venue Management**: A dashboard for venue owners to manage tables, create tournaments, and view activity.
- **Live Tournaments**: A full-stack tournament system with bracket visualization and real-time match reporting.
- **Territory Wars**: A meta-game where players compete to gain "influence" and control of local dojos.
- **Player Profiles**: Detailed profiles with match history, stats, and tournament performance.
- **Social System**: A complete friends list and friend request system.
- **Authentication**: Secure user registration and login using JWT.
- **AI Integration**: AI-powered match commentary, referee system, and content generation.
- **Blockchain Integration**: NFT avatars, Dojo Coins, and cross-chain tournament support.

---

## 💻 Tech Stack

- **Monorepo**: npm Workspaces with Turbo
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

```
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
   npm install
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
   npm run dev
   ```
   - Frontend will be available at `http://localhost:3000`.
   - Backend will be available at `http://localhost:8080`.

---

## 🧪 Running Tests

The project uses multiple testing frameworks:

```bash
# Unit tests with Vitest
npm run test:unit

# Integration tests
npm run test:int

# All tests with coverage
npm run test:coverage

# E2E tests with Cypress
npm run cypress:open
```

---

## 🏗️ Development Commands

```bash
# Development
npm run dev                    # Start both frontend and backend
npm run dev:backend           # Start only backend
npm run build                 # Build frontend
npm run build:backend         # Build backend

# Code Quality
npm run lint                  # Run ESLint
npm run lint:fix              # Fix ESLint issues
npm run format                # Format code with Prettier
npm run type-check            # TypeScript type checking

# AI-Assisted Development
npm run ai:explain-error      # Get AI explanation of errors
npm run ai:fix                # AI-assisted bug fixes
npm run ai:refactor           # AI-assisted code refactoring
```

---

## 🎮 Core Gameplay Features

### Territory Control System

- Players compete for control of physical venue locations
- Real-time territory battles with stake-based matches
- NFT-backed digital ownership of venues

### Tournament System

- Live bracket visualization
- Real-time match reporting
- Cross-chain tournament support
- Prize pool management

### Social Features

- Friend system with requests and messaging
- Clan-based gameplay mechanics
- Achievement and progression tracking
- Player reputation system

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
- **Phase 2**: AI integration and advanced gameplay 🚧
- **Phase 3**: Global scaling and franchise system 📋
- **Phase 4**: Advanced AI and blockchain features 📋

---

_Built with ❤️ by the Dojo Pool development team_


---

## 🧰 Troubleshooting (Windows)

### Clean up orphan Node.js processes
If development servers have been stopped but Node.js processes remain running in the background, use the safe, specific cleanup flow below. Avoid broad search patterns that could match protected Windows processes (e.g., wlanext).

Option A — via npm script (recommended):

1) Open PowerShell as Administrator.
2) Run:

```
npm run cleanup:node:win
```

Option B — run the command directly (in elevated PowerShell):

```
Get-Process -Name "node" | Stop-Process -Force
```

Option C — run the helper script directly (in elevated PowerShell):

```
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
