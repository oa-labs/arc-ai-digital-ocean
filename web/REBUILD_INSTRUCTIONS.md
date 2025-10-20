# Quick Rebuild Instructions for Production

## The Fix

The OAuth redirect issue has been fixed. Google OAuth will now redirect to `https://ai.openarc.net` instead of `http://localhost:3000`.

**Good news**: You can now use runtime environment variables with `--env-file .env`!

## Rebuild Your Production Image

### Step 1: Build the Docker Image

No build arguments needed anymore! Just build:

```bash
cd /workspaces/arc-ai
docker build -f web/Dockerfile -t arc-ai-web:latest .
```

### Step 2: Update Your .env File

Add `VITE_APP_URL` to your existing `.env` file:

```env
# Your existing variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_S3_REGION=nyc3
VITE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_S3_BUCKET=your-bucket
VITE_S3_ACCESS_KEY_ID=your-access-key
VITE_S3_SECRET_ACCESS_KEY=your-secret-key

# NEW: Add this line for OAuth redirects
VITE_APP_URL=https://ai.openarc.net
```

### Step 3: Run with --env-file (as you were doing before)

```bash
docker run -d --name arc-ai-web -p 3000:3000 --env-file .env arc-ai-web:latest
```

That's it! All environment variables (including the new `VITE_APP_URL`) are now injected at runtime.

### Step 4: Verify Supabase Settings

Make sure your Supabase project has the correct redirect URLs:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL**: `https://ai.openarc.net`
3. Add to **Redirect URLs**: `https://ai.openarc.net/*`

## Test

1. Go to `https://ai.openarc.net`
2. Click "Sign in with Google"
3. After Google authentication, you should be redirected to `https://ai.openarc.net/#access_token=...`

## What Changed

- Environment variables are now injected at **runtime** instead of build time
- The `startup.sh` script creates a `config.js` file with your environment variables
- The app reads from `window.ENV` (runtime) first, then falls back to build-time values
- You can continue using `--env-file .env` as before, just add `VITE_APP_URL`

See `docs/OAUTH_PRODUCTION_FIX.md` for detailed information.

