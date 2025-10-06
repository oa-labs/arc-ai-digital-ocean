# Google Authentication Setup Guide

This guide will help you configure Google OAuth authentication for your Supabase application.

## What Was Changed

### 1. AuthContext (`web/src/contexts/AuthContext.tsx`)
- Added `signInWithGoogle` method to the `AuthContextType` interface
- Implemented `signInWithGoogle` function that uses Supabase's OAuth provider
- The function redirects users to Google for authentication and back to your app after success

### 2. Login Page (`web/src/pages/Login.tsx`)
- Added `handleGoogleSignIn` function to handle Google sign-in button clicks
- Added a visual divider with "Or continue with" text
- Added a Google sign-in button with the official Google logo
- The button is disabled during loading states

## Supabase Configuration Required

To enable Google authentication, you need to configure it in your Supabase project:

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if you haven't already:
   - Choose "External" for user type (unless you have a Google Workspace)
   - Fill in the required app information
   - Add your email as a test user during development
6. For Application type, select **Web application**
7. Add authorized redirect URIs:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   Replace `<your-project-ref>` with your actual Supabase project reference ID
8. Click **Create** and save your:
   - Client ID
   - Client Secret

### Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list of providers
5. Enable the Google provider
6. Enter your Google OAuth credentials:
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console
7. Click **Save**

### Step 3: Update Redirect URLs (if needed)

If you're running the app locally or on a custom domain:

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add your site URL to the **Site URL** field (e.g., `http://localhost:5173` for local dev)
3. Add any additional redirect URLs to the **Redirect URLs** list

### Step 4: Update Google Cloud Console (for production)

When deploying to production, add your production URL to Google Cloud Console:

1. Go back to Google Cloud Console > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add your production redirect URI:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
4. Also add your production site URL to **Authorized JavaScript origins**:
   ```
   https://your-production-domain.com
   ```

## Testing

1. Start your development server:
   ```bash
   cd web
   npm run dev
   ```

2. Navigate to the login page
3. Click the "Sign in with Google" button
4. You should be redirected to Google's sign-in page
5. After successful authentication, you'll be redirected back to your app's dashboard

## How It Works

1. User clicks "Sign in with Google" button
2. `handleGoogleSignIn` is called, which invokes `signInWithGoogle` from AuthContext
3. Supabase initiates OAuth flow and redirects to Google
4. User authenticates with Google
5. Google redirects back to Supabase with an authorization code
6. Supabase exchanges the code for a session token
7. User is redirected to your app (configured as `window.location.origin + '/'`)
8. The `AuthContext` detects the new session via `onAuthStateChange`
9. User is now authenticated and can access protected routes

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Google Cloud Console exactly matches:
  `https://<your-project-ref>.supabase.co/auth/v1/callback`
- Check for trailing slashes or typos

### "Access blocked: This app's request is invalid"
- Ensure you've configured the OAuth consent screen in Google Cloud Console
- Add your email as a test user if the app is not published

### User is not redirected after Google sign-in
- Check that your Site URL is correctly configured in Supabase
- Verify that the redirect URL in the code matches your actual domain

### "Invalid provider" error
- Make sure Google provider is enabled in Supabase Dashboard
- Verify that Client ID and Client Secret are correctly entered

## Security Notes

- The Google OAuth flow is handled entirely by Supabase, keeping your credentials secure
- No Google credentials are stored in your frontend code
- Sessions are managed by Supabase with JWT tokens
- The redirect URL ensures users return to your application after authentication

## Additional Features

You can extend the Google authentication to:
- Access user's Google profile information via `user.user_metadata`
- Request additional scopes (email, profile are included by default)
- Implement "Sign up with Google" separately if needed

For more information, see the [Supabase Auth documentation](https://supabase.com/docs/guides/auth/social-login/auth-google).

