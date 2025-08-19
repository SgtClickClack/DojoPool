# DojoPool Improvement Tasks Checklist

A logically ordered, actionable checklist spanning architecture, configuration, code quality, security, performance, testing, DX, and documentation. Each item starts with a checkbox for tracking. Complete earlier sections before tackling dependent work.

Note: As of this update, no items have been verified as completed. The previous commit mistakenly toggled checkboxes to [x] without performing the work. The checklist has been reset to [ ] to reflect the true status.

## 0. Project Hygiene and Baseline
[ ] 1. Consolidate duplicate config files and copies (e.g., vite/vitest configs and backups) to a single source of truth; remove stale "- Copy" variants after verification.
[ ] 2. Normalize Node, Python, and toolchain versions across Dockerfile, package.json, pyproject/requirements to match guidelines (Node 20+, TS 5.8.x, Python 3.11/3.12 target if feasible; verify Python 3.13 usage compatibility).
[ ] 3. Audit repository for large, generated, or environment-specific files accidentally committed (coverage, build artifacts, lcov HTML, screenshots); expand .gitignore accordingly.
[ ] 4. Centralize environment variables: document required vars in docs/env.example and validate presence at runtime for frontend (Next/Vite) and backends (Express/Flask).
[ ] 5. Verify ports and proxies alignment: Vite dev proxy (8080), Next rewrites (API_BASE_URL), Flask (5000), Socket.io endpoints; document a single dev startup flow in README.

## 1. Architecture and Boundaries
[ ] 6. Define clear module boundaries between frontend (Next apps), Node/Express API, and Flask services; add ADR documenting why hybrid backend is kept and responsibilities.
[ ] 7. Establish API gateway/proxy strategy: Next.js rewrites for production vs Vite dev proxy; ensure CORS, auth, and rate limiting live at the gateway.
[ ] 8. Introduce service contracts: OpenAPI/Swagger definitions for Node and Flask endpoints; generate client types for the frontend.
[ ] 9. Align path aliases across build systems (Vite, TS, Vitest, Jest if present, Next) so '@/…' consistently maps to ./src.
[ ] 10. Create shared types package (e.g., src/types or packages/types) for API DTOs, domain models, and events to reduce drift.

## 2. Frontend (Next.js + Vite Dev)
[ ] 11. Unify dev experience: confirm Vite usage is for dev only and Next for prod; ensure feature parity in env variables, routing, and asset handling.
[ ] 12. Harden next.config.js headers and CSP: parameterize connect-src for APIs, WebSocket, and analytics; minimize 'unsafe-eval/inline' in production.
[ ] 13. Review code splitting and image optimization settings; validate remote patterns and domains for images; ensure AVIF/WebP serving works in CI.
[ ] 14. Implement error boundaries and suspense fallbacks across major routes; add 404/500 pages and telemetry hooks.
[ ] 15. Standardize UI library usage (Chakra, MUI, AntD): define one primary library, or document clear usage rules to avoid bundle bloat.
[ ] 16. Verify SSR/ISR needs for data-heavy pages; add getServerSideProps/getStaticProps with incremental regeneration where applicable.

## 3. Node.js/Express Backend
[ ] 17. Add centralized error handling, logging (Winston), and structured response format (problem+json) across routes.
[ ] 18. Enforce security middleware: Helmet with strict CSP, rate limiting (express-rate-limit), input validation (express-validator), CORS policy by env.
[ ] 19. Add health, readiness, and liveness endpoints; include dependency checks (Mongo/Redis/External APIs) with timeouts.
[ ] 20. Implement configuration layer (convict/zod) with schema-validated env loading; avoid direct process.env access throughout code.
[ ] 21. Document API with OpenAPI and serve /docs; integrate request/response validation against schema.

## 4. Flask/Python Services
[ ] 22. Standardize Flask app factory pattern with Blueprints; centralize config per env; ensure Gunicorn workers number is configurable.
[ ] 23. Add pydantic or marshmallow request/response validation; consistent error handlers returning JSON.
[ ] 24. Implement logging config (JSON format) and Prometheus metrics endpoint; align labels with Node service metrics.
[ ] 25. Review Python version (Dockerfile uses 3.13.2) for third-party compatibility; pin compatible versions in requirements.txt.

## 5. Real-time (Socket.io/WebSockets)
[ ] 26. Inventory all real-time channels/events; create event contracts and TypeScript types; document backpressure and rate limiting.
[ ] 27. Add auth for Socket.io handshakes (JWT/cookies) and namespace-based authorization.
[ ] 28. Implement heartbeat and reconnect policies; measure latency and message dropped metrics.

## 6. Database and State
[ ] 29. Decide on primary data layer (Mongoose vs Prisma); avoid dual ownership for same models; document chosen approach.
[ ] 30. Add migrations strategy (Prisma migrate or Mongo migrations); create seed scripts and test fixtures.
[ ] 31. Define indexing strategy and TTL policies; add slow query logging and performance dashboards.
[ ] 32. Implement caching and invalidation with Redis for read-heavy endpoints; document key design and expirations.

