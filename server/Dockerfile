# syntax=docker/dockerfile:1.6

# Dependencies stage
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

WORKDIR /workspace

# Copy only package manifests for layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/package.json ./lib/
COPY server/package.json server/tsconfig.json ./server/

# Install with cache mount
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store,sharing=locked \
    PNPM_STORE_DIR=/pnpm-store pnpm install --frozen-lockfile --filter @arc-ai/shared --filter @arc-ai/server

# Build stage
FROM deps AS builder

# Copy source code
COPY lib ./lib
COPY server ./server

# Build both packages
RUN pnpm --filter @arc-ai/shared build && pnpm --filter @arc-ai/server build

# Prune to production dependencies only
RUN pnpm --filter @arc-ai/server --prod deploy /pruned

# Production stage
FROM node:22-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

# Copy deployed package (includes production dependencies and workspace packages in node_modules)
COPY --from=builder /pruned ./

CMD ["node", "dist/index.js"]
