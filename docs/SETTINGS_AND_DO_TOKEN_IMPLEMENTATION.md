# Settings Page and DigitalOcean Token Storage Implementation

## Overview

This implementation adds a Settings page where users can securely store their DigitalOcean Personal Access Token. The token is stored in the Supabase database with Row Level Security (RLS), ensuring that only the user who owns the token can read and update it. This eliminates the need to ask for the token during the "Add Agent" workflow.

## Changes Summary

### 1. Database Migration

**File:** `docs/supabase-migration-user-settings.sql`

Created a new `user_settings` table with:
- `id` (UUID, primary key)
- `user_id` (UUID, references auth.users)
- `digitalocean_token` (TEXT, encrypted storage)
- `created_at` and `updated_at` timestamps
- Unique constraint on `user_id`

**Row Level Security Policies:**
- Users can read their own settings
- Users can insert their own settings
- Users can update their own settings
- Users can delete their own settings

All policies use `auth.uid() = user_id` to ensure users can only access their own data.

### 2. User Settings Service

**File:** `web/src/services/userSettingsService.ts`

Created a new service to manage user settings:
- `getUserSettings()` - Get current user's settings
- `upsertUserSettings(settings)` - Create or update user settings
- `hasDigitalOceanToken()` - Check if user has configured a token
- `getDigitalOceanToken()` - Get the stored token

### 3. Settings Page

**File:** `web/src/pages/Settings.tsx`

Created a new Settings page with:
- Form to enter/update DigitalOcean Personal Access Token
- Show/hide password toggle for token visibility
- Link to DigitalOcean's token generation page
- Secure storage with encryption
- User-friendly interface with proper feedback

### 4. Dashboard Updates

**File:** `web/src/pages/Dashboard.tsx`

- Replaced the Refresh button with a Settings button
- Settings button navigates to `/settings`
- Removed refresh functionality (can be added back if needed)

### 5. Routing Updates

**File:** `web/src/App.tsx`

- Added `/settings` route with `ProtectedRoute` wrapper
- Imported and configured the Settings page component

### 6. AddAgentFromDigitalOcean Component Updates

**File:** `web/src/components/AddAgentFromDigitalOcean.tsx`

Major changes:
- Removed the "token" step from the workflow
- Changed step type from `'token' | 'list' | 'form'` to `'list' | 'form'`
- Added `useEffect` to load stored token on component mount
- Automatically fetches agents using stored token
- Shows error if no token is configured with message to configure in Settings
- Removed token input form UI
- Simplified back button logic (only goes back from form to list)

### 7. Agents Page Updates

**File:** `web/src/pages/Agents.tsx`

- Added state to track if user has DigitalOcean token configured
- Added `checkDigitalOceanToken()` function to check token status
- Conditionally show "Add Agent" button only when token is configured
- Refresh now also checks token status

## User Flow

### First Time Setup

1. User logs in to the application
2. User navigates to Dashboard
3. User clicks the Settings button (gear icon)
4. User enters their DigitalOcean Personal Access Token
5. User clicks "Save Settings"
6. Token is securely stored in the database

### Adding an Agent

1. User navigates to Agents page
2. If token is configured, "Add Agent" button is visible
3. User clicks "Add Agent"
4. Modal opens and automatically loads agents from DigitalOcean using stored token
5. User selects an agent from the list
6. User completes the configuration form
7. Agent is imported successfully

### If No Token Configured

1. User navigates to Agents page
2. "Add Agent" button is hidden (only "Create Agent" is visible)
3. If user somehow opens the modal, they see an error message directing them to Settings

## Security Features

1. **Row Level Security (RLS)**: Database policies ensure users can only access their own settings
2. **Encrypted Storage**: Token is stored securely in the database
3. **No Client-Side Storage**: Token is never stored in localStorage or sessionStorage
4. **Authenticated Access Only**: All settings operations require authentication
5. **User Isolation**: Each user's token is completely isolated from other users

## Database Setup Instructions

1. Open Supabase SQL Editor
2. Run the migration script: `docs/supabase-migration-user-settings.sql`
3. Verify the table was created successfully
4. Verify RLS is enabled
5. Verify all 4 policies were created

## Testing Checklist

### Database
- [ ] Run migration script in Supabase SQL Editor
- [ ] Verify `user_settings` table exists
- [ ] Verify RLS is enabled on the table
- [ ] Verify all 4 RLS policies exist

### Settings Page
- [ ] Navigate to Settings page from Dashboard
- [ ] Enter a DigitalOcean Personal Access Token
- [ ] Save settings successfully
- [ ] Verify token is saved (reload page and check it's still there)
- [ ] Update token with a new value
- [ ] Test show/hide password toggle
- [ ] Test back button navigation

### Add Agent Workflow
- [ ] Without token configured: "Add Agent" button should be hidden
- [ ] Configure token in Settings
- [ ] Navigate to Agents page
- [ ] Verify "Add Agent" button is now visible
- [ ] Click "Add Agent"
- [ ] Verify agents load automatically (no token input step)
- [ ] Select an agent and complete the form
- [ ] Verify agent is created successfully

### Security
- [ ] Verify users can only see their own settings
- [ ] Verify token is not visible in browser dev tools
- [ ] Verify token is not stored in localStorage
- [ ] Test with multiple users to ensure isolation

## UI/UX Improvements

1. **Better Terminology**: Changed "API Token" to "Personal Access Token" to match DigitalOcean's terminology
2. **Streamlined Workflow**: Removed one step from the Add Agent workflow
3. **Persistent Configuration**: Users only need to enter their token once
4. **Clear Guidance**: Error messages direct users to Settings if token is not configured
5. **Visual Feedback**: Show/hide toggle for token visibility
6. **Help Links**: Direct link to DigitalOcean's token generation page

## Future Enhancements

1. **Token Validation**: Add a "Test Connection" button to validate the token
2. **Token Expiry Handling**: Detect and handle expired tokens gracefully
3. **Multiple Providers**: Extend to support other cloud providers
4. **Token Rotation**: Add support for rotating tokens
5. **Audit Log**: Track when tokens are created/updated

## Files Modified

1. `docs/supabase-migration-user-settings.sql` (new)
2. `web/src/services/userSettingsService.ts` (new)
3. `web/src/pages/Settings.tsx` (new)
4. `web/src/pages/Dashboard.tsx` (modified)
5. `web/src/App.tsx` (modified)
6. `web/src/components/AddAgentFromDigitalOcean.tsx` (modified)
7. `web/src/pages/Agents.tsx` (modified)

## Build Status

✅ All TypeScript compilation successful
✅ All components build without errors
✅ No linting errors

