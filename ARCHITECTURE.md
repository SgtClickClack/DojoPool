# Technical Specification Document — DojoPool v2 Architecture

## 1. Recommended Tech Stack

- Frontend
  - Next.js 15 (App Router, React Server Components, Server Actions)
  - TypeScript, TanStack Query, Zustand, Zod
  - Tailwind CSS + Headless UI; MUI only where needed
  - Mapbox GL JS for map/territory
  - WebSockets via Socket.IO client

- Backend (Core Platform)
  - Node.js 20, NestJS (modular, DI, guards)
  - REST (OpenAPI) + WebSocket Gateway (Socket.IO)
  - PostgreSQL (primary), Redis (cache/sessions/queues), S3-compatible object storage
  - Prisma ORM
  - BullMQ (Redis) for background jobs
  - OpenTelemetry, Prometheus, Grafana, Sentry

- AI / CV Services (Specialized)
  - Python 3.11, FastAPI for:
    - Vision (Diception-like CV)
    - AI Referee (rule/foul detection)
    - Commentary/Content (Wan/AudioCraft wrappers)
  - gRPC/HTTP between services; eventing via Redis streams or NATS

- Realtime
  - Socket.IO (rooms per match/venue/clan), Redis adapter for horizontal scaling

- DevOps
  - Monorepo with pnpm + TurboRepo
  - Docker for all services; K8s-ready
  - GitHub Actions CI/CD, Trivy scanning
  - IaC: Terraform or CDK (keep simple at first)

- Auth
  - Auth.js (NextAuth v5) for web (session-JWT hybrid, Redis store)
  - OAuth (Google/Apple), passwordless email, device tokens for mobile
  - Signed short-lived service tokens (JWK) for camera/edge devices

Rationale: TypeScript unifies most of the platform, NestJS provides strong modularity for complex domains (tournament, venues, games, clans, wallet), Prisma accelerates schema evolution, and Python remains best-in-class for CV/ML workloads. Socket.IO with Redis adapter fits presence/rooms/failover needs.

## 2. Project & Code Structure

- Monorepo (pnpm workspaces + TurboRepo)

- Top-level
  - apps/
    - web/ (Next.js 15 App Router)
    - mobile/ (Expo/React Native, optional later)
  - services/
    - api/ (NestJS REST + WebSocket gateway)
    - realtime/ (optional if split from api for scale)
    - ai-vision/ (FastAPI CV)
    - ai-referee/ (FastAPI rules/decisions)
    - ai-commentary/ (FastAPI content/audio)
  - packages/
    - ui/ (shared components, Tailwind+Headless primitives)
    - config/ (ESLint, TS, Prettier, Tailwind presets)
    - types/ (Zod schemas, OpenAPI-generated TS, shared DTOs)
    - prisma/ (schema, migrations, seed)
    - utils/ (shared libs)
  - infra/
    - k8s/ docker/ terraform/ cdk/
  - .github/workflows/

- Principles
  - Feature-first modules in frontend and backend
  - Shared types via Zod + OpenAPI gen
  - Clear boundaries: core API in TypeScript; AI/CV in Python services

## 3. Frontend Architecture

- Framework: Next.js App Router
  - RSC + Server Actions reduce client JS and simplify data mutations
  - Co-locate routes, loaders, and components

- State Management
  - TanStack Query for server state, mutations, caching, sync
  - Zustand for local UI/ephemeral state
  - Zod for runtime validation

- Component Design
  - Feature-based folders with colocated components/hooks/tests
  - Shared primitives in `packages/ui`
  - Avoid large components (>300 LOC)

- Styling
  - Tailwind CSS + Headless UI for speed and consistency
  - Keep MUI only where necessary and wrap in local adapters

- Realtime
  - Lightweight socket client hook per feature (room join/leave lifecycle)
  - Optimistic UI using TanStack Query + socket invalidations

## 4. Backend Architecture

- API Design
  - REST-first (OpenAPI), versioned routes: /v1
  - Resource-oriented: users, venues, tables, tournaments, matches, clans, territories, wallet
  - Webhooks for partner integrations (payments, notifications)
  - OpenAPI schema drives frontend TS types (packages/types)

- Services (NestJS Modules)
  - AuthModule (Auth.js integration, tokens, policies)
  - UserModule (profiles, settings, achievements)
  - VenueModule (venues, tables, check-ins, QR)
  - TerritoryModule (zones, ownership, events)
  - ClanModule (clans, memberships, wars)
  - TournamentModule (events, brackets, matches)
  - MatchModule (sessions, events, scoring)
  - WalletModule (wallets, transactions, NFTs)
  - NotificationModule (in-app, email, push)
  - RealtimeGateway (Socket.IO rooms: match:{id}, venue:{id}, clan:{id})
  - IntegrationsModule (AI services, payments, maps)

