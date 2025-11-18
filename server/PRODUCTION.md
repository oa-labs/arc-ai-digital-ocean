# Production Deployment

This guide describes how to build and deploy the ArcAI server container for production use.

## Prerequisites

- Docker installed and running
- Access to the project registry (GitHub Container Registry)
- Production environment variables configured

## Building the Container

The server uses a multi-stage Docker build optimized for production. The build process is handled by workspace-level scripts.

### Option 1: Using Workspace Scripts (Recommended)

From the project root directory:

```bash
# Build and tag the container
pnpm run build:container:server
```

This will:
- Build the server and its dependencies
- Create a production-optimized container
- Tag it with the current version and git short hash
- Push to the GitHub Container Registry

### Option 2: Manual Build

If you need to build manually:

```bash
# From the project root
docker build --platform linux/amd64 -f server/Dockerfile -t arcai-server:latest .
```

## Container Architecture

The Dockerfile uses a multi-stage build:

1. **deps stage**: Installs dependencies with pnpm
2. **builder stage**: Compiles TypeScript and prunes dev dependencies
3. **runner stage**: Creates minimal production image

## Environment Variables

The container expects the same environment variables as development:

### Required
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `S3_REGION` - Storage bucket region
- `S3_ENDPOINT` - Storage endpoint URL
- `S3_ACCESS_KEY_ID` - Storage access key
- `S3_SECRET_ACCESS_KEY` - Storage secret key

### Optional
- `PORT` - Server port (default: 4000)
- `CORS_ORIGIN` - CORS origin for frontend
- `S3_FORCE_PATH_STYLE` - Set to `true` for DigitalOcean Spaces
- `STORAGE_DOWNLOAD_URL_TTL` - Download URL TTL in seconds (default: 3600)

## Running the Container

### Development/Testing

```bash
docker run --rm \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  -e S3_REGION="nyc3" \
  -e S3_ENDPOINT="https://nyc3.digitaloceanspaces.com" \
  -e S3_ACCESS_KEY_ID="your-access-key" \
  -e S3_SECRET_ACCESS_KEY="your-secret-key" \
  -p 4000:4000 \
  arcai-server:latest
```

### Production with Environment File

```bash
docker run --rm \
  --env-file .env \
  -p 4000:4000 \
  ghcr.io/oa-labs/arcai-web-backend:1.0.58-abc123def
```

## Container Registry

The production container is published to:
```
ghcr.io/oa-labs/arcai-web-backend:{version}-{short-hash}
```

## Health Checks

The server exposes a health check endpoint (if implemented) at `/health` for container orchestration systems.

## Security Considerations

- The container runs as a non-root user (node user)
- Only production dependencies are included
- Environment variables should be managed securely
- Use TLS termination in production (reverse proxy)

## Deployment Examples

### Docker Compose

```yaml
version: '3.8'
services:
  arcai-server:
    image: ghcr.io/oa-labs/arcai-web-backend:1.0.58-abc123def
    ports:
      - "4000:4000"
    env_file:
      - .env
    restart: unless-stopped
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arcai-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: arcai-server
  template:
    metadata:
      labels:
        app: arcai-server
    spec:
      containers:
      - name: arcai-server
        image: ghcr.io/oa-labs/arcai-web-backend:1.0.58-abc123def
        ports:
        - containerPort: 4000
        envFrom:
        - secretRef:
            name: arcai-secrets
```

## Monitoring

Monitor the following metrics in production:
- Container resource usage (CPU, memory)
- Application logs
- HTTP response times and error rates
- Database connection health