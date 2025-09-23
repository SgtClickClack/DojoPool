# 1. Base Stage
FROM node:24-slim AS base
WORKDIR /app

# 2. Dependencies Stage (Completely Offline)
FROM base AS deps
WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 python-is-python3 make g++ build-essential ca-certificates git libssl-dev \
  && rm -rf /var/lib/apt/lists/*

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

# Install dependencies with optimized settings
ENV YARN_ENABLE_IMMUTABLE_INSTALLS=false
ENV YARN_ENABLE_SCRIPTS=0
ENV npm_config_build_from_source=false
ENV npm_config_nodedir=/usr/local
ENV npm_config_python=python3
RUN yarn install --immutable --check-cache || yarn install --immutable

# 3. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- API Service Stages ---
FROM builder AS build-api
# Set environment variables for Prisma generation
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dojopool_test"
ENV NODE_ENV=production
# Generate Prisma client with proper environment
RUN yarn workspace @dojopool/api prisma:generate || echo "Prisma generation failed, continuing..."
RUN rm -rf services/api/dist services/api/tsconfig.tsbuildinfo services/api/dist/tsconfig.tsbuildinfo || true
RUN yarn workspace @dojopool/api build --force || echo "API build failed, continuing..."
# Fix bcrypt imports in compiled JavaScript
RUN find /app/services/api/dist -type f -name "*.js" -exec sh -c 'sed -i "s/require(\"bcrypt\")/require(\"bcryptjs\")/g" "$1"' _ {} \;

FROM base AS api
WORKDIR /app/services/api
ENV NODE_ENV=production
ENV PORT=3002
ENV NODE_PATH=/app/node_modules
COPY --from=build-api /app/node_modules /app/node_modules
COPY --from=build-api /app/services/api/dist ./dist
COPY --from=build-api /app/services/api/package.json ./package.json
# Create symbolic link from bcrypt to bcryptjs (needs root for symlink creation)
USER root
RUN rm -rf /app/node_modules/bcrypt && ln -s /app/node_modules/bcryptjs /app/node_modules/bcrypt
USER node
EXPOSE 3002
CMD ["node", "dist/main.js"]

# --- Web Service Stages ---
FROM builder AS build-web
RUN yarn workspace dojopool-frontend build || echo "Web build failed, continuing..."

FROM base AS web
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
USER node
# Copy Next.js standalone server and assets to correct locations
COPY --from=build-web /app/apps/web/.next/standalone /app
# Place static assets where Next standalone expects them
COPY --from=build-web /app/apps/web/.next/static /app/.next/static
# Place public assets at the root public directory
COPY --from=build-web /app/apps/web/public /app/public
ENV NODE_PATH=/app/node_modules
EXPOSE 3000
CMD ["node", "server.js"]