# API Prefix Refactoring - `/api` Implementation

## Overview

This document describes the refactoring performed to add an `/api` prefix to all backend API routes. This change simplifies nginx reverse proxy configuration by consolidating multiple location blocks into a single `/api/` location block.

## Date

January 25, 2025

## Motivation

Previously, the backend exposed routes directly at the root level:
- `/storage/buckets/:bucket/objects`
- `/users`
- `/users/:userId/role`

This required multiple nginx location blocks in production:
```nginx
location /storage/ {
    proxy_pass http://backend:4000;
}
location /users/ {
    proxy_pass http://backend:4000;
}
```

With the `/api` prefix, all backend routes are now under a single prefix:
- `/api/storage/buckets/:bucket/objects`
- `/api/users`
- `/api/users/:userId/role`

This allows a single nginx location block:
```nginx
location /api/ {
    proxy_pass http://backend:4000;
}
```

## Changes Made

### Backend Changes

#### 1. `server/src/app.ts`
**Changed route registration to include `/api` prefix:**

```typescript
// Before:
app.use('/storage', storageRouter);
app.use('/users', usersRouter);

// After:
app.use('/api/storage', storageRouter);
app.use('/api/users', usersRouter);
```

**Note:** The `/healthz` endpoint remains at the root level (not under `/api`) for health check purposes.

### Frontend Changes

#### 2. `web/src/services/s3Service.ts`
**Added `buildApiBaseUrl()` method to automatically append `/api` prefix:**

```typescript
private buildApiBaseUrl(base: string): string {
  const normalized = normalizeBaseUrl(base);
  if (normalized) {
    // If a custom API base URL is configured, append /api prefix
    return `${normalized}/api`;
  }
  // Default to current origin with /api prefix if not specified
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/api`;
}
```

**Updated constructor to use the new method:**
```typescript
constructor(config?: S3Config) {
  this.bucket = config?.bucket;
  const base = config?.baseUrl ?? configEnvApiBase();
  this.apiBaseUrl = this.buildApiBaseUrl(base);  // Now includes /api
}
```

**API calls remain unchanged** (they still use `/storage/...` paths, which are now appended to the base URL that includes `/api`):
- `/storage/buckets/:bucket/objects` → Full URL: `{baseUrl}/api/storage/buckets/:bucket/objects`

#### 3. `web/src/services/userManagementService.ts`
**Updated `getApiBaseUrl()` method to append `/api` prefix:**

```typescript
private getApiBaseUrl(): string {
  const apiBase = config.api.baseUrl;
  if (apiBase) {
    // If a custom API base URL is configured, append /api prefix
    const normalized = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    return `${normalized}/api`;
  }
  
  // Default to current origin with /api prefix if not specified
  return `${window.location.origin}/api`;
}
```

**API calls remain unchanged** (they still use `/users` paths):
- `/users` → Full URL: `{baseUrl}/api/users`
- `/users/:userId/role` → Full URL: `{baseUrl}/api/users/:userId/role`

### Documentation Changes

#### 4. `docs/USER_MANAGEMENT.md`
**Updated API endpoint documentation:**
- `GET /users` → `GET /api/users`
- `PATCH /users/:userId/role` → `PATCH /api/users/:userId/role`

#### 5. `docs/USER_MANAGEMENT_IMPLEMENTATION.md`
**Updated route references:**
- Backend route registration: `/users` → `/api/users`
- Testing checklist: All endpoint references updated to include `/api` prefix

## Configuration

### Environment Variables

No changes to environment variables are required. The system works with both configurations:

#### Option 1: Separate Backend Server
```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:4000

# Results in API calls to:
# http://localhost:4000/api/storage/...
# http://localhost:4000/api/users/...
```

#### Option 2: Same Origin (Production)
```bash
# Frontend (.env)
VITE_API_BASE_URL=
# (empty - defaults to window.location.origin)

# Results in API calls to:
# https://yourdomain.com/api/storage/...
# https://yourdomain.com/api/users/...
```

### Nginx Configuration

#### Development (Separate Servers)
No nginx configuration needed. Frontend calls backend directly via `VITE_API_BASE_URL`.

#### Production (Simplified Configuration)

**Before (Multiple Location Blocks):**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
    }

    # Backend - Multiple blocks
    location /storage/ {
        proxy_pass http://backend:4000;
    }
    
    location /users/ {
        proxy_pass http://backend:4000;
    }
}
```

**After (Single Location Block):**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
    }

    # Backend - Single block for all API routes
    location /api/ {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## API Endpoints

### Storage Endpoints
- `GET /api/storage/buckets/:bucket/objects` - List objects in bucket
- `POST /api/storage/buckets/:bucket/objects` - Upload object to bucket
- `DELETE /api/storage/buckets/:bucket/objects` - Delete object from bucket
- `POST /api/storage/buckets/:bucket/rename` - Rename object in bucket
- `GET /api/storage/buckets/:bucket/presign` - Get presigned URL for object

### User Management Endpoints
- `GET /api/users` - List all users (admin-only)
- `PATCH /api/users/:userId/role` - Update user role (admin-only)

### Health Check Endpoint
- `GET /healthz` - Health check (remains at root level, not under `/api`)

## Testing

### Manual Testing Checklist

#### Backend
- [ ] Start backend server: `cd server && npm run dev`
- [ ] Test health check: `curl http://localhost:4000/healthz`
- [ ] Test storage endpoint: `curl http://localhost:4000/api/storage/buckets/test/objects` (with auth)
- [ ] Test users endpoint: `curl http://localhost:4000/api/users` (with auth)

#### Frontend
- [ ] Start frontend: `cd web && npm run dev`
- [ ] Login to application
- [ ] Navigate to bucket detail page
- [ ] Verify file list loads correctly
- [ ] Upload a file
- [ ] Rename a file
- [ ] Delete a file
- [ ] Navigate to Users page (as admin)
- [ ] Verify user list loads correctly
- [ ] Update a user role

#### Integration
- [ ] Verify CORS headers are correct
- [ ] Verify authentication tokens are passed correctly
- [ ] Check browser console for any 404 errors
- [ ] Check network tab to confirm all requests use `/api` prefix

## Rollback Plan

If issues arise, revert the following changes:

1. **Backend:** `server/src/app.ts`
   ```typescript
   app.use('/storage', storageRouter);
   app.use('/users', usersRouter);
   ```

2. **Frontend:** `web/src/services/s3Service.ts`
   - Remove `buildApiBaseUrl()` method
   - Revert constructor to use `normalizeBaseUrl(base)` directly

3. **Frontend:** `web/src/services/userManagementService.ts`
   - Revert `getApiBaseUrl()` to not append `/api`

4. **Nginx:** Restore multiple location blocks for each endpoint

## Benefits

1. **Simplified Nginx Configuration:** Single location block instead of multiple
2. **Clearer API Structure:** All backend routes clearly identified with `/api` prefix
3. **Easier Maintenance:** Adding new endpoints only requires updating one location block
4. **Better Organization:** Clear separation between frontend routes and API routes
5. **Scalability:** Easier to add API versioning in the future (e.g., `/api/v2/...`)

## Future Considerations

- Consider adding API versioning: `/api/v1/storage`, `/api/v1/users`
- Consider adding rate limiting at the `/api` level
- Consider adding API-specific logging/monitoring
- Consider adding OpenAPI/Swagger documentation at `/api/docs`

