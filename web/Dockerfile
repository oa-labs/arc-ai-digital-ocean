# Build stage
FROM node:20-alpine AS builder

WORKDIR /workspace

# Copy the lib directory first
COPY lib/ ./lib/

# Copy web files
COPY web/ ./web/

# Install dependencies and build from web directory
WORKDIR /workspace/web
RUN npm ci
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /workspace/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]