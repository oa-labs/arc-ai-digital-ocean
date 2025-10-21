# Multi-stage build for production Slack bot
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all workspace packages
COPY lib ./lib
COPY bots/slack ./bots/slack

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the shared lib
RUN pnpm --filter @ichat-ocean/shared build

# Build the slack bot
RUN pnpm --filter @ichat-ocean/slack-bot build

# Production stage
FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for all packages
COPY lib/package.json ./lib/
COPY bots/slack/package.json ./bots/slack/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/lib/dist ./lib/dist
COPY --from=builder /app/bots/slack/dist ./bots/slack/dist

# Set working directory to slack bot
WORKDIR /app/bots/slack

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port (default 3000) - only needed for HTTP mode, not socket mode
EXPOSE 3000

# Health check disabled for socket mode (no HTTP server)
# For HTTP mode, uncomment and add a /health endpoint:
# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the bot
CMD ["node", "dist/index.js"]
