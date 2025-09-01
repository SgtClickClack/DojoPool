# DojoPool API (NestJS)

Clean, rebuilt NestJS backend service as part of the monorepo.

## Prerequisites

- Node.js 20+
- Yarn v4 preferred (workspace already configured)
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
yarn install --immutable
```

Or inside this service:

```
cd services/api
yarn install --immutable
```

## Prisma

Generate Prisma Client:

```
cd services/api
yarn prisma generate
```

(Optional) Create and run an initial migration:

```
yarn prisma migrate dev --name init
```

## Run (development)

```
cd services/api
yarn start:dev
```

The API will start on http://localhost:3002

## API Endpoints

- POST /v1/users -> create user (email, username, passwordHash)
- GET /v1/users -> list users

## Notes

- PrismaService connects automatically on boot.
- Replace passwordHash handling with secure hashing before production.
- Extend the schema.prisma and add modules per ARCHITECTURE.md progressively.
