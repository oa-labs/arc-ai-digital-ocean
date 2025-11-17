# Production Deployment Guide

This guide covers deploying the Outline to S3 Sync Bot to production using Docker.

## Prerequisites

- Docker and Docker Compose installed
- S3-compatible storage (DigitalOcean Spaces, AWS S3)
- Outline instance with API access

## Architecture

```
Cron/Scheduler → Docker Container → Outline API → S3 Storage
```

One-shot execution suitable for scheduled runs.

## Docker Configuration

### 1. Build the Production Image

```bash
cd bots/outline
docker build -t outline-sync-bot:latest .
```

### 2. Create Production Environment File

Create `.env.production` with production values:

```bash
# Outline API Configuration
OUTLINE_API_URL=https://your-production-outline-instance.com
OUTLINE_API_TOKEN=ol_api_your_production_token

# Collection Filtering (optional)
COLLECTION_BLACKLIST=private,archived

# S3 Configuration
S3_REGION=nyc3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=your-production-bucket
S3_ACCESS_KEY_ID=your_production_access_key
S3_SECRET_ACCESS_KEY=your_production_secret_key
```

### 3. Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  outline-sync:
    image: outline-sync-bot:latest
    container_name: outline-sync-bot
    restart: "no"  # One-shot service
    env_file:
      - .env.production
    networks:
      - outline-network

networks:
  outline-network:
    driver: bridge
```

## Deployment Steps

### 1. Prepare the Environment

```bash
# Set up environment file
cp .env.example .env.production
# Edit .env.production with production values
```

### 2. Deploy the Application

```bash
# Build and run once
docker-compose -f docker-compose.prod.yml up --build

# Or run manually
docker run --rm --env-file .env.production outline-sync-bot:latest
```

### 3. Schedule Regular Syncs

Use cron or systemd timer to run the sync periodically.

For cron:

```bash
# Add to crontab for hourly syncs
0 * * * * cd /path/to/project && docker-compose -f docker-compose.prod.yml up --build
```

## Monitoring and Maintenance

### 1. Log Management

Logs are output to stdout/stderr and can be captured by Docker:

```bash
docker-compose -f docker-compose.prod.yml logs -f outline-sync
```

### 2. Health Monitoring

Since it's one-shot, monitor exit codes:

```bash
# Check last run status
docker-compose -f docker-compose.prod.yml ps -a
```

### 3. Backup Strategy

- S3 data is the primary storage
- Backup environment files and Docker configs
- Monitor S3 bucket for data integrity

## Security Considerations

### 1. Network Security

- Use HTTPS for Outline API and S3 endpoints
- Restrict API tokens to read-only access
- Use VPC/security groups for S3 access

### 2. Container Security

- Run containers as non-root user (configured in Dockerfile)
- Use read-only filesystem where possible
- Limit container resources

Update `docker-compose.prod.yml`:

```yaml
services:
  outline-sync:
    # ... existing config
    user: "1000:1000"  # Non-root user
    read_only: true
    tmpfs:
      - /tmp
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

### 3. Secrets Management

- Store sensitive credentials in environment files or Docker secrets
- Rotate API keys regularly
- Use S3 bucket policies for access control

## Scaling Considerations

The sync bot is designed for one-shot execution and doesn't require horizontal scaling. For high-volume Outline instances:

- Increase memory limits
- Optimize sync frequency
- Consider multiple sync jobs for different collections

## Troubleshooting Production Issues

### 1. Container Issues

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps -a

# View container logs
docker-compose -f docker-compose.prod.yml logs outline-sync

# Debug container
docker run --rm -it --env-file .env.production outline-sync-bot:latest /bin/sh
```

### 2. Sync Issues

- Verify Outline API credentials and permissions
- Check S3 credentials and bucket access
- Review sync logs for rate limiting or errors

## Update and Rollback Procedures

### 1. Update Process

```bash
# Pull latest code
git pull origin main

# Rebuild image
docker-compose -f docker-compose.prod.yml build --no-cache

# Test run
docker-compose -f docker-compose.prod.yml up
```

### 2. Rollback Process

```bash
# Rollback to previous commit
git checkout previous-commit-hash

# Rebuild and test
docker-compose -f docker-compose.prod.yml up --build
```

## Performance Optimization

- Monitor API rate limits and adjust delays
- Optimize collection filtering to reduce sync time
- Use S3 multipart uploads for large files

This production setup provides a secure, reliable deployment for the Outline to S3 Sync Bot.