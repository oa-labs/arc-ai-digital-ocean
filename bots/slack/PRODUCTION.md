# Production Deployment Guide

This guide covers deploying the ArcAI Slack Bot to production using Docker.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database server
- Production Slack app configured

## Architecture

```
Internet → Slack Bot Container → PostgreSQL
```

## Docker Configuration

### 1. Build the Production Image

```bash
cd bots/slack
docker build -t arcai-slack-bot:latest .
```

### 2. Create Production Environment File

Create `.env.production` with production values:

```bash
# Slack Configuration
SLACK_BOT_TOKEN=[REDACTED:slack-access-token]
SLACK_SIGNING_SECRET=your-production-signing-secret
SLACK_APP_TOKEN=[REDACTED:slack-access-token]
SLACK_SOCKET_MODE=true
SLACK_PORT=3000

# PostgreSQL Database Configuration
DATABASE_URL=postgresql://prod_user:secure_password@db-host:5432/prod_database

# agent keys
AGENT1_API_KEY=your-production-agent1-api-key
AGENT2_API_KEY=your-production-agent2-api-key
AGENT3_API_KEY=your-production-agent3-api-key

# Production settings
DEBUG=0
```

### 3. Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  slack-bot:
    image: arcai-slack-bot:latest
    container_name: arcai-slack-bot
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    networks:
      - slack-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  slack-network:
    driver: bridge
```



## Deployment Steps

### 1. Prepare the Environment

```bash
# Set up environment file
cp env.example .env.production
# Edit .env.production with production values
```

### 2. Deploy the Application

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Verify Deployment

```bash
# Check health endpoint
curl http://localhost:3000/health

# Check bot logs
docker-compose -f docker-compose.prod.yml logs slack-bot
```

## Monitoring and Maintenance

### 1. Log Management

The application logs are managed by Docker and can be accessed using:
```bash
docker-compose -f docker-compose.prod.yml logs -f slack-bot
```

### 2. Health Monitoring

Create a monitoring script `monitor.sh`:

```bash
#!/bin/bash

# Check if services are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "ERROR: Some services are down"
    docker-compose -f docker-compose.prod.yml ps
    exit 1
fi

# Check health endpoint
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "ERROR: Health check failed"
    exit 1
fi

echo "All services healthy"
```

### 3. Backup Strategy

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/backups/arcai-slack"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# Backup environment file
cp .env.production $BACKUP_DIR/env_backup_$DATE

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "env_backup_*" -mtime +30 -delete
```

## Security Considerations

### 1. Network Security

- Use firewall to restrict access to necessary ports only
- Consider using VPN for database access
- Implement IP whitelisting for admin functions

### 2. Container Security

```bash
# Run containers as non-root user (already configured in Dockerfile)
# Use read-only filesystem where possible
# Limit container resources
```

Update `docker-compose.prod.yml` with resource limits:

```yaml
services:
  slack-bot:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    read_only: true
    tmpfs:
      - /tmp
```

### 3. Secrets Management

- Use Docker secrets or external secret management
- Rotate API keys regularly
- Monitor for credential exposure



## Scaling Considerations

### 1. Horizontal Scaling

For high-traffic deployments, consider multiple bot instances:

```yaml
services:
  slack-bot:
    image: arcai-slack-bot:latest
    deploy:
      replicas: 3
    # ... rest of config
```

### 2. Database Scaling

- Use connection pooling (PgBouncer)
- Consider read replicas for reporting queries
- Monitor database performance

## Troubleshooting Production Issues

### 1. Container Issues

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View container logs
docker-compose -f docker-compose.prod.yml logs slack-bot

# Restart services
docker-compose -f docker-compose.prod.yml restart slack-bot

# Enter container for debugging
docker-compose -f docker-compose.prod.yml exec slack-bot sh
```



### 3. Database Issues

```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec slack-bot node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(console.log).catch(console.error);
"
```

## Update and Rollback Procedures

### 1. Update Process

```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Verify deployment
./monitor.sh
```

### 2. Rollback Process

```bash
# Rollback to previous version
git checkout previous-commit-hash

# Rebuild and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Verify rollback
./monitor.sh
```

## Performance Optimization

### 1. Application Optimization

- Monitor memory usage and adjust limits
- Optimize database queries
- Consider caching frequently accessed data

### 2. Infrastructure Optimization

- Monitor and optimize network latency

This production setup provides a secure, scalable, and maintainable deployment for the ArcAI Slack Bot.