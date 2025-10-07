# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Copy the lib directory first
COPY lib/ ./lib/

# Copy web files
COPY web/ ./web/

# Install dependencies and build from web directory
WORKDIR /workspace/web
ENV CI=true
RUN pnpm install
RUN pnpm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /workspace/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]