# Testing the OAuth Fix

## Quick Test Steps

### 1. Rebuild the Docker Image

```bash
cd /workspaces/arc-ai
docker build -f web/Dockerfile -t arc-ai-web:latest .
```

### 2. Create a Test .env File

Create a `.env` file with your credentials and the production URL:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_S3_REGION=nyc3
VITE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_S3_BUCKET=your-bucket
VITE_S3_ACCESS_KEY_ID=your-access-key
VITE_S3_SECRET_ACCESS_KEY=your-secret-key
VITE_APP_URL=https://ai.openarc.net
```

### 3. Run the Container

```bash
docker run -d --name arc-ai-web-test -p 3000:3000 --env-file .env arc-ai-web:latest
```

### 4. Verify config.js Was Created

Check that the runtime configuration was injected:

```bash
docker exec arc-ai-web-test cat /usr/share/nginx/html/config.js
```

You should see output like:

```javascript
window.ENV = {
  VITE_SUPABASE_URL: "https://your-project.supabase.co",
  VITE_SUPABASE_ANON_KEY: "your-anon-key",
  VITE_S3_REGION: "nyc3",
  VITE_S3_ENDPOINT: "https://nyc3.digitaloceanspaces.com",
  VITE_S3_BUCKET: "your-bucket",
  VITE_S3_ACCESS_KEY_ID: "your-access-key",
  VITE_S3_SECRET_ACCESS_KEY: "your-secret-key",
  VITE_APP_URL: "https://ai.openarc.net"
};
```

### 5. Test in Browser (Local)

If testing locally:

1. Open `http://localhost:3000` in your browser
2. Open browser DevTools (F12)
3. In the Console, type: `window.ENV`
4. Verify it shows your environment variables
5. Type: `window.ENV.VITE_APP_URL`
6. Verify it shows: `"https://ai.openarc.net"`

### 6. Test OAuth Flow (Production)

After deploying to production:

1. Go to `https://ai.openarc.net`
2. Open browser DevTools Console
3. Verify `window.ENV.VITE_APP_URL` is `"https://ai.openarc.net"`
4. Click "Sign in with Google"
5. Complete Google authentication
6. **Verify you're redirected to**: `https://ai.openarc.net/#access_token=...`
   - NOT `http://localhost:3000/#access_token=...`

### 7. Cleanup Test Container

```bash
docker stop arc-ai-web-test
docker rm arc-ai-web-test
```

## Expected Results

✅ **Success indicators**:
- `config.js` file exists in the container
- `window.ENV` is populated with your environment variables
- `window.ENV.VITE_APP_URL` matches your production URL
- Google OAuth redirects to your production URL

❌ **Failure indicators**:
- `config.js` is empty or missing
- `window.ENV` is undefined or empty
- OAuth still redirects to localhost

## Troubleshooting

### config.js is empty or has undefined values

**Problem**: Environment variables weren't passed to the container

**Solution**: Make sure you're using `--env-file .env` when running the container

### window.ENV is undefined

**Problem**: config.js wasn't loaded or doesn't exist

**Solution**: 
1. Check if config.js exists: `docker exec arc-ai-web-test cat /usr/share/nginx/html/config.js`
2. Check container logs: `docker logs arc-ai-web-test`
3. Verify index.html includes the script tag: `docker exec arc-ai-web-test cat /usr/share/nginx/html/index.html | grep config.js`

### Still redirecting to localhost

**Problem**: The app is using the fallback value instead of `window.ENV`

**Solution**:
1. Verify `window.ENV.VITE_APP_URL` is set correctly in browser console
2. Clear browser cache and hard reload (Ctrl+Shift+R)
3. Check that the app is reading from `config.app.url` in the code

## Next Steps

Once testing is successful:

1. Tag and push the image to your registry
2. Deploy to production
3. Update Supabase redirect URLs
4. Test the OAuth flow in production
5. Celebrate! 🎉

