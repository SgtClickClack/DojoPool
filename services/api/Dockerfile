FROM node:20-alpine

WORKDIR /app

# Install dependencies with Yarn
COPY package.json yarn.lock ./
COPY services/api/package.json services/api/package.json
COPY packages/prisma/package.json packages/prisma/package.json
RUN yarn install --immutable

# Build API
COPY . .
RUN yarn workspace @dojopool/api run build

ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002

CMD ["yarn", "workspace", "@dojopool/api", "start"]
