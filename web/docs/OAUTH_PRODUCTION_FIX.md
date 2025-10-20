# OAuth Production Deployment Fix

## Problem

When deploying the web application to production (e.g., `https://ai.openarc.net`), Google OAuth was redirecting users back to `http://localhost:3000` instead of the production URL.

## Root Cause

The OAuth redirect URL was using `window.location.origin` in the code. Since Vite environment variables are typically baked into the JavaScript bundle at build time, the Docker build process didn't know about the production URL.

## Solution

We've implemented **runtime environment variable injection** so you can continue using `--env-file .env` as before. All environment variables (including the new `VITE_APP_URL`) are now injected when the container starts, not when it's built.

### Changes Made

1. **Updated `web/src/config/env.ts`**:
   - Added `VITE_APP_URL` to the environment schema
   - Implemented runtime environment variable loading from `window.ENV`
   - Falls back to build-time `import.meta.env` if runtime config not available
   - Added `app.url` to the config object

2. **Updated `web/src/contexts/AuthContext.tsx`**:
   - Changed OAuth redirect from `window.location.origin` to `config.app.url`

3. **Updated `web/startup.sh`**:
   - Creates `/usr/share/nginx/html/config.js` at container startup
   - Injects all environment variables into `window.ENV`

4. **Updated `web/index.html`**:
   - Added `<script src="/config.js"></script>` to load runtime configuration

5. **Created `web/public/config.js`**:
   - Placeholder file for local development
   - Gets replaced by startup.sh in production

## How to Deploy

### Simple Deployment (Recommended)

**You can continue using your existing workflow!** Just add `VITE_APP_URL` to your `.env` file.

1. **Build the Docker image** (no build arguments needed):
   ```bash
   docker build -f web/Dockerfile -t arc-ai-web:latest .
   ```

2. **Add `VITE_APP_URL` to your existing `.env` file**:
   ```env
   # Your existing variables
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_S3_REGION=nyc3
   VITE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
   VITE_S3_BUCKET=your-bucket
   VITE_S3_ACCESS_KEY_ID=your-access-key
   VITE_S3_SECRET_ACCESS_KEY=your-secret-key

   # NEW: Add this for OAuth redirects
   VITE_APP_URL=https://ai.openarc.net
   ```

3. **Run with `--env-file` as you were doing before**:
   ```bash
   docker run -d --name arc-ai-web -p 3000:3000 --env-file .env arc-ai-web:latest
   ```

That's it! All environment variables are injected at runtime.

## Supabase Configuration

After deploying with the correct `VITE_APP_URL`, you also need to update your Supabase project settings:

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **URL Configuration**
4. Update the **Site URL** to: `https://ai.openarc.net`
5. Add to **Redirect URLs**: `https://ai.openarc.net/*`
6. Click **Save**

## Google Cloud Console Configuration

Make sure your Google OAuth client is configured with the correct redirect URIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   - `https://ai.openarc.net`
   - `https://your-project.supabase.co`
5. Under **Authorized redirect URIs**, ensure you have:
   - `https://your-project.supabase.co/auth/v1/callback`
6. Click **Save**

## Verification

After deploying:

1. Navigate to `https://ai.openarc.net`
2. Click "Sign in with Google"
3. Complete the Google authentication
4. Verify you're redirected back to `https://ai.openarc.net/#access_token=...`
5. Verify you're successfully logged in

## Troubleshooting

### Still redirecting to localhost

- Verify `VITE_APP_URL` is set in your `.env` file
- Check the container logs to see if config.js was created
- Verify the container was started with `--env-file .env`
- Check that `/usr/share/nginx/html/config.js` exists in the running container:
  ```bash
  docker exec arc-ai-web cat /usr/share/nginx/html/config.js
  ```

### "Redirect URI mismatch" error

- Ensure Supabase Site URL matches your production URL
- Verify the redirect URL is added to Supabase's allowed redirect URLs
- Check Google Cloud Console has the correct authorized redirect URIs

### OAuth works but redirects to wrong URL

- Verify `VITE_APP_URL` is set correctly in your `.env` file
- Restart the container after changing environment variables
- Check browser console for the value of `window.ENV.VITE_APP_URL`

### config.js not being created

- Ensure environment variables are being passed to the container
- Check container logs: `docker logs arc-ai-web`
- Verify startup.sh is executable in the image

## Local Development

For local development, you don't need to set `VITE_APP_URL`. The application will automatically use `window.location.origin` which will be `http://localhost:5173` (or whatever port Vite uses).

Just create a `.env` file with your development credentials:

```bash
cd web
cp .env.example .env
# Edit .env with your development credentials
# Leave VITE_APP_URL empty or omit it
pnpm run dev
```

The `public/config.js` file is just a placeholder that does nothing in development. Vite will load environment variables from your `.env` file instead.

## How It Works

1. **Build time**: The Docker image is built with a generic build (no environment variables baked in)
2. **Container startup**: The `startup.sh` script runs and creates `/usr/share/nginx/html/config.js` with your environment variables from `--env-file`
3. **Page load**: The browser loads `index.html`, which includes `<script src="/config.js"></script>`
4. **Runtime**: The app reads from `window.ENV` (populated by config.js) for all configuration values
5. **Fallback**: If `window.ENV` is not available (local dev), it falls back to `import.meta.env` (Vite's build-time variables)

This approach gives you the best of both worlds:
- **Production**: Runtime configuration via `--env-file` (no rebuild needed for config changes)
- **Development**: Standard Vite `.env` file workflow

