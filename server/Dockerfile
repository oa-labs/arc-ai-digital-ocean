FROM node:22-alpine AS base
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY server/package.json server/tsconfig.json ./server/
COPY lib/package.json ./lib/
RUN corepack enable && pnpm install --prod --filter @arc-ai/server

COPY lib ./lib
COPY server ./server
RUN pnpm --filter @arc-ai/shared build && pnpm --filter @arc-ai/server build

CMD ["node", "server/dist/index.js"]