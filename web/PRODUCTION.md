# Production Deployment

This guide describes how to build and deploy the ArcAI web frontend container for production use with nginx reverse proxy.

## Prerequisites

- Docker installed and running
- Access to the project registry (GitHub Container Registry)
- Production environment variables configured
- Backend API server running (separate container/service)

## Architecture

The web frontend uses a multi-stage Docker build:
1. **deps stage**: Installs dependencies with pnpm
2. **builder stage**: Builds the React application with Vite
3. **production stage**: Serves static files via nginx

The container includes:
- nginx web server on port 3000
- Runtime configuration injection
- Security headers and gzip compression
- SPA routing support

## Building the Container

### Option 1: Using Workspace Scripts (Recommended)

From the project root directory:

```bash
# Build and tag the container
pnpm run build:container:web
```

This will:
- Build the web frontend and dependencies
- Create a production-optimized container with nginx
- Tag it with the current version and git short hash
- Push to the GitHub Container Registry

### Option 2: Manual Build

```bash
# From the project root
docker build --platform linux/amd64 -f web/Dockerfile -t arcai-web-frontend:latest .
```

## Environment Variables

The container supports runtime configuration injection. Set these variables when running the container:

### Required
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_APP_URL` - Production application URL (for OAuth redirects)

### Optional
- `VITE_API_BASE_URL` - Backend API base URL (if different from frontend domain)

## Running the Container

### Development/Testing

```bash
docker run --rm \
  -e VITE_SUPABASE_URL="https://your-project.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="your-anon-key" \
  -e VITE_APP_URL="http://localhost:3000" \
  -e VITE_API_BASE_URL="http://localhost:4000" \
  -p 3000:3000 \
  arcai-web-frontend:latest
```

### Production with Environment File

```bash
docker run --rm \
  --env-file .env.production \
  -p 3000:3000 \
  ghcr.io/oa-labs/arcai-web-frontend:1.0.58-abc123def
```

## Nginx Configuration

The container includes an optimized nginx configuration:

- **Port**: 3000
- **SPA Routing**: All routes fallback to index.html
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Gzip Compression**: Enabled for text-based assets
- **Static File Serving**: Efficient serving of built assets

## Container Registry

The production container is published to:
```
ghcr.io/oa-labs/arcai-web-frontend:{version}-{short-hash}
```

## Reverse Proxy Setup

### Option 1: Standalone (Container includes nginx)

The container can run standalone as it includes nginx:

```yaml
version: '3.8'
services:
  arcai-web:
    image: ghcr.io/oa-labs/arcai-web-frontend:1.0.58-abc123def
    ports:
      - "80:3000"
    env_file:
      - .env.production
    restart: unless-stopped
```

### Option 2: Behind External Reverse Proxy

For production deployments, place behind an external reverse proxy (nginx, Traefik, etc.):

```yaml
version: '3.8'
services:
  arcai-web:
    image: ghcr.io/oa-labs/arcai-web-frontend:1.0.58-abc123def
    expose:
      - "3000"
    env_file:
      - .env.production
    restart: unless-stopped

  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - arcai-web
```

### External Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://arcai-web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://arcai-server:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Runtime Configuration

The container supports runtime configuration injection via the `startup.sh` script:

1. Environment variables are read at container startup
2. A `config.js` file is generated in the web root
3. The React application reads this configuration at runtime

This allows the same container image to be used across different environments.

## Security Considerations

- The container runs as the nginx user (non-root)
- Only production dependencies are included
- Environment variables should be managed securely
- Use HTTPS in production (TLS termination at reverse proxy)
- Implement proper CORS headers if API is on different domain
- Consider rate limiting at the reverse proxy level

## Monitoring

Monitor the following metrics in production:
- Container resource usage (CPU, memory)
- nginx access logs and error rates
- SSL certificate expiration (if using HTTPS)
- Response times and error rates
- User authentication success/failure rates

## Deployment Examples

### Docker Compose with Backend

```yaml
version: '3.8'
services:
  arcai-server:
    image: ghcr.io/oa-labs/arcai-web-backend:1.0.58-abc123def
    expose:
      - "4000"
    env_file:
      - .env.server
    restart: unless-stopped

  arcai-web:
    image: ghcr.io/oa-labs/arcai-web-frontend:1.0.58-abc123def
    ports:
      - "3000:3000"
    env_file:
      - .env.web
    restart: unless-stopped
    depends_on:
      - arcai-server
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arcai-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: arcai-web
  template:
    metadata:
      labels:
        app: arcai-web
    spec:
      containers:
      - name: arcai-web
        image: ghcr.io/oa-labs/arcai-web-frontend:1.0.58-abc123def
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: arcai-web-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: arcai-web-service
spec:
  selector:
    app: arcai-web
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```