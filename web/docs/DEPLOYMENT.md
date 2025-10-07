# Deployment Guide

This guide covers deploying the iChat KB Manager application to various hosting platforms.

## Prerequisites

Before deploying, ensure you have:

1. ✅ Supabase project set up with authentication enabled
2. ✅ DigitalOcean Space (or S3-compatible storage) configured
3. ✅ All environment variables ready
4. ✅ Application tested locally

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides excellent support for Vite applications with zero configuration.

#### Steps:

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via GitHub** (Recommended)
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Configure:
     - Framework Preset: Vite
     - Root Directory: `web`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Add Environment Variables**

   In Vercel project settings, add all variables from `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_S3_REGION`
   - `VITE_S3_ENDPOINT`
   - `VITE_S3_BUCKET`
   - `VITE_S3_ACCESS_KEY_ID`
   - `VITE_S3_SECRET_ACCESS_KEY`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

5. **Update CORS**

   Add your Vercel domain to DigitalOcean Space CORS settings:
   ```json
   {
     "AllowedOrigins": ["https://your-app.vercel.app"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3000
   }
   ```

### Option 2: Netlify

Netlify is another excellent option for static site hosting.

#### Steps:

1. **Create `netlify.toml`** in the `web/` directory:
   ```toml
   [build]
     base = "web"
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy via GitHub**
   - Push code to GitHub
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select your repository
   - Netlify will auto-detect settings from `netlify.toml`

3. **Add Environment Variables**

   In Netlify site settings > Environment variables, add all variables from `.env`

4. **Deploy**
   - Click "Deploy site"
   - Update CORS settings with your Netlify domain

### Option 3: DigitalOcean App Platform

Deploy directly on DigitalOcean alongside your Spaces.

#### Steps:

1. **Create App**
   - Go to DigitalOcean App Platform
   - Click "Create App"
   - Connect your GitHub repository

2. **Configure Build**
   - Type: Static Site
   - Build Command: `cd web && npm install && npm run build`
   - Output Directory: `web/dist`

3. **Add Environment Variables**

   Add all variables from `.env` in the app settings

4. **Deploy**
   - Click "Deploy"
   - Update CORS with your app domain

### Option 4: AWS Amplify

If you prefer AWS ecosystem:

#### Steps:

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Click "New app" > "Host web app"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd web
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: web/dist
       files:
         - '**/*'
     cache:
       paths:
         - web/node_modules/**/*
   ```

3. **Add Environment Variables**

   In Amplify app settings, add all variables from `.env`

4. **Deploy**
   - Save and deploy
   - Update CORS settings

### Option 5: Self-Hosted (Docker)

For complete control, deploy using Docker.

#### Create `Dockerfile` in `web/`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Create `nginx.conf` in `web/`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Deploy:

```bash
# Build image
docker build -t s3-file-manager .

# Run container
docker run -d -p 80:80 -p 443:443 -e HOSTNAME=yourdomain.com your-app
```

## Post-Deployment Checklist

After deploying to any platform:

- [ ] Test authentication (sign up, sign in, sign out)
- [ ] Test file upload with different file types
- [ ] Test file download
- [ ] Test file rename
- [ ] Test file delete
- [ ] Verify CORS is configured correctly
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Verify environment variables are set correctly
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS (should be automatic on most platforms)

## Environment Variables Security

**Important Security Notes:**

1. **Never commit `.env` files** to version control
2. **Use platform-specific environment variable management**
3. **Rotate S3 credentials periodically**
4. **Use separate credentials for production and development**
5. **Enable MFA on Supabase and DigitalOcean accounts**

## Monitoring and Maintenance

### Recommended Monitoring:

1. **Supabase Dashboard**
   - Monitor authentication metrics
   - Check for failed login attempts
   - Review user activity

2. **DigitalOcean Spaces**
   - Monitor storage usage
   - Check bandwidth consumption
   - Review access logs

3. **Application Monitoring**
   - Set up error tracking (e.g., Sentry)
   - Monitor performance metrics
   - Track user analytics

### Regular Maintenance:

- Update dependencies monthly
- Review and rotate credentials quarterly
- Monitor storage costs
- Clean up unused files
- Review user access patterns

## Troubleshooting Deployment Issues

### Build Failures

**Issue:** Build fails with module errors
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variable Issues

**Issue:** App can't connect to Supabase/S3
**Solution:**
- Verify all `VITE_` prefixed variables are set
- Check for typos in variable names
- Ensure no trailing spaces in values
- Rebuild after adding variables

### CORS Errors in Production

**Issue:** CORS errors when uploading files
**Solution:**
- Add production domain to Space CORS settings
- Include both `http://` and `https://` if needed
- Verify AllowedMethods includes PUT and POST
- Clear browser cache and test again

### 404 Errors on Refresh

**Issue:** Page not found when refreshing on routes
**Solution:**
- Configure platform to redirect all routes to index.html
- For Nginx, use `try_files $uri $uri/ /index.html;`
- For Vercel/Netlify, this is automatic

## Scaling Considerations

As your application grows:

1. **Storage:** DigitalOcean Spaces scales automatically
2. **Authentication:** Supabase handles scaling
3. **CDN:** Consider adding Cloudflare for global distribution
4. **Database:** If you add a database, use Supabase PostgreSQL
5. **File Processing:** Consider adding serverless functions for large files

## Cost Estimation

Typical monthly costs for moderate usage:

- **Supabase:** Free tier (up to 50,000 MAU)
- **DigitalOcean Spaces:** $5/month (250GB storage, 1TB transfer)
- **Vercel/Netlify:** Free tier (100GB bandwidth)
- **Total:** ~$5-10/month for small to medium usage

## Support

For deployment issues:
- Check platform-specific documentation
- Review application logs
- Test locally first
- Open an issue on GitHub

---

**Last Updated:** 2025-10-01

