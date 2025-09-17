# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable Corepack for Yarn 4.x
RUN corepack enable

# Pre-download yarn with increased timeout
ENV COREPACK_NETWORK_TIMEOUT=300000
RUN corepack prepare yarn@stable --activate

# Copy package files
COPY package.json yarn.lock ./
COPY apps/web/package.json apps/web/package.json

RUN COREPACK_NETWORK_TIMEOUT=300000 yarn install

# Copy source code
COPY . .

RUN COREPACK_NETWORK_TIMEOUT=300000 yarn build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
