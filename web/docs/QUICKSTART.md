# Quick Start Guide

Get the ArcAI KB Manager up and running in 5 minutes!

## 1. Install Dependencies

```bash
cd web
pnpm install
```

**Important:** Make sure you're in the `web/` directory. This will install all required packages including:
- React and TypeScript
- AWS SDK for S3
- Supabase client
- Tailwind CSS
- And all other dependencies

## 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Get these from your Supabase project settings
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Get these from your DigitalOcean Spaces
VITE_S3_REGION=nyc3
VITE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_S3_BUCKET=my-bucket-name
VITE_S3_ACCESS_KEY_ID=DO00XXXXXXXXXXXXX
VITE_S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 3. Configure Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to **Authentication** > **Providers**
3. Enable **Email** provider
4. Copy your **Project URL** and **anon public** key to `.env`

## 4. Configure DigitalOcean Spaces

1. Create a Space in your DigitalOcean account
2. Go to **API** > **Spaces Keys** and generate new keys
3. Add CORS configuration to your Space:

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

To add CORS via CLI:
```bash
# Install doctl
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/

# Authenticate
doctl auth init

# Create cors.json with the configuration above, then:
doctl spaces cors set my-bucket-name --config cors.json
```

## 5. Run the Application

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 6. Create Your First Account

1. Click **Sign Up**
2. Enter your email and password (min 6 characters)
3. Check your email for verification link
4. Sign in with your credentials

## 7. Upload Your First File

1. Drag and drop a PDF, text, or HTML file (max 10MB)
2. Watch the upload progress
3. See your file appear in the list
4. Try downloading, renaming, or deleting it

## Troubleshooting

### "Invalid environment variables" error

- Check that all variables in `.env` are set
- Ensure no extra spaces or quotes around values
- Restart the dev server after changing `.env`

### CORS errors in console

- Verify CORS is configured on your Space
- Check that `http://localhost:5173` is in AllowedOrigins
- Try clearing browser cache

### Authentication not working

- Verify Supabase URL and key are correct
- Check that Email provider is enabled in Supabase
- Look for errors in browser console

### Files not uploading

- Verify S3 credentials are correct
- Check bucket name and region match your Space
- Ensure file is under 10MB and is PDF/text/HTML
- Check browser console for specific errors

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Customize the UI in `src/components/`
- Add more file types in `src/types/file.ts`

## Need Help?

- Check the browser console for errors
- Review Supabase logs in the dashboard
- Check DigitalOcean Spaces access logs
- Open an issue on GitHub

---

**Happy file managing! 🚀**

