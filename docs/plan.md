# DojoPool Improvement Plan

Generated: 2025-08-24 02:20 local time

Primary source: docs/requirements.md (project-wide requirements). Supplementary references:

- docs/venues/requirements.md (venue integration requirements)
- ARCHITECTURE.md (root)
- README.md (root)
- SECURITY.md (root)
- docs/planning/tracking/index.md (and linked context)
- DojoPool Development Guidelines (2025-08-01)

---

## Executive Summary

DojoPool combines a Next.js frontend, a Node.js/NestJS backend, real-time Socket.io services, and Python-based AI/CV components. The repository shows mature ambitions (territory wars, tournaments, AI referee/commentary, blockchain), but also inconsistencies across documentation and configuration (e.g., framework versions, database choice, dual build systems). This plan aligns architecture and implementations to clear, prioritized goals while honoring constraints around security, performance, testing, and deployment.

Key outcomes we target in the next phases:

- Resolve framework/version drift and solidify the monorepo layout and build pipelines.
- Establish a single canonical database path (PostgreSQL + Prisma) while documenting any legacy MongoDB dependencies and deprecations.
- Harden security (CSP, CSRF, rate limiting, auth), and instrument observability (OpenTelemetry/Prometheus/Sentry).
- Codify real-time and AI service boundaries; stabilize dev/CI flows with Vitest and CI actions.
- Deliver incremental, verifiable improvements with a risk-managed roadmap.

---

## Extracted Goals and Constraints (from docs/requirements.md)

- Product Goals: live match tracking with CV assist; tournaments; territory/clan; profiles/social; venue ops dashboard; AI referee/commentary; optional blockchain via feature flags.
- Architecture Baseline: Next.js (prod), React 18.2, TS 5.8.x strict; Vite for dev; ESM; Node 20+ API (REST + Socket.io) on 8080; Python AI services on 5000; Redis for caching/queues; Dockerized; Nginx/Supervisor.
- Environment & Ports: 3000 Vite, 8080 Node API, 5000 Python AI; HTTPS in production; @/_ -> ./src/_ alias.
- Security & Compliance: Helmet, strict CSP, CORS, CSRF, rate limiting, validation; secrets via env; Auth.js/NextAuth; 2FA for venue admins; privacy notices; HTTPS-only for management; device identity/rotation.
- Observability & Performance: OpenTelemetry + Prometheus/Grafana; Sentry; performance budgets; compression and image optimization.
- Testing & Quality Gates: Vitest unit/integration with mocks; CI with type-check, lint, coverage; deterministic installs.
- Real-time & Reliability: Socket.io with Redis adapter; reconnection/backpressure; event versioning/idempotency; health signals.
- AI/ML Boundaries: Contracts between Node and Python services (HTTP/JSON or gRPC) with timeouts/retries; TF.js only for light tasks; queue long-running inferences.
- Database & Data: Canonical Postgres + Prisma Migrate; document any Mongo scope and migration/deprecation path; gameplay-aligned data modeling.
- Deployment & Operations: Docker multi-stage; reverse proxy; GitHub Actions CI/CD; feature flags for risky modules.
- Venue Integration Summary: network bandwidth/latency; Wi‑Fi segmentation; Gigabit LAN; UPS; 1080p@30fps cameras; QR signage; staff devices; 2FA; HTTPS-only; privacy notices. See docs/venues/requirements.md for details.
- Non-Goals (current phase): native mobile apps; on-chain-only operation; non-HTTPS management or inbound port requirements at venues.

---

## Requirements-to-Plan Mapping

