# DojoPool Tasks Status (Truthful Audit)

Date: 2025-08-13

Summary:

- In a previous commit, all items in docs/tasks.md were marked as completed ([x]) without the actual work being performed. This was incorrect.
- To correct the record, docs/tasks.md has been reset to unchecked ([ ]) and a note was added at the top clarifying the status.

What was actually done:

- Only the checklist file was modified previously; no corresponding implementation, configuration, testing, or documentation changes were made to satisfy the items.

Next steps (proposed verification/implementation plan):

1. Hygiene pass: remove stale "- Copy" config files and consolidate Vite/Vitest/Next/TS aliases. Create docs/env.example and update README to a single dev flow.
2. Security pass: run ESLint security rules, review CSP/headers in next.config.js, and add/verify CSRF and secrets management notes.
3. Testing pass: ensure Vitest setup aligns with guidelines and add coverage thresholds; split configs for unit/integration if not already.
4. Backend/API pass: add error handling/logging scaffolding and minimal /health endpoints for Node and Flask; prepare OpenAPI stubs.
5. Docker/devops pass: verify Dockerfile stages and Docker Compose alignment for ports 3000/5000/8080.

Governance:

- All future checklist changes will be driven by actual code/config/docs updates and verified in PR descriptions.

If you want, I can begin with step 1 (Hygiene pass) and raise focused PRs per group of tasks to keep changes small and reviewable.

Duplicate config files identified (candidates for removal after verification):

- vite.config - Copy.js
- vite.config.d - Copy.ts
- vitest.config - Copy.ts
- vitest.integration.config - Copy.ts
- vitest.unit.config - Copy.ts

Planned removals (pending verification):

- Remove: vite.config - Copy.js (canonical: vite.config.ts)
- Remove: vite.config.d - Copy.ts (canonical: vite.config.d.ts)
- Remove: vitest.config - Copy.ts (canonical: vitest.config.ts)
- Remove: vitest.integration.config - Copy.ts (canonical: vitest.integration.config.ts)
- Remove: vitest.unit.config - Copy.ts (canonical: vitest.unit.config.ts)

Temporary Single Dev Flow (until README is updated):

- Frontend (dev, Vite): npm run dev (serves on http://localhost:3000, proxies /api to http://localhost:8080)
- Backend (Node/Express dev): npm run dev:server (expected on http://localhost:8080)
- Python/Flask (if used in dev separately): flask run --port 5000
- Tests: npm test (Vitest, jsdom), npm run test:watch, npm run test:coverage
- Build (prod Next.js): npm run build && npm run preview
- Environment: copy docs/env.example to .env and .flaskenv and fill values
- Ports to keep free: 3000 (frontend dev), 8080 (Node API dev), 5000 (Flask)
