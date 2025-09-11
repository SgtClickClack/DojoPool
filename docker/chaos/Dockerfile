# Chaos Testing Orchestrator Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    redis \
    curl \
    bash \
    jq \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy chaos testing suite
COPY services/api/scripts/chaos-testing-suite.js ./chaos-testing-suite.js
COPY services/api/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S chaos
RUN adduser -S chaos -u 1001

# Change ownership
RUN chown -R chaos:chaos /app
USER chaos

# Default environment variables
ENV API_BASE_URL=http://api:3002
ENV CHAOS_INTENSITY=medium
ENV CHAOS_EXPERIMENTS=all
ENV CHAOS_DURATION=300

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f $API_BASE_URL/api/v1/health || exit 1

# Run chaos tests
CMD ["node", "chaos-testing-suite.js", "--${CHAOS_EXPERIMENTS}", "--intensity=${CHAOS_INTENSITY}", "--duration=${CHAOS_DURATION}", "--verbose"]