- 1. Product Goals -> Plan sections: 3) Frontend, 4) Backend, 5) Real-time, 6) AI/ML, 11) Data and State Management; Roadmap Phase 4.
- 2. Architecture and Technology Baseline -> 1) Architecture Alignment; 3) Frontend; 4) Backend; 10) DevOps, CI/CD, and Docker.
- 3. Environment and Ports -> 3) Frontend; 4) Backend; 10) DevOps (ports, proxies); Acceptance Criteria.
- 4. Security and Compliance Requirements -> 7) Security and Compliance; 12) Documentation and Developer Experience; Acceptance Criteria.
- 5. Observability and Performance -> 8) Observability and Performance; 3) Frontend performance actions; SLOs in Roadmap Phase 1.
- 6. Testing and Quality Gates -> 9) Testing and Quality; 10) DevOps (CI); Risks and Mitigations.
- 7. Real-time and Reliability -> 5) Real-time and Scaling; synthetic checks in Roadmap Phase 2.
- 8. AI/ML Service Boundaries -> 6) AI/ML Services; 4) Backend integration; queues via BullMQ.
- 9. Database and Data Management -> 2) Database Strategy; 11) Data and State Management; migrations via Prisma.
- 10. Deployment and Operations -> 10) DevOps, CI/CD, and Docker; reverse proxy/WebSocket upgrades; feature flags.
- 11. Venue Integration Requirements -> Venue-Focused Addendum; also 5) Real-time, 7) Security, 8) Observability sections.
- 12. Out-of-Scope/Non-Goals -> Roadmap scoping and feature flags; excluded from current phases.
- 13. Acceptance Criteria for Compliance -> Acceptance Criteria for This Plan; CI gates and doc sync.

## Themed Improvement Plan (with Rationale)

### 1) Architecture Alignment and Version Consistency

- Action: Standardize on Next.js 15.x, React 18.2, TypeScript 5.8.x across apps/web, aligning with the Development Guidelines.
  - Rationale: Reduce cognitive and tooling drift; Next 15 adds stability and security patches; aligns with official guidelines.
- Action: Confirm monorepo layout (apps/, services/, packages/, infra/, .github/). Ensure tsconfig base and path aliases (@/_ -> ./src/_) are consistent in all packages.
  - Rationale: Predictable layout eases onboarding, tooling, and CI.
- Action: Document any exceptions in ARCHITECTURE.md and README.md; update both to a single source of truth.
  - Rationale: Avoid contradictory guidance for contributors.

### 2) Database Strategy (Canonical: PostgreSQL + Prisma)

- Action: Adopt PostgreSQL + Prisma as the canonical datastore per ARCHITECTURE.md; document deprecation path for Mongo/Mongoose if present.
  - Rationale: One database reduces operational overhead; Prisma-first simplifies TS type sharing.
- Action: Inventory any MongoDB usage; propose migration scripts or compatibility layer if migration required.
  - Rationale: Controlled migration avoids outages and reduces tech debt.
- Action: Establish schema versioning, migrations (Prisma Migrate), and seed data processes for local/CI.
  - Rationale: Reliable environments and reproducible CI.

### 3) Frontend (Next.js + Vite Dev Workflow)

- Action: Keep Vite for local dev speed with proxying to Node (8080) and Flask (5000); keep Next.js for production builds.
  - Rationale: Matches Guidelines for fast iteration + optimized production output.
- Action: Enforce strict TypeScript; enable type-check in CI; ensure path aliases and absolute imports (@/\*) are consistent.
  - Rationale: Prevent runtime regressions; dev ergonomics.
- Action: UI libraries: Prefer Chakra/Material/Ant only as needed; consider unifying on one system or Tailwind+Headless if already adopted; avoid style drift.
  - Rationale: Consistency and bundle size control.
- Action: Performance: Ensure image optimization (WebP/AVIF), code splitting, and compression are configured; verify Next.js headers/CSP.
  - Rationale: Page speed, SEO, and security.

### 4) Backend (NestJS API + Flask Services Integration)

- Action: Confirm Node API service baseline: NestJS with REST (OpenAPI) + Socket.io gateway; port 8080 in dev.
  - Rationale: Align with README and Architecture; OpenAPI enables typed SDK generation for frontend.
- Action: Create an integration layer for Python Flask/FastAPI services (port 5000) with clear routes and timeouts/retries; define contract schemas.
  - Rationale: Decouple AI services; resilience and observability.
- Action: Introduce rate limiting, validation (class-validator/Zod), and centralized error handling.
  - Rationale: Security and reliability.

### 5) Real-time and Scaling