- Authentication
  - Web: Auth.js with session-JWT hybrid, Redis session store
  - Mobile/devices: short-lived JWT access tokens, refresh tokens; JWK rotation
  - Role/permission guards at controller and socket layers

- Real-time Layer
  - Socket.IO gateway in NestJS, Redis adapter for scale
  - Presence, typing/voice states, live match/tournament rooms
  - Back-pressure, QoS events, replay via Redis streams where needed

- Data & Caching
  - PostgreSQL via Prisma
  - Redis for rate limiting, sessions, caching, queues, presence
  - S3 for media (avatars, highlights)

- Observability
  - OpenTelemetry (traces, metrics, logs), Prometheus, Grafana
  - Sentry for FE/BE error tracking

- Security
  - CSP, rate limiting, input validation (Zod/DTO pipes), audit logs
  - Health endpoints per service, readiness/liveness probes

## 5. Database Schema (Prisma)

```prisma
generator client { provider = "prisma-client-js" }

datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model User {
  id            String           @id @default(uuid())
  email         String           @unique
  username      String           @unique
  passwordHash  String
  role          UserRole         @default(USER)
  profile       Profile?
  settings      UserSettings?
  wallets       Wallet[]
  nfts          UserNFT[]
  achievements  UserAchievement[]
  memberships   ClanMember[]
  territories   Territory[]      @relation("TerritoryOwner")
  checkIns      CheckIn[]
  challengesAsChallenger Challenge[] @relation("ChallengeChallenger")
  challengesAsDefender   Challenge[] @relation("ChallengeDefender")
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
}

enum UserRole { USER VENUE_ADMIN ADMIN }

model Profile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  displayName String?
  bio         String?
  avatarUrl   String?
  location    String?
  skillRating Int      @default(0)
  clanTitle   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model UserSettings {
  id                      String   @id @default(uuid())
  userId                  String   @unique
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  emailNotifications      Boolean  @default(true)
  pushNotifications       Boolean  @default(true)
  darkMode                Boolean  @default(false)
  language                String   @default("en")
  timezone                String   @default("UTC")
  privacySettings         Json     @default("{}")
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}

model Venue {
  id          String    @id @default(uuid())
  name        String
  description String?
  lat         Float
  lng         Float
  address     String?
  ownerId     String?
  owner       User?     @relation(fields: [ownerId], references: [id])
  tables      Table[]
  tournaments Tournament[]
  territories Territory[]
  checkIns    CheckIn[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Table {
  id        String   @id @default(uuid())
  venueId   String
  venue     Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  name      String
  status    TableStatus @default(AVAILABLE)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum TableStatus { AVAILABLE OCCUPIED MAINTENANCE }

model CheckIn {
  id        String   @id @default(uuid())
  userId    String
  venueId   String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  venue     Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  via       CheckInMethod @default(QR)
  createdAt DateTime  @default(now())
}

enum CheckInMethod { QR GEO ADMIN }

model Clan {
  id          String       @id @default(uuid())
  name        String       @unique
  description String?
  leaderId    String
  leader      User         @relation("ClanLeader", fields: [leaderId], references: [id])
  members     ClanMember[]
  territories Territory[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model ClanMember {
  id        String   @id @default(uuid())
  clanId    String
  userId    String   @unique
  clan      Clan     @relation(fields: [clanId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      ClanRole @default(MEMBER)
  joinedAt  DateTime @default(now())
}

enum ClanRole { MEMBER OFFICER COLEADER }

model Territory {
  id           String    @id @default(uuid())
  venueId      String
  ownerId      String?
  venue        Venue     @relation(fields: [venueId], references: [id], onDelete: Cascade)
  owner        User?     @relation("TerritoryOwner", fields: [ownerId], references: [id])
  clanId       String?
  clan         Clan?     @relation(fields: [clanId], references: [id])
  level        Int       @default(1)
  defenseScore Int       @default(0)
  events       TerritoryEvent[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model TerritoryEvent {
  id           String     @id @default(uuid())
  territoryId  String
  territory    Territory  @relation(fields: [territoryId], references: [id], onDelete: Cascade)
  type         TerritoryEventType
  metadata     Json
  createdAt    DateTime   @default(now())
}

enum TerritoryEventType { CLAIM DEFEND LOSE UPGRADE }

model Tournament {
  id           String     @id @default(uuid())
  venueId      String?
  venue        Venue?     @relation(fields: [venueId], references: [id])
  name         String
  status       TournamentStatus @default(UPCOMING)
  startTime    DateTime
  endTime      DateTime?
  participants TournamentParticipant[]
  matches      Match[]
  rewards      Json?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

enum TournamentStatus { UPCOMING LIVE COMPLETED CANCELLED }

model TournamentParticipant {
  id           String   @id @default(uuid())
  tournamentId String
  userId       String
  seed         Int?
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
}

model Match {
  id            String    @id @default(uuid())
  tournamentId  String?
  tournament    Tournament? @relation(fields: [tournamentId], references: [id])
  venueId       String?
  venue         Venue?    @relation(fields: [venueId], references: [id])
  tableId       String?
  table         Table?    @relation(fields: [tableId], references: [id])
  playerAId     String
  playerBId     String
  playerA       User      @relation("PlayerA", fields: [playerAId], references: [id])
  playerB       User      @relation("PlayerB", fields: [playerBId], references: [id])
  status        MatchStatus @default(SCHEDULED)
  scoreA        Int       @default(0)
  scoreB        Int       @default(0)
  events        MatchEvent[]
  startedAt     DateTime?
  endedAt       DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum MatchStatus { SCHEDULED LIVE COMPLETED CANCELLED }

model MatchEvent {
  id        String   @id @default(uuid())
  matchId   String
  match     Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  type      MatchEventType
  payload   Json
  ts        DateTime @default(now())
}

enum MatchEventType { SHOT FOUL RACK_START RACK_END COMMENTARY SYSTEM }

model Challenge {
  id            String   @id @default(uuid())
  challengerId  String
  defenderId    String
  venueId       String?
  status        ChallengeStatus @default(PENDING)
  stakeCoins    Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  challenger    User      @relation("ChallengeChallenger", fields: [challengerId], references: [id])
  defender      User      @relation("ChallengeDefender", fields: [defenderId], references: [id])
  venue         Venue?    @relation(fields: [venueId], references: [id])
}

enum ChallengeStatus { PENDING ACCEPTED DECLINED EXPIRED }

model Wallet {
  id        String  @id @default(uuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  chain     String  // e.g., "ethereum","solana"
  address   String
  createdAt DateTime @default(now())
  @@unique([chain, address])
}

model Transaction {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount    Int
  currency  String   @default("DOJO")
  type      TxType
  metadata  Json
  createdAt DateTime @default(now())
}

enum TxType { CREDIT DEBIT PRIZE FEE PURCHASE }

model NFT {
  id        String   @id @default(uuid())
  contract  String
  tokenId   String
  chain     String
  metadata  Json
  createdAt DateTime @default(now())
  @@unique([contract, tokenId, chain])
}

model UserNFT {
  id      String @id @default(uuid())
  userId  String
  nftId   String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  nft     NFT    @relation(fields: [nftId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, nftId])
}

model Achievement {
  id        String   @id @default(uuid())
  key       String   @unique
  name      String
  desc      String?
  points    Int      @default(0)
  createdAt DateTime @default(now())
}

model UserAchievement {
  id             String   @id @default(uuid())
  userId         String
  achievementId  String
  user           User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement    Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  earnedAt       DateTime    @default(now())
  @@unique([userId, achievementId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  payload   Json
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  actorId   String?
  actor     User?    @relation(fields: [actorId], references: [id])
  action    String
  target    String?
  metadata  Json
  ts        DateTime @default(now())
}
```

