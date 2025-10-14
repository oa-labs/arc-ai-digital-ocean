# Multi-stage build for production Slack bot
FROM node:18-alpine AS builder

WORKDIR /app

# Build shared lib first
COPY lib/package*.json ./lib/
WORKDIR /app/lib
RUN npm ci
COPY lib ./
RUN npm run build

# Build slack bot
WORKDIR /app/bots/slack
COPY bots/slack/package*.json ./
RUN npm ci
COPY bots/slack ./
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built lib with dependencies
COPY --from=builder /app/lib/package*.json ./lib/
COPY --from=builder /app/lib/dist ./lib/dist
WORKDIR /app/lib
RUN npm ci --omit=dev

# Copy built slack bot with dependencies
WORKDIR /app/bots/slack
COPY --from=builder /app/bots/slack/package*.json ./
COPY --from=builder /app/bots/slack/dist ./dist/
RUN npm ci --omit=dev

# Set working directory to slack bot
WORKDIR /app/bots/slack

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port (default 3000)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the bot
CMD ["node", "dist/index.js"]
