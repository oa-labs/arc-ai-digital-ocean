# Setup Checklist

Use this checklist to ensure your iChat KB Manager is properly configured.

## ☐ Prerequisites

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Modern web browser (Chrome, Firefox, Safari, Edge)

## ☐ Supabase Setup

### Create Project
- [ ] Sign up at [supabase.com](https://supabase.com)
- [ ] Create a new project
- [ ] Wait for project to finish provisioning (~2 minutes)

### Configure Authentication
- [ ] Navigate to **Authentication** in sidebar
- [ ] Click **Providers**
- [ ] Ensure **Email** is enabled
- [ ] Configure email templates (optional)
- [ ] Set up email confirmation (optional)

### Get Credentials
- [ ] Go to **Project Settings** > **API**
- [ ] Copy **Project URL** (starts with `https://`)
- [ ] Copy **anon public** key (starts with `eyJ`)
- [ ] Save these for `.env` file

## ☐ DigitalOcean Spaces Setup

### Create Space
- [ ] Log in to DigitalOcean
- [ ] Navigate to **Spaces**
- [ ] Click **Create Space**
- [ ] Choose a region (e.g., `nyc3`)
- [ ] Enter a unique bucket name
- [ ] Set to **Private** (recommended)
- [ ] Click **Create Space**

### Generate API Keys
- [ ] Go to **API** in sidebar
- [ ] Click **Spaces Keys** tab
- [ ] Click **Generate New Key**
- [ ] Name it (e.g., "File Manager App")
- [ ] Copy **Access Key** and **Secret Key** immediately
- [ ] Save these for `.env` file

### Configure CORS
- [ ] In your Space, go to **Settings**
- [ ] Scroll to **CORS Configurations**
- [ ] Add the following configuration:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

**Or via CLI:**
```bash
# Install doctl
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/

# Authenticate
doctl auth init

# Create cors.json with configuration above, then:
doctl spaces cors set YOUR-BUCKET-NAME --config cors.json
```

## ☐ Local Development Setup

### Clone and Install
- [ ] Clone the repository
- [ ] Navigate to `web/` directory
- [ ] Run `npm install`
- [ ] Wait for dependencies to install

### Configure Environment
- [ ] Copy `.env.example` to `.env`
- [ ] Open `.env` in your editor
- [ ] Fill in all variables:

```env
# Supabase (from Supabase dashboard)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# DigitalOcean Spaces
VITE_S3_REGION=nyc3
VITE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_S3_BUCKET=your-bucket-name
VITE_S3_ACCESS_KEY_ID=DO00XXXXXXXXXXXXX
VITE_S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] Save `.env` file
- [ ] Verify no trailing spaces or quotes

### Start Development Server
- [ ] Run `npm run dev`
- [ ] Wait for server to start
- [ ] Open browser to `http://localhost:5173`
- [ ] Verify app loads without errors

## ☐ Testing

### Authentication
- [ ] Click **Sign Up** tab
- [ ] Enter email and password (min 6 chars)
- [ ] Submit form
- [ ] Check email for verification (if enabled)
- [ ] Click **Sign In** tab
- [ ] Sign in with credentials
- [ ] Verify redirect to dashboard

### File Upload
- [ ] Prepare test files:
  - [ ] PDF file (< 10MB)
  - [ ] Text file (< 10MB)
  - [ ] HTML file (< 10MB)
- [ ] Drag and drop PDF onto upload area
- [ ] Verify upload progress shows
- [ ] Verify file appears in list
- [ ] Repeat for text and HTML files

### File Download
- [ ] Click download icon on a file
- [ ] Verify file downloads
- [ ] Open downloaded file
- [ ] Verify content is correct

### File Rename
- [ ] Click edit icon on a file
- [ ] Enter new name
- [ ] Click **Rename**
- [ ] Verify file name updates
- [ ] Verify extension preserved

### File Delete
- [ ] Click trash icon on a file
- [ ] Verify confirmation modal appears
- [ ] Click **Delete**
- [ ] Verify file removed from list

### Error Handling
- [ ] Try uploading file > 10MB
- [ ] Verify error message shows
- [ ] Try uploading .jpg or .png
- [ ] Verify error message shows
- [ ] Try renaming with `/` or `\`
- [ ] Verify error message shows

### Sign Out
- [ ] Click **Sign Out** button
- [ ] Verify redirect to login page
- [ ] Try accessing dashboard directly
- [ ] Verify redirect to login

## ☐ Browser Console Check

- [ ] Open browser DevTools (F12)
- [ ] Check **Console** tab
- [ ] Verify no red errors
- [ ] Check **Network** tab
- [ ] Verify API calls succeed (200 status)
- [ ] Check for CORS errors (should be none)

## ☐ Production Deployment (Optional)

### Pre-deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables documented
- [ ] Choose deployment platform

### Platform Setup
- [ ] Create account on chosen platform
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Set custom domain (optional)

### Post-deployment
- [ ] Update CORS with production domain
- [ ] Test all features in production
- [ ] Verify HTTPS enabled
- [ ] Test on mobile devices
- [ ] Set up monitoring (optional)

## ☐ Security Review

- [ ] `.env` file in `.gitignore`
- [ ] No credentials in code
- [ ] CORS properly configured
- [ ] Files set to private in S3
- [ ] Authentication required for all routes
- [ ] HTTPS enabled in production

## ☐ Documentation Review

- [ ] Read [README.md](./README.md)
- [ ] Review [QUICKSTART.md](./QUICKSTART.md)
- [ ] Check [DEPLOYMENT.md](./DEPLOYMENT.md)
- [ ] Understand [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

## 🎉 Completion

If all items are checked, your iChat KB Manager is ready to use!

## 🆘 Troubleshooting

If you encounter issues, check:

1. **Environment Variables**
   - All variables set in `.env`
   - No typos in variable names
   - No extra spaces or quotes
   - Server restarted after changes

2. **Supabase**
   - Project is active
   - Email provider enabled
   - Correct URL and key
   - Check Supabase logs

3. **DigitalOcean Spaces**
   - Bucket exists
   - Correct region and endpoint
   - Valid API keys
   - CORS configured
   - Check Spaces logs

4. **CORS Issues**
   - Localhost in AllowedOrigins
   - All methods included
   - Headers set to `["*"]`
   - Browser cache cleared

5. **Build Issues**
   - Dependencies installed
   - Node version 18+
   - No TypeScript errors
   - Run `npm run build` to test

## 📞 Getting Help

- Check browser console for errors
- Review Supabase dashboard logs
- Check DigitalOcean Spaces logs
- Search GitHub issues
- Open new issue with details

---

**Last Updated:** 2025-10-01

