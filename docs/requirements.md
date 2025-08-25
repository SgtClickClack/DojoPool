# DojoPool Requirements

Generated: 2025-08-22 00:40 local time

Scope: This document captures the project-wide goals, constraints, and operating requirements for the DojoPool platform. It consolidates architecture and environment expectations, security and compliance needs, real-time and AI service boundaries, testing and DevOps constraints, and venue-facing operational requirements. Venue-specific details are further elaborated in docs/venues/requirements.md.

---

## 1. Product Goals (Functional)
- Core Experiences
  - Live match tracking and scoring with computer vision assist
  - Tournaments (creation, brackets, live updates, analytics)
  - Territory/clan systems and player profiles/social features
  - Venue operations dashboard and per-table oversight
  - AI features: referee assistance, commentary, insights
  - Optional blockchain features (ownership, rewards) as gated modules
- Platforms
  - Web (desktop/mobile) primary; staff mobile workflows for QR scanning and quick actions
  - Venue displays for dashboards and optional per-table boards

## 2. Architecture and Technology Baseline
- Frontend: Next.js (production), React 18.2, TypeScript 5.8.x strict
- Dev Experience: Vite for development (HMR), path alias @ -> ./src, ESM modules
- Backend: Node.js 20+ (NestJS/Express) on port 8080 in dev; REST + Socket.io
- AI Services: Python (Flask/FastAPI) on port 5000; HTTP/WS contracts; optional edge gateway
- Real-time: Socket.io for live updates; Redis adapter for scale
- Database: PostgreSQL + Prisma preferred; support/document legacy Mongo if present
- Caching/Queues: Redis for caching, sessions, real-time scaling; BullMQ for async jobs
- Containerization: Dockerized services; Nginx/Supervisor for production multi-service orchestration

## 3. Environment and Ports
- Node 20+, Python 3.10+
- Dev ports: 3000 (Vite), 8080 (Node API), 5000 (Python AI/Flask)
- Production: Next.js optimized output; API behind reverse proxy; HTTPS everywhere
- Path aliases: @/* -> ./src/* across web/app/tests

## 4. Security and Compliance Requirements
- Security Controls
  - HTTP security headers (Helmet), strict CSP, CORS per environment
  - Rate limiting (express-rate-limit) and input validation (class-validator/Zod)
  - CSRF protection (csrf-csrf) for state-changing routes
  - Secrets managed via env/secrets store; no secrets committed to VCS
  - Authentication via Auth.js (NextAuth) or equivalent; 2FA for admin/venue roles
- Compliance & Privacy
  - Data minimization; configurable retention for telemetry and CV artifacts
  - HTTPS-only for management interfaces; device identity and rotation for gateways
  - Display privacy notice where video analytics are in use (venues)

## 5. Observability and Performance
- Tracing/metrics via OpenTelemetry; Prometheus/Grafana integration
- Error tracking via Sentry (client + server)
- Performance budgets for frontend (LCP, TTI) and API latency SLOs
- Caching (Redis), HTTP compression, image optimization (WebP/AVIF)

## 6. Testing and Quality Gates
- Testing: Vitest (unit jsdom + node integration); setup/mocks in src/tests/setup.ts
- CI: unit + integration, coverage thresholds; type-check and lint in pipeline
- Deterministic installs (npm ci) and Node/TS version pinning in CI

## 7. Real-time and Reliability
- Socket.io with Redis adapter; room conventions (match, venue, clan)
- Reconnection/backpressure strategies; event versioning and idempotency
- Health signals for connections; synthetic checks in CI for real-time readiness

## 8. AI/ML Service Boundaries
- Contracts between Node API and Python services via HTTP/JSON or gRPC; timeouts/retries
- Client-side ML (TensorFlow.js) for lightweight tasks only; heavy CV on server/edge
- Queued asynchronous processing for long-running inferences (BullMQ)

## 9. Database and Data Management
- Canonical datastore: PostgreSQL + Prisma Migrate; seed and migration workflows
- If MongoDB exists: document scope, plan deprecation/migration paths
- Data modeling aligned with gameplay (matches, tables, venues, players, tournaments)

## 10. Deployment and Operations
- Docker multi-stage builds; production reverse proxy; HTTPS enforcement
- GitHub Actions CI/CD recommended; environment-specific configs
- Feature flags for risky/experimental features (e.g., blockchain modules)

## 11. Venue Integration Requirements (Summary)
- Network
  - Minimum 100 Mbps down / 20 Mbps up; recommended 300 Mbps+ symmetric
  - < 50 ms to nearest region; allow outbound HTTPS (443) and WebSocket upgrades
  - Dual-band Wi‑Fi with guest network segmentation; Gigabit LAN for cameras/gateways
- Power/Environment
  - Surge protection and UPS for critical devices; adequate lighting over tables
- Hardware per table
  - Overhead 1080p@30fps+ camera; stable top‑down mount; optional edge gateway
  - QR signage for player/table check-in
- Staff/Software
  - Staff workstation + mobile; latest Chrome/Edge; cookies/localStorage enabled
  - Venue account with least-privilege roles; enforce 2FA for admins
- Compliance
  - HTTPS-only for management; physical security for devices; privacy notices

Details and checklists: see docs/venues/requirements.md.

---

## 12. Out-of-Scope/Non-Goals (Current Phase)
- Native mobile applications (beyond PWA/staff mobile web flows)
- On-chain only operations (blockchain remains optional via feature flags)
- Support for non-HTTPS management or inbound port requirements at venues

## 13. Acceptance Criteria for Compliance
- All services run on specified versions/ports; security controls enabled and testable
- CI enforces type-check, lint, tests, and coverage; deterministic installs
- Docs kept in sync with architecture and environment; venue constraints reflected in UX and monitoring
