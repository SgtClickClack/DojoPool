# DojoPool Improvement Tasks (2025-08-24)

Note: Each actionable item begins with a check placeholder. Tackle in order for maximum impact and reduced churn.

1. [x] Establish environment baselines across stacks
   - [x] Pin Node.js to 20.x via .nvmrc/.node-version or Volta and document in README
   - [x] Pin Python runtime for Flask and document (pyproject/requirements alignment)
   - [x] Normalize env files (config.env, [ENV].flaskenv) and generate a single schema source of truth used by scripts\validate-env.mjs
   - [x] Expand env:check to validate missing/invalid values with friendly hints for common dev/prod setups

2. [ ] Repository hygiene and consolidation
   - [ ] Inventory and de-duplicate legacy directories (DojoPool*, Dojo_Pool*, "Dojo Pool*", combined/, pages-backup/)
   - [x] Use scripts\report-duplicates.mjs to produce a report and plan moves/deletions
   - [ ] Migrate any living code from legacy dirs into apps/web or services/api, then remove stale copies
   - [x] Ensure .gitignore covers generated/, lcov-report/, coverage/, .next/, dist/

3. [ ] Align build systems (Vite dev, Next prod)
   - [ ] Confirm Vite dev proxy aligns with Next rewrites (API_BASE_URL) for consistent API paths
   - [ ] Document dev vs prod URL matrix and ports (3000, 3001, 3002, 5000, 8080)
   - [ ] Validate investor-portal assets routing (/investor-portal, /invest/*) and add automated test to protect rewrites

4. [ ] Tighten TypeScript boundaries and CI behavior
   - [ ] Re-enable type checking in CI: keep next.config.js ignore in local builds but fail CI on type errors (npm run type-check)
   - [ ] Reduce over-broad tsconfig.json excludes; include critical src paths and ensure tests compile under Vitest configs
   - [ ] Ensure path alias parity across tsconfig, Vitest, Next/Vite (currently @ -> /src in vitest; tsconfig maps @/* to multiple roots)
   - [ ] Add project references if splitting backend/frontend tsconfigs for faster, isolated builds

5. [ ] Linting/formatting consistency
   - [ ] Run eslint 9 across src/ and services/ with autofix; address remaining rule violations
   - [ ] Add lint/type-check steps to test:ci to enforce quality gates
   - [ ] Ensure Prettier config is consistent and format:check runs in CI

6. [ ] Security hardening (frontend and backend)
   - [ ] Review Next.js CSP: remove 'unsafe-eval'/'unsafe-inline' by introducing script nonces or hashes; split dev vs prod policies
   - [ ] Add/verify Helmet and CORS configuration on backend (NestJS or Express adapters) with least-privilege origins
   - [ ] Implement CSRF protection for state-changing routes where applicable
   - [ ] Audit dependencies (npm audit, custom policy) and document remediation process
   - [ ] Secrets management: ensure no secrets in repo; integrate secret scanning pre-commit and CI

7. [ ] Backend (NestJS) API correctness and DX
   - [x] Replace inline DTOs in controllers (e.g., services/api/src/venues/venues.controller.ts) with exported classes using class-validator/class-transformer decorators
   - [x] Enable global ValidationPipe with whitelist/forbidUnknownValues
   - [ ] Standardize error handling via exception filters and consistent response shapes
   - [ ] Add rate limiting (@nestjs/throttler or express-rate-limit) to sensitive endpoints
   - [ ] Introduce API versioning strategy (URL or header) consistently (v1 used in venues)

8. [ ] Database layer (Prisma) robustness
   - [ ] Ensure JSON fields (e.g., aiAnalysisJson) are stored as Prisma.JsonValue (no manual stringify/parse)
   - [ ] Add migration to adjust column types where required and create indexes on frequently queried fields
   - [ ] Wrap multi-step updates (e.g., finalizeMatch) in transactions to keep data consistent
   - [ ] Add repository/service unit tests around query boundaries and error cases

9. [ ] AI/ML service integration
   - [ ] Define stable input/output types for AiAnalysisService and use zod or io-ts to validate generated payloads
   - [ ] Add fallbacks and circuit breakers around external AI calls; log with correlation IDs
   - [ ] Store analysis metadata (model, prompt version, latency) for observability

10. [ ] Real-time infrastructure
    - [ ] Standardize Socket.io namespaces/events and document contracts (event name, payload schema)
    - [ ] Implement heartbeat/keepalive and backoff reconnection in useGameSocket hook
    - [ ] Rate-limit client events and add server-side spam protection
    - [ ] Add integration tests that simulate socket flows and reconnection

11. [ ] Frontend quality and resilience
    - [ ] Strengthen types in RealTimeGameView and related hooks (nullability, union types), add memoization
    - [ ] Add error boundaries and suspense patterns for live game sections
    - [ ] Improve accessibility (aria-live for live updates, keyboard interactions)
    - [ ] Audit bundle size: verify splitChunks groups (vendor/mui) actually reduce TTI; add bundle analyzer script

12. [ ] Testing strategy upgrades (Vitest)
    - [ ] Stabilize and unskip excluded unit tests in vitest.unit.config.ts (AIPoweredMatchAnalysisService, RealTimeAICommentaryService, etc.)
    - [ ] Add unit tests for DTO validation errors and service happy/edge paths
    - [ ] Add integration tests for finalizeMatch and getMatchWithAnalysis (including bad JSON handling)
    - [ ] Raise coverage thresholds gradually (e.g., +5% per milestone) once flakes resolved
    - [ ] Ensure WebSocket and browser API mocks cover edge cases (disconnects, timeouts)

13. [ ] Observability and monitoring
    - [ ] Standardize Winston logger configuration (JSON format, levels, redact PII) across backend services
    - [ ] Add Prometheus metrics for API latency, error rates, Socket.io connections
    - [ ] Introduce basic tracing (OpenTelemetry) with request IDs propagated to logs
    - [ ] Add /health and /ready endpoints and ensure Next rewrite to /api/health remains correct

14. [ ] Performance and scalability
    - [ ] Verify Prisma connection pooling and timeouts; set sane defaults for prod
    - [ ] Add HTTP compression and fine-tuned cache headers for static assets
    - [ ] Optimize image domains/quality configs; validate AVIF/WebP fallbacks
    - [ ] Profile heavy React components; virtualize lists where needed

15. [ ] CI/CD pipeline
    - [ ] Create/update GitHub Actions (or equivalent) with jobs: install (npm ci), lint, type-check, test:ci, build, docker build
    - [ ] Cache Node modules and Prisma engines between CI runs
    - [ ] Add Qodana scan and fail on critical issues; publish HTML reports as artifacts
    - [ ] Add container scanning (e.g., Trivy) on Docker images in CI

16. [ ] Docker and deployment
    - [ ] Validate multi-stage Dockerfile: non-root user, minimal attack surface, HEALTHCHECK
    - [ ] Ensure environment variables are injected safely at runtime; avoid baking secrets into images
    - [ ] Confirm Nginx + Supervisor config aligns with ports and Next standalone output
    - [ ] Add compose profiles for local dev (frontend/backend/db/redis)

17. [ ] Documentation improvements
    - [ ] Keep ARCHITECTURE.md and README synced with current build/test commands and ports
    - [ ] Add CONTRIBUTING updates for test writing (unit/integration) and environment bootstrapping on Windows
    - [ ] Maintain a CHANGELOG and ADRs for important decisions (e.g., CSP changes, API versioning)
    - [ ] Ensure ai-docs reflect current AI integration contracts

18. [ ] Access control and authentication
    - [ ] Centralize auth utilities and types; ensure token rotation and refresh flow is documented and tested
    - [ ] Add role-based access checks to venue/match endpoints where applicable
    - [ ] Add negative tests for unauthorized/forbidden paths

19. [ ] Data validation and sanitization
    - [ ] Apply input sanitization (express-validator or Nest pipes) to all external inputs
    - [ ] Normalize server responses (camelCase, consistent envelopes)
    - [ ] Add schema validators for WebSocket payloads (zod) and reject invalid events

20. [ ] Error handling and user feedback
    - [ ] Implement global frontend error boundary with reporting hook
    - [ ] Map backend error codes to user-friendly messages in UI
    - [ ] Add retry with jitter for transient failures in data fetching

21. [ ] Feature flags and configuration
    - [ ] Introduce a simple feature flag system (env-based or config service) to gate experimental features
    - [ ] Document rollout plans and kill switches for real-time/AI features

22. [ ] Code ownership and review quality
    - [ ] Add CODEOWNERS for critical paths (services/api, src/dojopool/frontend)
    - [ ] Adopt PR templates and enforce status checks (lint, type-check, tests)

23. [ ] Accessibility and internationalization
    - [ ] Run axe-core checks in unit tests for critical components
    - [ ] Prepare i18n scaffolding (react-intl or next-intl) and externalize user-visible strings

24. [ ] Data lifecycle and privacy
    - [ ] Define retention policies for logs and AI analyses
    - [ ] Add GDPR-friendly data export/delete endpoints where applicable

25. [ ] Task automation and housekeeping
    - [ ] Wire scripts\tasks-sync.mjs to sync this checklist with GitHub Issues or a project board
    - [ ] Schedule dependency updates (Renovate/Dependabot) with grouping rules to reduce noise

26. [ ] Real-time fraud/abuse prevention
    - [ ] Add server-side rate limiting per user/IP for gameplay events
    - [ ] Implement anomaly detection hooks for unrealistic shot frequencies

27. [ ] Frontend state management consistency
    - [ ] Audit React Query usage; ensure cache keys and stale times are tuned
    - [ ] Migrate ad-hoc context to well-defined providers with typed contracts

28. [ ] Offline readiness and resilience
    - [ ] Add basic offline handling (service worker optional) for non-game pages
    - [ ] Graceful degradation when sockets are unavailable

29. [ ] Migrations and seeding
    - [ ] Create deterministic seed data for development and integration tests
    - [ ] Add migration verification in CI (prisma migrate diff/check)

30. [ ] Monitoring of regressions
    - [ ] Track bundle size thresholds and alert on growth beyond budget
    - [ ] Set test flakiness watchlist and auto-open tasks when retries exceed limits

31. [ ] Cleanup dead code and scripts
    - [ ] Remove superseded scripts (multiple git_* variants) keeping one canonical toolchain
    - [ ] Delete duplicate [PKG]/[LINT]/[DOC] files after consolidating their content

32. [ ] Windows developer experience
    - [ ] Ensure all scripts are PowerShell-friendly; provide Unix equivalents where reasonable
    - [ ] Keep scripts\cleanup-node-processes.ps1 documented and referenced in troubleshooting

33. [ ] Release management
    - [ ] Define release cadence and semantic versioning; publish artifacts (Docker images, changelogs)
    - [ ] Tag releases and attach build provenance

34. [ ] Web3/Blockchain integration sanity checks
    - [ ] Audit ethers.js usage for network/provider handling and failure modes
    - [ ] Add integration tests using a local chain or mocks

35. [ ] 3D/Graphics performance (Three.js/R3F)
    - [ ] Verify peer dependency alignment to avoid warnings; lock to compatible versions
    - [ ] Profile render loops and ensure disposal/cleanup of WebGL resources

36. [ ] Redis caching and sessions
    - [ ] Add Redis connection health checks and timeouts
    - [ ] Cache hot reads with sensible TTLs and cache busting on writes

37. [ ] Rate limiting and abuse caps across APIs
    - [ ] Global rate limit policy; per-user and per-IP rules with burst allowances
    - [ ] Include headers (Retry-After) and structured error payloads

38. [ ] API documentation and clients
    - [ ] Generate OpenAPI/Swagger for NestJS endpoints; publish via docs route
    - [ ] Add typed API clients in frontend using OpenAPI-generated SDK or tRPC alternative

39. [ ] Investment portal SPA
    - [ ] Validate routing/asset placement and security headers (no iframing, CSP)
    - [ ] Add minimal smoke tests to ensure availability via Next rewrites

40. [ ] De-risk Next.js build behavior
    - [ ] Periodically run strict env check before preview (npm run env:check:strict) in CI
    - [ ] Add compile-time checks for server-only vs client components where applicable
