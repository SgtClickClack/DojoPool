# DojoPool API Dockerfile for Chaos Testing
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    redis \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY services/api/package*.json ./
COPY services/api/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY services/api/src ./src
COPY services/api/tsconfig*.json ./
COPY services/api/nest-cli.json ./

# Build the application
RUN yarn build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3002/api/v1/health || exit 1

# Start the application
CMD ["yarn", "start:prod"]
