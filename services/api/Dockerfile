FROM node:20-alpine

# Enable Corepack for Yarn
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY services/api/package.json services/api/package.json
COPY packages/prisma/package.json packages/prisma/package.json

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY services/api ./services/api
COPY packages/prisma ./packages/prisma

# Generate Prisma client
RUN yarn prisma generate

# Build the application
RUN yarn build

# Expose port
EXPOSE 3001

# Start the application
CMD ["yarn", "start"]
