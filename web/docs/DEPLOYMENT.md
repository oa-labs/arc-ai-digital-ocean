# Docker Deployment Guide

This guide covers deploying the ArcAI KB Manager application using Docker.

## Prerequisites

Before deploying, ensure you have:

1. ✅ Docker installed on your deployment server
2. ✅ Supabase project set up with authentication enabled (including Google OAuth if needed)
3. ✅ DigitalOcean Space (or S3-compatible storage) configured with CORS
4. ✅ All environment variables ready
5. ✅ Application tested locally
6. ✅ Domain name configured (if using OAuth)

## Overview

The application uses a multi-stage Docker build that:
- Builds the shared library and web application
- Serves the static files via Nginx
- Injects environment variables at **runtime** (not build time)
- Supports OAuth redirects to your production domain

## Step 1: Prepare Environment Variables

Create a `.env` file with your production credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# S3 Configuration (DigitalOcean Spaces)
VITE_S3_REGION=nyc3
VITE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_S3_BUCKET=your-production-bucket
VITE_S3_ACCESS_KEY_ID=your-production-access-key
VITE_S3_SECRET_ACCESS_KEY=your-production-secret-key

# Application URL (REQUIRED for OAuth redirects)
# Set this to your production domain
VITE_APP_URL=https://ai.openarc.net
```

**Important Notes:**
- All variables are injected at **runtime**, not build time
- You can change these values without rebuilding the Docker image
- Never commit the `.env` file to version control
- Use different credentials for production and development

## Step 2: Build the Docker Image

Build the image from the repository root:

```bash
cd /path/to/arc-ai
docker build -f web/Dockerfile -t arc-ai-web:latest .
```

**Note:** No build arguments are needed! Environment variables are injected at runtime.

The build process:
1. Installs dependencies for both `lib` and `web` packages
2. Builds the shared library (`@arc-ai/shared`)
3. Builds the web application
4. Creates a production image with Nginx
5. Copies the startup script that handles runtime configuration

## Step 3: Run the Container

Run the container with your environment variables:

```bash
docker run -d \
  --name arc-ai-web \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  arc-ai-web:latest
```

**Options explained:**
- `-d`: Run in detached mode (background)
- `--name arc-ai-web`: Name the container for easy reference
- `-p 3000:3000`: Map port 3000 (container) to port 3000 (host)
- `--env-file .env`: Load environment variables from file
- `--restart unless-stopped`: Auto-restart on failure
- `arc-ai-web:latest`: The image to run

## Step 4: Verify Deployment

### Check Container Status

```bash
docker ps | grep arc-ai-web
```

### Check Container Logs

```bash
docker logs arc-ai-web
```

You should see:
```
Creating runtime configuration...
Starting nginx on port 3000...
```

### Verify Runtime Configuration

Check that environment variables were injected:

```bash
docker exec arc-ai-web cat /usr/share/nginx/html/config.js
```

You should see your environment variables in the output:
```javascript
window.ENV = {
  VITE_SUPABASE_URL: "https://your-project.supabase.co",
  VITE_SUPABASE_ANON_KEY: "...",
  VITE_S3_REGION: "nyc3",
  VITE_S3_ENDPOINT: "https://nyc3.digitaloceanspaces.com",
  VITE_S3_BUCKET: "your-bucket",
  VITE_S3_ACCESS_KEY_ID: "...",
  VITE_S3_SECRET_ACCESS_KEY: "...",
  VITE_APP_URL: "https://ai.openarc.net"
};
```

### Test the Application

1. Open your browser to `http://localhost:3000` (or your production domain)
2. Open browser DevTools (F12) and check the Console
3. Type `window.ENV` to verify environment variables are loaded
4. Try signing in with email/password
5. Try signing in with Google OAuth (should redirect to your production URL)

## Step 5: Configure Reverse Proxy (Production)

If you're using Nginx as a reverse proxy (recommended for production):

```nginx
server {
    listen 80;
    server_name ai.openarc.net;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ai.openarc.net;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/ai.openarc.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai.openarc.net/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: Configure Supabase

Update your Supabase project settings for OAuth redirects:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **URL Configuration**
4. Set **Site URL**: `https://ai.openarc.net`
5. Add to **Redirect URLs**: `https://ai.openarc.net/*`
6. Click **Save**

## Step 7: Configure Google OAuth (if using)

If you're using Google OAuth, update your Google Cloud Console settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   - `https://ai.openarc.net`
   - `https://your-project.supabase.co`
5. Under **Authorized redirect URIs**, ensure you have:
   - `https://your-project.supabase.co/auth/v1/callback`
6. Click **Save**

