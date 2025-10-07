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

# Install certbot and dependencies
RUN apk add --no-cache certbot python3 py3-pip certbot-nginx 

COPY --from=builder /workspace/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY web/startup.sh /startup.sh

# Create certbot directories
RUN mkdir -p /var/www/certbot /etc/letsencrypt

EXPOSE 80 443

CMD ["/bin/sh", "/startup.sh"]