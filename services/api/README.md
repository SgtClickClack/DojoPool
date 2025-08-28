# DojoPool API (NestJS)

Clean, rebuilt NestJS backend service as part of the monorepo.

## Prerequisites

- Node.js 20+
- pnpm preferred (workspace already configured)
- A PostgreSQL database and a DATABASE_URL env var

## Environment

Create a .env file in services/api with:

```
DATABASE_URL="postgresql://user:password@localhost:5432/dojopool?schema=public"
PORT=8080
```

## Install

From the monorepo root:

```
pnpm install
```

Or inside this service:

```
cd services/api
pnpm install
```

## Prisma

Generate Prisma Client:

```
cd services/api
pnpm exec prisma generate
```

(Optional) Create and run an initial migration:

```
pnpm exec prisma migrate dev --name init
```

## Run (development)

```
cd services/api
pnpm run start:dev
```

The API will start on http://localhost:8080

## API Endpoints

- POST /v1/users -> create user (email, username, passwordHash)
- GET /v1/users -> list users

## Notes

- PrismaService connects automatically on boot.
- Replace passwordHash handling with secure hashing before production.
- Extend the schema.prisma and add modules per ARCHITECTURE.md progressively.