## 7. AI/ML Integration
[ ] 33. Isolate OpenAI and TensorFlow.js usage behind service interfaces; add rate limiters, retries with jitter, and circuit breakers.
[ ] 34. Implement prompt and model configuration management; redact PII and secrets in logs.
[ ] 35. Add unit tests with mocked AI clients; deterministic seeds for TF.js where possible.

## 8. 3D Graphics (Three.js / React Three Fiber)
[ ] 36. Audit Three.js versions to resolve peer dependency warnings; align @react-three/fiber and drei versions.
[ ] 37. Lazy-load heavy 3D scenes; prefetch lightweight assets; add fallback UIs.
[ ] 38. Implement performance budget for frame time; log WebGL context loss and handle gracefully.

## 9. Testing (Vitest primary)
[ ] 39. Ensure jsdom setup covers IntersectionObserver, ResizeObserver, matchMedia, storage, fetch, WebSocket, RAF mocks as per guidelines.
[ ] 40. Split tests into unit, integration, and e2e; configure separate vitest configs already present (unit/integration) and CI pipelines.
[ ] 41. Add coverage thresholds and HTML/text reports; exclude generated and external code.
[ ] 42. Add React Testing Library patterns and custom render helpers; eliminate flaky timing with fake timers where suitable.

## 10. Security and Compliance
[ ] 43. Run and fix ESLint security plugin (.eslintrc.security.js) findings; integrate into CI to fail on new high-severity issues.
[ ] 44. Implement CSRF protection for cookie-based auth flows; verify sameSite/secure flags.
[ ] 45. Secrets management: remove any hardcoded tokens, rotate keys, and use .env and secret stores (GitHub Actions/Cloud) with least privilege.
[ ] 46. Formalize CSP per environment; document allowed origins for connect-src (API, WebSocket, analytics) and restrict in production.

## 11. Performance and Optimization
[ ] 47. Analyze Next.js and Vite bundles with analyzers; code-split vendor and UI libraries; deduplicate dependencies.
[ ] 48. Enable HTTP compression and proper cache-control for static assets in Nginx; verify immutable assets hashing.
[ ] 49. Add server-side caching layers and conditional requests (ETag/Last-Modified) for API endpoints.
[ ] 50. Load test critical endpoints and Socket.io channels; set SLOs and error budgets.

## 12. Observability and Monitoring
[ ] 51. Standardize logging formats (JSON) across Node and Flask; include request IDs and user IDs where applicable.
[ ] 52. Add Prometheus metrics for HTTP, DB, cache, and real-time events; expose /metrics; add Grafana dashboards.
[ ] 53. Centralize error tracking (Sentry or OpenTelemetry) across frontend and backend; propagate trace context.

## 13. CI/CD and Releases
[ ] 54. Create GitHub Actions workflows for: lint, type-check, tests (unit/integration), build, docker build, and security scans (npm audit, pip safety, trivy).
[ ] 55. Add preview deployments for PRs and versioned production releases; attach artifacts (coverage, bundle reports).
[ ] 56. Enforce conventional commits and automated changelog/versioning (changesets or semantic-release).

## 14. Developer Experience
[ ] 57. Unify scripts: npm run dev to concurrently start Vite frontend and backend (Node/Flask) with proxy; npm run build for Next production.
[ ] 58. Add lint-staged and Prettier integration; run ESLint/Prettier on staged files via pre-commit hook.
[ ] 59. Provide WebStorm/VS Code settings recommendations; enable TS path intellisense; add recommended extensions.

## 15. Documentation
[ ] 60. Update README with one-command dev startup and troubleshooting; link to guidelines and security notes.
[ ] 61. Add docs for architecture (current state and target), data flows, and sequence diagrams for core user journeys.
[ ] 62. Provide runbooks for incidents (API down, DB degraded, Socket.io disconnect storms, AI rate limiting) with mitigation steps.

## 16. Deployment & Docker
[ ] 63. Reconcile multi-stage Docker build: validate Node build stage path (src/dojopool/frontend) and Next static output; ensure Next standalone output is used if serving via Node or copied behind Nginx if static.
[ ] 64. Parameterize Gunicorn, Nginx, and Supervisor configs via env; add healthchecks and minimal privileges.
[ ] 65. Add Docker Compose for local dev aligning ports 3000/5000/8080 and dependencies (Mongo, Redis) with seeded data.

## 17. Data Privacy and Governance
[ ] 66. Implement data retention and deletion workflows; document PII handling and anonymization in logs and analytics.
[ ] 67. Add consent management and cookie banner integration if analytics/ads are used.

## 18. Risk, Deprecations, and Future Work
[ ] 68. Track Three.js and R3F breaking changes and plan periodic upgrades with lockfile maintenance.
[ ] 69. Create deprecation plan for any duplicate or legacy modules (older routes, test harnesses, or experimental scripts in root) to reduce surface area.
[ ] 70. Schedule quarterly dependency upgrades and vulnerability triage with an automated issue created by CI.
