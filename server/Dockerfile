FROM node:22-alpine AS base
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY server/package.json server/tsconfig.json ./server/
COPY lib/package.json ./lib/
RUN corepack enable && pnpm install --prod --filter @ichat-ocean/server

COPY lib ./lib
COPY server ./server
RUN pnpm --filter @ichat-ocean/shared build && pnpm --filter @ichat-ocean/server build

CMD ["node", "server/dist/index.js"]