- Action: Adopt Socket.io Redis adapter for horizontal scaling in production; define room naming conventions (match, venue, clan).
  - Rationale: Predictable, scalable real-time behavior.
- Action: Implement backpressure strategies and event versioning; define reconnection and idempotency semantics.
  - Rationale: Robustness under network variability.

### 6) AI/ML Services

- Action: Separate Python services: ai-vision, ai-referee, ai-commentary with FastAPI; define shared proto/JSON contracts.
  - Rationale: Clear boundaries and independent scaling.
- Action: Client-side ML (TensorFlow.js) for light inference only; heavier CV in backend services.
  - Rationale: Performance and device compatibility.
- Action: Add queueing (BullMQ) for async workloads; use Redis Streams or BullMQ as per ARCHITECTURE.md.
  - Rationale: Smooths spikes and isolates failures.

### 7) Security and Compliance

- Action: Enforce Helmet, rate limiting (express-rate-limit), CSRF (csrf-csrf), and CSP across Next.js and API layers; configure CORS by environment.
  - Rationale: Aligns with Guidelines and SECURITY.md.
- Action: Secret management via environment variables and GitHub Actions secrets; avoid committing credentials; add secret scanning.
  - Rationale: Reduce exposure risk.
- Action: Authentication via Auth.js (NextAuth v5) with Redis session store; short-lived signed service tokens (JWK) for edge devices.
  - Rationale: Secure, scalable auth.

### 8) Observability and Performance

- Action: Integrate OpenTelemetry for traces/metrics; export to Prometheus/Grafana; add Sentry for errors.
  - Rationale: Faster diagnosis and SLO tracking.
- Action: Add caching layers (Redis) for hot endpoints; enable HTTP compression and static asset caching.
  - Rationale: Latency reduction and cost control.

### 9) Testing and Quality

- Action: Standardize on Vitest for unit/integration; configure jsdom, setup file, and mocks (IntersectionObserver, storage, fetch, ws, RAF).
  - Rationale: Matches Guidelines and speeds feedback.
- Action: E2E with Cypress for critical flows (auth, tournament, match reporting, territory claim).
  - Rationale: User-facing reliability.
- Action: CI gates: type check, lint, test, coverage thresholds; add UI and watch modes for dev.
  - Rationale: Quality bar before deploys.

### 10) DevOps, CI/CD, and Docker

- Action: Maintain multi-stage Docker builds; combine services under docker-compose for local; ensure ports 3000/5000/8080 free.
  - Rationale: Reproducible environments.
- Action: GitHub Actions: build, test, scan (Trivy/CodeQL), and deploy; cache dependencies; artifacts for coverage and build outputs.
  - Rationale: Speed and security.
- Action: Nginx/Supervisor or managed hosting (Vercel for web); document reverse proxy, headers, and WebSocket upgrades.
  - Rationale: Production readiness.

### 11) Data and State Management

- Action: Use TanStack Query for server state and caching; Zustand for local UI state; Zod for schemas.
  - Rationale: Predictable state and validation.
- Action: Define data retention and PII handling; add privacy policy alignment.
  - Rationale: Compliance and trust.

### 12) Documentation and Developer Experience

- Action: Update ARCHITECTURE.md and README.md to resolve contradictions (Next version, database).
  - Rationale: Single source of truth.
- Action: Verify docs/venues/requirements.md exists and keep it updated; ensure docs/venues/README.md link remains correct.
  - Rationale: Broken link fix and completeness.
- Action: Provide "first 15 minutes" contributor guide (setup, scripts, ports, common pitfalls).
  - Rationale: Lower onboarding friction.

---

## Phased Roadmap (Prioritized)

- Phase 0: Discovery and Alignment (1–2 weeks)
  - Decide database canonical choice (PostgreSQL + Prisma) and document migration path from any Mongo usage.
  - Lock framework versions (Next 15.x, TS 5.8.x, React 18.2) and update configs.
  - Fix broken docs links (e.g., venues/requirements.md), and reconcile README vs ARCHITECTURE.md.

- Phase 1: Hardening and Observability (2–3 weeks)
  - Implement Helmet, rate limiting, CSRF, CSP, and CORS policies.
  - Add OpenTelemetry, Prometheus, Sentry; dashboards for key services.
  - Establish CI gates (lint, type-check, tests, coverage); add CodeQL/Trivy.

