FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk update && apk add --no-cache python3 make g++

# Enable Corepack for Yarn 4.x
RUN corepack enable

# Pre-download yarn with increased timeout
ENV COREPACK_NETWORK_TIMEOUT=300000
RUN corepack prepare yarn@stable --activate

# Copy all necessary files for workspace
COPY package.json yarn.lock ./
COPY services/api/package.json services/api/package.json                                          
COPY packages/prisma/package.json packages/prisma/package.json                                    

# Install dependencies
RUN COREPACK_NETWORK_TIMEOUT=300000 yarn install

# Copy source code
COPY . .

# Generate Prisma client
RUN cd services/api && COREPACK_NETWORK_TIMEOUT=300000 yarn prisma:generate

# Build API
RUN cd services/api && COREPACK_NETWORK_TIMEOUT=300000 yarn build       

ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002

WORKDIR /app/services/api
CMD ["sh", "-c", "COREPACK_NETWORK_TIMEOUT=300000 yarn start"]
