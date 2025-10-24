# syntax=docker/dockerfile:1.6

# Dependencies stage
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

WORKDIR /app

# Copy only package manifests for layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/package.json ./lib/
COPY bots/slack/package.json ./bots/slack/

# Install with cache mount
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store,sharing=locked \
    PNPM_STORE_DIR=/pnpm-store pnpm install --frozen-lockfile --filter @arc-ai/shared --filter @arc-ai/slack-bot

# Build stage
FROM deps AS builder

# Copy source code
COPY lib ./lib
COPY bots/slack ./bots/slack

# Build both packages
RUN pnpm --filter @arc-ai/shared build && pnpm --filter @arc-ai/slack-bot build

# Prune to production dependencies only and copy built files
RUN pnpm --filter @arc-ai/slack-bot --prod deploy /pruned && \
    cp -r bots/slack/dist /pruned/

# Production stage
FROM node:22-alpine

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy deployed package (includes production dependencies and workspace packages in node_modules)
COPY --from=builder --chown=nodejs:nodejs /pruned ./

USER nodejs

# Expose port (only needed for HTTP mode, not socket mode)
#EXPOSE 3000

# Health check disabled for socket mode (no HTTP server)
# For HTTP mode, uncomment and add a /health endpoint:
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "dist/index.js"]