## Step 8: Configure CORS on DigitalOcean Spaces

Add your production domain to the CORS settings:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://ai.openarc.net"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply via DigitalOcean control panel or CLI:
```bash
doctl spaces cors set your-bucket-name --config cors.json
```

## Post-Deployment Checklist

After deploying, verify everything works:

- [ ] Container is running: `docker ps | grep arc-ai-web`
- [ ] Logs show no errors: `docker logs arc-ai-web`
- [ ] Runtime config was created: `docker exec arc-ai-web cat /usr/share/nginx/html/config.js`
- [ ] Application loads in browser
- [ ] `window.ENV` is populated in browser console
- [ ] `window.ENV.VITE_APP_URL` matches your production URL
- [ ] Email authentication works (sign up, sign in, sign out)
- [ ] Google OAuth works and redirects to production URL (not localhost)
- [ ] File upload works with different file types
- [ ] File download works
- [ ] File rename works
- [ ] File delete works
- [ ] CORS is configured correctly (no CORS errors in console)
- [ ] Test on mobile devices
- [ ] HTTPS is enabled and working
- [ ] SSL certificate is valid

## Updating Environment Variables

One of the benefits of runtime environment variable injection is that you can update configuration without rebuilding the image:

1. **Update your `.env` file** with new values
2. **Restart the container**:
   ```bash
   docker stop arc-ai-web
   docker rm arc-ai-web
   docker run -d --name arc-ai-web -p 3000:3000 --env-file .env --restart unless-stopped arc-ai-web:latest
   ```

The new environment variables will be injected when the container starts.

## Container Management

### View Logs
```bash
docker logs arc-ai-web
docker logs -f arc-ai-web  # Follow logs in real-time
```

### Restart Container
```bash
docker restart arc-ai-web
```

### Stop Container
```bash
docker stop arc-ai-web
```

### Remove Container
```bash
docker stop arc-ai-web
docker rm arc-ai-web
```

### Access Container Shell
```bash
docker exec -it arc-ai-web sh
```

### Update to New Version
```bash
# Pull latest code and rebuild
cd /path/to/arc-ai
git pull
docker build -f web/Dockerfile -t arc-ai-web:latest .

# Stop and remove old container
docker stop arc-ai-web
docker rm arc-ai-web

# Start new container
docker run -d --name arc-ai-web -p 3000:3000 --env-file .env --restart unless-stopped arc-ai-web:latest
```

## Security Best Practices

**Important Security Notes:**

1. **Never commit `.env` files** to version control
   - Add `.env` to `.gitignore`
   - Use `.env.example` as a template

2. **Protect your environment file**
   ```bash
   chmod 600 .env  # Only owner can read/write
   ```

3. **Rotate credentials periodically**
   - Change S3 access keys every 90 days
   - Rotate Supabase keys if compromised
   - Update `.env` and restart container

4. **Use separate credentials for production and development**
   - Never use production credentials locally
   - Use different Supabase projects
   - Use different S3 buckets

5. **Enable MFA on all accounts**
   - Supabase account
   - DigitalOcean account
   - Google Cloud Console

6. **Keep Docker image updated**
   - Rebuild monthly to get security updates
   - Monitor for vulnerabilities

7. **Use HTTPS only**
   - Never serve over HTTP in production
   - Use Let's Encrypt for free SSL certificates
   - Enable HSTS headers



## Troubleshooting

### Container Won't Start

**Issue:** Container exits immediately after starting

**Solution:**
```bash
# Check logs for errors
docker logs arc-ai-web

# Common issues:
# - Missing environment variables
# - Port 3000 already in use
# - Startup script not executable
```

### Environment Variables Not Working

**Issue:** App can't connect to Supabase/S3

**Solution:**
1. Verify `.env` file exists and has all required variables
2. Check container was started with `--env-file .env`
3. Verify runtime config was created:
   ```bash
   docker exec arc-ai-web cat /usr/share/nginx/html/config.js
   ```
4. Check for typos in variable names (must start with `VITE_`)
5. Ensure no trailing spaces in values
6. Restart container after changing `.env`

### OAuth Redirects to Localhost

**Issue:** Google OAuth redirects to `http://localhost:3000` instead of production URL

**Solution:**
1. Verify `VITE_APP_URL` is set in `.env` file
2. Check `window.ENV.VITE_APP_URL` in browser console
3. Verify Supabase Site URL is set to your production domain
4. Restart container after adding `VITE_APP_URL`

### CORS Errors When Uploading Files

**Issue:** CORS errors in browser console when uploading to S3

