# Multi-stage build for TextureAIService
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies for AI/ML workloads
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    linux-headers \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S textureai -u 1001

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/config ./src/config

# Create directories for models and cache
RUN mkdir -p /app/models /app/cache /app/logs && \
    chown -R textureai:nodejs /app

# Set environment variables
ENV NODE_ENV=production
ENV TEXTURE_AI_MODEL_PATH=/app/models/stable-diffusion-texture
ENV MAX_TEXTURE_RESOLUTION=2048
ENV TEXTURE_BATCH_SIZE=4
ENV TEXTURE_GPU_ENABLED=false
ENV TEXTURE_CACHE_ENABLED=true
ENV LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Switch to non-root user
USER textureai

# Expose port
EXPOSE 3001

# Start the service
CMD ["node", "dist/services/ai/TextureAIService.js"]