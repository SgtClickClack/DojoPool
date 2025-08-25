AI Assistant Directives for DojoPool

Purpose

- Ensure that any code generation or refactoring performed by AI tools in this repository adheres strictly to the DojoPool technology stack and conventions.

Directives

1. Adhere to Project Stack
   - Backend: NestJS (Node.js, TypeScript)
   - Frontend: Next.js (React 18, TypeScript)
   - Database: Prisma ORM (with PostgreSQL unless otherwise specified)
   - Real-time: Socket.io
   - AI/ML: TensorFlow.js (client) and OpenAI API integrations

2. Prefer Modern Patterns
   - React: Functional components with Hooks only. No class components.
   - State: React Query and Context API where applicable; avoid legacy patterns.
   - API: Use REST or tRPC conventions consistent with existing code; prefer typed clients.
   - Styling: Prefer existing UI libraries (Chakra UI, MUI, Ant Design) per feature ownership; avoid introducing new styling systems.

3. Project Conventions
   - TypeScript: Strict mode; no implicit any. Use generics and discriminated unions where appropriate.
   - Imports: Use path alias @/\* where available; no deep relative paths beyond ../.. when alias exists.
   - Errors: Provide typed error handling; never swallow errors.
   - Security: Follow SECURITY.md and OWASP basics; never log secrets.

4. Testing
   - Use Vitest with jsdom for component tests and the configured setup in src/tests.
   - Add tests under src/tests or co-located **tests** with .test.ts(x) suffix.

5. Performance & Accessibility
   - Favor code splitting, memoization (useMemo/useCallback), and accessibility attributes (ARIA) per component library best practices.

Notes

- Do not introduce frameworks outside the stack (e.g., Express raw, Koa, Vue, Svelte) unless explicitly requested and justified.
- Keep dependencies minimal; prefer built-ins and existing utilities in src/utils.
