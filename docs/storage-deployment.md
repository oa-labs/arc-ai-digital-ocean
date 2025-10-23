# Deployment Guide

## Overview

Deploy the Express-based storage backend alongside the React frontend. The storage service is a standalone Node/Express app that must run separately from the web bundle; the existing `web/Dockerfile` builds and serves only static assets, so plan for two deployable units.

## Backend (Express Storage API)

### Environment Variables

Set these server-side secrets via your orchestrator (Kubernetes secrets, docker-compose `.env`, etc.):

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY              # optional if other services need it
S3_REGION
S3_ENDPOINT
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_FORCE_PATH_STYLE            # optional (“true” for MinIO-style configs)
STORAGE_DOWNLOAD_URL_TTL       # optional (seconds, default 3600)
PORT                           # optional (default 4000)
CORS_ORIGIN                    # optional CSV list, e.g. https://app.example.com
```

### Build & Run Options

#### Local (without Docker)

```bash
pnpm --filter @ichat-ocean/server build
pnpm --filter @ichat-ocean/server start
```

This compiles TypeScript to `server/dist` and starts the Express server on `PORT`.

#### Docker Example

Create a dedicated Dockerfile for the backend (the repo does not yet include one):

```Dockerfile
FROM node:22-alpine AS base
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY server/package.json server/tsconfig.json ./server/
COPY lib/package.json ./lib/
RUN corepack enable && pnpm install --prod --filter @ichat-ocean/server

COPY lib ./lib
COPY server ./server
RUN pnpm --filter @ichat-ocean/shared build && pnpm --filter @ichat-ocean/server build

CMD ["node", "server/dist/index.js"]
```

Expose the configured `PORT` (default 4000) via `docker run -p 4000:4000` or your orchestrator.

## Frontend (React Web App)

### Environment Variables

The frontend now needs only public values:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_APP_URL                  # domain used for Supabase OAuth redirects
VITE_API_BASE_URL             # URL of the storage backend (e.g. https://api.example.com)
```

### Build & Deploy with Existing `web/Dockerfile`

The current Dockerfile continues to work:

```bash
cd web
docker build -t arc-ai-web:latest .
docker run -p 3000:3000 \
  -e VITE_SUPABASE_URL=... \
  -e VITE_SUPABASE_ANON_KEY=... \
  -e VITE_APP_URL=https://app.example.com \
  -e VITE_API_BASE_URL=https://api.example.com \
  arc-ai-web:latest
```

At runtime `startup.sh` injects these values into `config.js`, so no rebuild is required for environment updates.

## Networking & Authentication

- Frontend authenticates users via Supabase.
- Storage API validates tokens using `requireAuth`, so every upload, delete, rename, and presign request needs a valid Supabase session.
- Configure `CORS_ORIGIN` on the backend to the frontend domain(s) (e.g., `https://app.example.com`).
- Ensure HTTPS connectivity from browsers to both frontend and backend.

## Summary

- **Frontend:** continue using the existing `web/Dockerfile`. Provide `VITE_API_BASE_URL` pointing to the storage backend.
- **Backend:** must run as its own service/container; the frontend Docker image does not host it. Use the provided Docker example or run with Node, supplying the required secrets.
