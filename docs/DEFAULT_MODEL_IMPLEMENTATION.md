# Default AI Model Selection Implementation

**Date:** 2025-01-28

## Overview

This feature allows system owners to select a default AI model from DigitalOcean's available models. The selected model is stored in a system-wide preferences table and can be used for future functionality.

## Implementation Summary

### 1. Database Migration

**File:** `docs/supabase-migration-system-preferences.sql`

Created `system_preferences` table with:
- `preference_key` (unique text): Identifies the preference (e.g., "default_ai_model")
- `preference_value` (JSONB): Stores the preference data
- `updated_by` (UUID): Tracks which owner updated the preference

**RLS Policies:**
- All authenticated users can read system preferences
- Only owners can insert/update/delete system preferences

### 2. Backend API

**File:** `server/src/routes/system-preferences.ts`

Created API endpoints:
- `GET /api/system-preferences/models` - Fetches available AI models from DigitalOcean
- `GET /api/system-preferences/:key` - Retrieves a specific preference
- `PUT /api/system-preferences/:key` - Updates a preference (owner-only)

The models endpoint uses the `DIGITALOCEAN_API_KEY` environment variable to authenticate with DigitalOcean's API at `https://api.digitalocean.com/v2/ml/models`.

### 3. Frontend Service

**File:** `web/src/services/systemPreferencesService.ts`

Created service with methods:
- `getAvailableModels()` - Fetches AI models from backend
- `getPreference(key)` - Gets a system preference
- `updatePreference(key, value)` - Updates a preference
- `getDefaultModel()` - Convenience method for default model
- `setDefaultModel(modelId)` - Convenience method to set default model

### 4. UI Integration

**File:** `web/src/pages/Settings.tsx`

Updated the Settings page to:
- Display "System Preferences" section (visible only to owners)
- Show dropdown with available AI models from DigitalOcean
- Load and display currently selected default model
- Save the selected model when form is submitted

## How to Use

### 1. Apply Database Migration

Run the SQL migration in your Supabase SQL Editor:

```bash
# Copy the contents of docs/supabase-migration-system-preferences.sql
# and paste into Supabase SQL Editor
```

Or via CLI:
```bash
psql $SUPABASE_DATABASE_URL < docs/supabase-migration-system-preferences.sql
```

### 2. Configure DigitalOcean API Key

Add to your `.env` file or deployment environment:

```bash
DIGITALOCEAN_API_KEY=your-digitalocean-api-key
```

### 3. Access Settings as Owner

1. Log in as a user with the `owner` role
2. Navigate to `/settings`
3. Scroll to "System Preferences" section
4. Select a model from the dropdown
5. Click "Save Settings"

## Data Structure

The default model preference is stored as:

```json
{
  "preference_key": "default_ai_model",
  "preference_value": {
    "model_id": "meta-llama/llama-3.1-70b-instruct"
  }
}
```

## Future Integration

The default model can be retrieved programmatically:

```typescript
import { systemPreferencesService } from '@/services/systemPreferencesService';

const defaultModel = await systemPreferencesService.getDefaultModel();
```

This value can then be used when creating new agents or processing requests.

## Security

- Only users with the `owner` role can update system preferences
- All authenticated users can read preferences (needed for agents to use the default model)
- DigitalOcean API key is stored server-side only and never exposed to clients
- RLS policies enforce access control at the database level

## Files Changed

1. **Database:**
   - `docs/supabase-migration-system-preferences.sql` (new)

2. **Backend:**
   - `server/src/routes/system-preferences.ts` (new)
   - `server/src/app.ts` (updated to register router)

3. **Frontend:**
   - `web/src/services/systemPreferencesService.ts` (new)
   - `web/src/pages/Settings.tsx` (updated with model selection UI)

## Testing Checklist

- [ ] Run migration in Supabase
- [ ] Verify table and RLS policies created
- [ ] Set `DIGITALOCEAN_API_KEY` environment variable
- [ ] Log in as owner
- [ ] Navigate to Settings page
- [ ] Verify models load from DigitalOcean API
- [ ] Select a model and save
- [ ] Refresh page and verify selected model persists
- [ ] Log in as non-owner and verify System Preferences section is hidden
- [ ] Verify non-owners cannot update preferences via API

## Notes

- The DigitalOcean models endpoint may require specific API permissions
- If `DIGITALOCEAN_API_KEY` is not configured, the models endpoint returns an empty array
- The default model is not yet consumed by any agents - this will be implemented in future updates