- Phase 2: Real-time and AI Service Stabilization (2–3 weeks)
  - Introduce Socket.io Redis adapter and room conventions; add reconnection/backpressure.
  - Define contracts for Python services; add retries/timeouts; integrate BullMQ for async tasks.

- Phase 3: Performance and DX (2–3 weeks)
  - Image optimization, code splitting, caching; Redis for API caching; compress responses.
  - DX: consolidate UI library usage, path aliases, and strict TS; update contributor docs.

- Phase 4: Feature Evolution (ongoing)
  - Tournaments v2 (brackets, analytics), Territory wars scaling, AI commentary improvements, and blockchain features as toggled modules behind feature flags.

---

## Risks and Mitigations

- Conflicting database strategies (Mongo vs Postgres): choose canonical, document deprecations, phased migration.
- Version upgrades risk regressions: use canary branches, feature flags, and QA passes.
- Real-time scale issues: load test rooms and adapter behavior pre-production; set rate limits.
- AI service instability: isolate via queues and timeouts; fallbacks to heuristic logic.

---

## Acceptance Criteria for This Plan

- Documentation unifies on framework/database versions and ports.
- Security and observability requirements are explicit and testable.
- Real-time, AI, and database boundaries are defined with contracts and phases.
- Broken documentation references are logged with remediation steps.
- This plan file (docs/plan.md) exists and is organized by clear sections with rationale for each proposed change.

# DojoPool Improvement Plan — Venue-Focused Addendum

Generated: 2025-08-24 02:20 local time

Source for this addendum: docs/venues/requirements.md (venue integration requirements). This addendum maps venue constraints to concrete system improvements and complements the general plan sourced from docs/requirements.md.

---

## Extracted Goals and Constraints (from docs/venues/requirements.md)

- Network
  - Minimum bandwidth: 100 Mbps down / 20 Mbps up; Recommended: 300 Mbps+ symmetrical fiber
  - Latency: < 50 ms to nearest DojoPool region
  - Wi‑Fi: Dual-band (2.4/5 GHz), WPA2/3, guest network segmented
  - LAN: Gigabit Ethernet for camera gateways and edge devices
  - Security: NAT/firewall enabled; allow outbound HTTPS (443) and WebSocket upgrades only
- Power and Environment
  - Surge protection and UPS for critical devices
  - Adequate lighting for reliable computer vision
  - Temperature‑controlled equipment areas
- Hardware per table
  - Overhead camera 1080p@30fps+; stable, unobstructed top‑down mount
  - Edge compute/gateway optional (if not cloud‑only)
  - QR signage for player/table check‑in
- Displays
  - Venue dashboard (HDMI display/TV); optional per‑table displays for live scoring
- Staff Devices
  - Staff workstation with Chrome/Edge; mobile devices for QR scanning
- Software and Accounts
  - Venue account with verified email; least‑privilege roles for staff
  - Latest Chrome/Edge; cookies and localStorage enabled
- Security and Compliance
  - Strong passwords and 2FA for admin accounts
  - HTTPS‑only for management interfaces; physical security for cameras/gateways
  - Privacy compliance; display notice of video analytics usage
- Installation Checklist
  - Bandwidth/Wi‑Fi verified; cameras mounted/calibrated; gateways connected
  - Venue dashboard accessible; staff trained; end‑to‑end test of match/tournament
- Support
  - 24/7 support email/phone; Help Center link

---

## Improvement Plan by Theme (with Rationale and Mapping)

Each item includes a short rationale and a mapping to the constraints above.

### 1) Network and Connectivity

- Implement adaptive real‑time transport with graceful degradation (WebSocket primary, SSE/polling fallback).
  - Rationale: Ensures operation when only outbound 443 with potential proxies is allowed; meets “allow outbound HTTPS and WS upgrades” constraint.
  - Maps to: Network: Security; Latency < 50 ms.
