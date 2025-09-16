# 1. Base Stage
FROM node:20-alpine AS base
WORKDIR /app

# 2. Dependencies Stage (Completely Offline)
FROM base AS deps
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy Yarn configuration (temporarily enable network for first build)
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
COPY package.json yarn.lock ./
COPY apps/web/package.json ./apps/web/
COPY services/api/package.json ./services/api/
COPY packages/config/package.json ./packages/config/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/

# Install dependencies using prepopulated offline cache and skip builds
ENV YARN_ENABLE_IMMUTABLE_INSTALLS=false
RUN yarn install --immutable --mode=skip-build --inline-builds=0

# 3. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- API Service Stages ---
FROM builder AS build-api
RUN yarn workspace @dojopool/api build

FROM base AS api
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
USER nestjs
COPY --from=build-api /app/node_modules ./node_modules
COPY --from=build-api /app/services/api/dist ./services/api/dist
COPY --from=build-api /app/package.json ./
EXPOSE 3002
CMD ["yarn", "workspace", "@dojopool/api", "start:prod"]

# --- Web Service Stages ---
FROM builder AS build-web
RUN yarn workspace dojopool-frontend build

FROM base AS web
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
USER nextjs
COPY --from=build-web --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build-web --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=build-web --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]