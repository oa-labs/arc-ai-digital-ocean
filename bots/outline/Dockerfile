# Multi-stage build for production Outline sync bot
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy the outline bot package
COPY bots/outline ./bots/outline

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the outline bot
RUN pnpm --filter @ichat-ocean/outline-bot build

# Production stage
FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json for the outline bot
COPY bots/outline/package.json ./bots/outline/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/bots/outline/dist ./bots/outline/dist

# Set working directory to outline bot
WORKDIR /app/bots/outline

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Health check (optional - exits after completion)
HEALTHCHECK NONE

# Start the sync
CMD ["node", "dist/index.js"]