**Solution:**
1. Add production domain to DigitalOcean Space CORS settings
2. Use `https://` (not `http://`) in CORS origins
3. Verify AllowedMethods includes `PUT` and `POST`
4. Clear browser cache and test again
5. Check CORS configuration:
   ```bash
   doctl spaces cors get your-bucket-name
   ```

### 404 Errors on Page Refresh

**Issue:** Page not found when refreshing on routes like `/dashboard`

**Solution:**
This should already be handled by the Nginx configuration in the Docker image. If you see this error:
1. Verify `nginx.conf` has `try_files $uri $uri/ /index.html;`
2. Check Nginx logs: `docker logs arc-ai-web`
3. Rebuild the image if you modified `nginx.conf`

### Port Already in Use

**Issue:** `Error: port is already allocated`

**Solution:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# Either stop that process or use a different port
docker run -d --name arc-ai-web -p 8080:3000 --env-file .env arc-ai-web:latest
```

### SSL/HTTPS Issues

**Issue:** Browser shows "Not Secure" or SSL errors

**Solution:**
1. Ensure you're using a reverse proxy (Nginx) with SSL certificates
2. Use Let's Encrypt for free SSL certificates:
   ```bash
   sudo certbot --nginx -d ai.openarc.net
   ```
3. Verify SSL certificate is valid and not expired
4. Check Nginx SSL configuration

### High Memory Usage

**Issue:** Container using too much memory

**Solution:**
```bash
# Limit container memory
docker run -d \
  --name arc-ai-web \
  -p 3000:3000 \
  --env-file .env \
  --memory="512m" \
  --restart unless-stopped \
  arc-ai-web:latest
```

## Monitoring and Maintenance

### Recommended Monitoring

1. **Container Health**
   ```bash
   # Check if container is running
   docker ps | grep arc-ai-web

   # Check resource usage
   docker stats arc-ai-web
   ```

2. **Application Logs**
   ```bash
   # View recent logs
   docker logs --tail 100 arc-ai-web

   # Follow logs in real-time
   docker logs -f arc-ai-web
   ```

3. **Supabase Dashboard**
   - Monitor authentication metrics
   - Check for failed login attempts
   - Review user activity

4. **DigitalOcean Spaces**
   - Monitor storage usage
   - Check bandwidth consumption
   - Review access logs

### Regular Maintenance Tasks

- **Weekly:** Check container logs for errors
- **Monthly:** Update Docker image with latest code and security patches
- **Quarterly:** Rotate S3 credentials and update `.env`
- **As needed:** Clean up unused files in S3
- **As needed:** Review and optimize storage costs

### Backup Strategy

1. **Environment Variables**
   - Keep a secure backup of your `.env` file
   - Store in a password manager or encrypted vault

2. **User Data**
   - Files are stored in DigitalOcean Spaces (automatically redundant)
   - User accounts are in Supabase (automatic backups)

3. **Application Code**
   - Keep in Git repository
   - Tag releases for easy rollback

## Performance Optimization

### Enable Caching

Add caching headers to Nginx configuration for static assets:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Use a CDN

For global users, consider putting Cloudflare in front of your application:
1. Sign up for Cloudflare (free tier available)
2. Add your domain to Cloudflare
3. Update DNS to point to Cloudflare
4. Enable caching and optimization features

### Monitor Performance

Use browser DevTools to check:
- Page load time
- Network requests
- JavaScript bundle size
- Memory usage

## Cost Estimation

Typical monthly costs for moderate usage:

- **Server/VPS:** $5-20/month (DigitalOcean Droplet, AWS EC2, etc.)
- **Supabase:** Free tier (up to 50,000 MAU)
- **DigitalOcean Spaces:** $5/month (250GB storage, 1TB transfer)
- **Domain:** $10-15/year
- **SSL Certificate:** Free (Let's Encrypt)
- **Total:** ~$10-25/month for small to medium usage

## Quick Rebuild Reference

If you need to rebuild your production deployment with updated configuration:

### Step 1: Build the Docker Image
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

### Step 3: Run with --env-file
```bash
docker run -d --name arc-ai-web -p 3000:3000 --env-file .env arc-ai-web:latest
```

### Step 4: Verify Supabase Settings
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL**: `https://ai.openarc.net`
3. Add to **Redirect URLs**: `https://ai.openarc.net/*`

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [DigitalOcean Spaces Documentation](https://docs.digitalocean.com/products/spaces/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## Support

For deployment issues:
1. Check this documentation first
2. Review container logs: `docker logs arc-ai-web`
3. Check browser console for errors
4. Verify environment variables are set correctly
5. Test locally with Docker first
6. Open an issue on GitHub if problem persists

---

**Last Updated:** 2025-01-20

