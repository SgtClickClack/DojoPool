FROM node:20-alpine

# Enable Corepack for Yarn
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY apps/web/package.json apps/web/package.json

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY apps/web ./apps/web

# Build the application
RUN yarn build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]