- Add connection health monitoring per venue/table (latency, jitter, packet loss) and expose on the venue dashboard.
  - Rationale: Staff visibility for diagnosing Wi‑Fi/LAN issues; supports installation checklist and ongoing ops.
  - Maps to: Network bandwidth/latency; Displays.
- Provide bandwidth budgeting guidance and rate limiting for per‑table event streams (configurable FPS/event rate).
  - Rationale: Multiple tables can saturate uplink; avoid backpressure failures.
  - Maps to: Network bandwidth; LAN gigabit.

### 2) Edge Hardware and Computer Vision Pipeline

- Offer two modes: cloud‑only and edge‑assisted CV; auto‑detect edge gateway presence and configure pipeline accordingly.
  - Rationale: Some venues deploy gateways; others rely on cloud; flexibility reduces barriers.
  - Maps to: Hardware per table (edge optional).
- Add camera capability validation and guided calibration workflow (top‑down alignment, lighting test, FPS test) in onboarding.
  - Rationale: Reliable CV needs proper mounting/lighting; reduces false positives.
  - Maps to: Hardware per table; Power/Environment (lighting).
- Implement frame sampling and ROI processing to meet 1080p@30fps while respecting bandwidth; store calibration profiles per table.
  - Rationale: Performance and cost control.
  - Maps to: Hardware (camera), Network.

### 3) Installation and Operations

- Build an Installation Wizard (web) for venue onboarding: network checks, camera detection, calibration, gateway pairing, and E2E test.
  - Rationale: Codifies the “Installation Checklist” into a guided process; reduces support load.
  - Maps to: Installation Checklist; Staff Devices; Displays.
- Add printable QR signage generator with per‑table deep links and table identity binding.
  - Rationale: Streamlines check‑in and table assignment.
  - Maps to: Hardware per table (QR signage).
- Provide a “Venue Opening/Closing” SOP screen with automated checks (device online, FPS within range, UPS status) and logs.
  - Rationale: Operational hygiene and audit trail.
  - Maps to: Power/Environment; Installation Checklist.

### 4) Security and Compliance

- Enforce 2FA for venue admin roles and recommend FIDO2/WebAuthn where possible.
  - Rationale: Hardens high‑privilege accounts.
  - Maps to: Security and Compliance (2FA, strong passwords).
- Device and gateway identity: issue signed device tokens (short‑lived), rotate regularly, and pin TLS; record serials and physical location.
  - Rationale: Prevents rogue device ingestion; supports physical security policies.
  - Maps to: Security and Compliance; LAN/Gateway.
- Add privacy features: configurable retention for video frames/metadata; automatic on‑prem buffering with PII minimization; display notice templates.
  - Rationale: Compliance with local privacy laws; aligns with requirement to display analytics notice.
  - Maps to: Security and Compliance.
- Restrict management interfaces to HTTPS‑only; add CSP/CSRF/rate limiting presets for venue contexts.
  - Rationale: Defense‑in‑depth per Security guidelines.
  - Maps to: Security and Compliance; Software and Accounts.

### 5) Frontend UX for Venue Operations

- Venue Dashboard enhancements: per‑table status (camera online/FPS, calibration OK, network health, match status), alerts, and quick actions.
  - Rationale: Staff situational awareness and fast remediation.
  - Maps to: Displays; Staff Devices.
- Mobile flows: fast QR scan, assign players to tables, start/pause/resume matches, annotate events.
  - Rationale: Staff mobility and speed.
  - Maps to: Staff Devices; QR signage.
- Accessibility and offline‑tolerant UI (local cache, retry queues).
  - Rationale: Intermittent connectivity in venues; preserves operations.
  - Maps to: Network constraints.

### 6) Backend APIs, Real‑time, and Resilience

- Define stable contracts for event ingest from edge/cloud CV pipelines (JSON schemas; versioned topics).
  - Rationale: Decouples producers/consumers and supports evolution.
  - Maps to: Hardware/CV; Network.
- Introduce backpressure and idempotency for match events; queue bursts (BullMQ/Redis) and de‑dupe by event ID.
  - Rationale: Prevents double‑counting and overload.
  - Maps to: Network bandwidth variability; Real‑time scaling.