## 6. High-Level Migration Plan

- Foundation
  - Create monorepo with pnpm/TurboRepo; add apps/web, services/api, packages/prisma/types/ui
  - Stand up PostgreSQL + Redis; port existing SQLite/SQLAlchemy/Prisma entities to unified Prisma
  - Establish Auth.js in web; Redis session store; JWT service for mobile/devices

- Domain Carve-out (Strangler Fig)
  - Implement NestJS modules incrementally: Users → Venues → Tournaments → Matches → Territories → Clans → Wallet
  - Expose REST /v1 with OpenAPI; generate TS SDK (packages/types) and adopt in web

- Realtime
  - Introduce Socket.IO gateway with Redis adapter; mirror existing socket events; progressively switch frontend to new gateway rooms

- AI Services
  - Wrap existing CV/AI logic behind FastAPI endpoints and event streams; define stable contracts
  - Add ingestion workers (BullMQ) to process match events, analytics, and commentary generation

- Frontend
  - Migrate to Next.js App Router; replace ad-hoc services with TanStack Query fetchers tied to OpenAPI SDK
  - Replace map with Mapbox GL; wire territory/tournament realtime rooms

- Data Migration
  - ETL scripts from legacy stores to Postgres via Prisma
  - Dual-write phase (old → new) where needed; verify with checksums; cutover by domain

- Observability/Security
  - Add OTel, Sentry, rate limits, CSP, health checks on all services

- Cutover
  - Route traffic to new API and sockets per feature toggle
  - Decommission legacy Flask/Node endpoints after validation

—

- Proposed a unified TS-first architecture with NestJS core, Python AI microservices, Postgres/Prisma, Redis, Socket.IO.
- Clean monorepo layout with shared types and UI.
- Next.js App Router + TanStack Query + Tailwind/Zustand on FE.
- Comprehensive Prisma schema for users, venues, tournaments, matches, clans, territories, wallet, NFTs, achievements.
- Incremental migration plan using strangler pattern, OpenAPI-driven FE, and Redis-backed realtime.
