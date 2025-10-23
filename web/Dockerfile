# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all workspace packages
COPY lib ./lib
COPY web ./web

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the shared lib
RUN pnpm --filter @arc-ai/shared build

# Build the web app
WORKDIR /workspace/web
ENV CI=true
RUN pnpm run build

# Production stage
FROM nginx:alpine

# No additional dependencies needed for simple HTTP serving

COPY --from=builder /workspace/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY web/startup.sh /startup.sh

EXPOSE 3000

# Make startup script executable
RUN chmod +x /startup.sh

CMD ["/bin/sh", "/startup.sh"]