- Use Socket.io Redis adapter for horizontal scaling and per‑venue/table rooms; emit health pings and receive ACKs.
  - Rationale: Reliable real‑time across many tables.
  - Maps to: Network; Displays.

### 7) Observability and Support

- Per‑venue telemetry: camera FPS, calibration confidence, detection latency, dropped frames, gateway CPU/temp, network RTT.
  - Rationale: Enables proactive support and SLOs.
  - Maps to: Power/Environment; Network; Hardware.
- Alerting policies for critical thresholds (camera offline, FPS < 20, RTT > 100ms, UPS on battery).
  - Rationale: Rapid response; reduces downtime.
  - Maps to: Installation Checklist; Support.
- Support tooling: one‑click diagnostics bundle (logs, configs, recent events) for support@dojopool.com.
  - Rationale: Speeds triage; aligns with 24/7 support.

### 8) Testing and Validation

- Add automated checks in CI for venue constraints (lint rule set + config tests ensuring required env flags like 2FA enforced in prod).
  - Rationale: Prevents regressions breaking venue policies.
  - Maps to: Security and Compliance.
- Hardware‑in‑the‑loop test profiles (mock camera streams at 1080p@30fps, lighting variance) for the CV pipeline.
  - Rationale: Validate real‑world conditions early.
  - Maps to: Hardware; Power/Environment.
- E2E tests for installation wizard, QR flows, match lifecycle, and dashboard alerts using Cypress.
  - Rationale: Safeguard critical venue operations.
  - Maps to: Installation Checklist; Staff Devices; Displays.

### 9) Deployment and Configuration

- Provide Docker Compose profiles: venue‑sandbox (single table), venue‑multi (4–8 tables), with resource budgets and port mappings (3000/5000/8080).
  - Rationale: Realistic test environments for integrators.
  - Maps to: Network and Ports.
- Configuration as code: per‑venue JSON/YAML with schema validation (Zod/JSON Schema) for tables, devices, and network thresholds.
  - Rationale: Repeatable setups; safer changes.
  - Maps to: Installation Checklist; Software and Accounts.

### 10) Data Handling and Privacy

- Minimize PII in telemetry; store only necessary metadata; document retention windows and data export tools for venues.
  - Rationale: Compliance and trust.
  - Maps to: Security and Compliance.
- Anonymize or hash identifiers where possible; encrypt data at rest and in transit.
  - Rationale: Reduce breach impact.
  - Maps to: Security and Compliance.

---

## Phased Venue Rollout Roadmap

- Phase V0: Readiness (1–2 weeks)
  - Implement installation wizard MVP (network checks, camera detection, calibration flow).
  - Add venue dashboard health widgets and basic alerts.
  - Enforce admin 2FA and management HTTPS‑only.
- Phase V1: Real‑time Robustness (2–3 weeks)
  - Introduce Redis adapter, event idempotency, and backpressure.
  - Add connection health pings and adaptive fallback transport.
- Phase V2: Edge/Cloud Flexibility (2–3 weeks)
  - Toggleable CV pipeline (edge vs cloud), frame sampling configuration, and gateway identity.
  - Diagnostics bundle and enhanced telemetry.
- Phase V3: Compliance and Privacy (ongoing)
  - Data retention controls, notice templates, and audit logging.
  - Expand hardware‑in‑the‑loop tests and E2E coverage.

---

## Risks and Mitigations (Venue Context)

- Unreliable Wi‑Fi or high latency: fall back to lower update rates and offline queueing; surface alerts to staff.
- Mis‑mounted or low‑quality cameras: mandatory calibration checks and confidence gating before enabling automated scoring.
- Edge device failure/overheating: UPS and thermal telemetry; auto‑failover to cloud mode when possible.
- Staff account misuse: enforce least privilege, mandatory 2FA, and session anomaly detection.

---

## Acceptance Criteria for This Addendum

- Plan clearly references and maps improvements to constraints listed in docs/venues/requirements.md.
- Sections are organized by system themes with explicit rationale.
- Provides a phased rollout tailored to venue operations and constraints.
- Lives in docs/plan.md alongside the general improvement plan.
