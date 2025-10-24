# syntax=docker/dockerfile:1.6

# Dependencies stage
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

WORKDIR /workspace

# Copy only package manifests for layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/package.json ./lib/
COPY web/package.json ./web/

# Install with cache mount
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store,sharing=locked \
    PNPM_STORE_DIR=/pnpm-store pnpm install --frozen-lockfile --filter @arc-ai/shared --filter @arc-ai/web-ui

# Build stage
FROM deps AS builder

# Copy source code
COPY lib ./lib
COPY web ./web

# Build shared library and web app
ENV CI=true
RUN pnpm --filter @arc-ai/shared build && pnpm --filter @arc-ai/web-ui build

# Production stage
FROM nginx:alpine

# Copy built assets and config
COPY --from=builder /workspace/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 web/startup.sh /startup.sh

EXPOSE 3000

CMD ["/bin/sh", "/startup.sh"]
