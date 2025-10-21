# S3 Bucket Management Refactor

## Overview

This document describes the refactoring of the web UI's S3 bucket management system to support multiple buckets associated with different agents, rather than managing files from a single hardcoded bucket.

## Changes Made

### 1. Database Schema

**New Column: `s3_access_key_env_var`**
- Added to the `agents` table
- Type: `TEXT` (nullable)
- Purpose: Stores the environment variable name containing S3 credentials for the agent's bucket
- If null, default credentials from the environment are used

**Migration File:** `docs/supabase-migration-add-s3-access-key-env-var.sql`

### 2. Type Definitions

**Updated Interfaces:**
- `lib/types/agent-types.ts` - Added `s3_access_key_env_var?: string` to `AgentRecord`
- `web/src/services/agentManagementService.ts` - Added field to `Agent` and `CreateAgentInput` interfaces

### 3. S3 Service Refactoring

**File:** `web/src/services/s3Service.ts`

**Changes:**
- Added `S3Config` interface for configurable S3 settings
- Modified `S3Service` constructor to accept optional `S3Config` parameter
- Maintains backward compatibility with default singleton instance
- Added `createS3Service()` factory function for creating instances with custom configurations

**Before:**
```typescript
class S3Service {
  constructor() {
    // Hardcoded to use config.s3
  }
}
export const s3Service = new S3Service();
```

**After:**
```typescript
class S3Service {
  constructor(s3Config?: S3Config) {
    const cfg = s3Config || config.s3;
    // Use provided config or default
  }
}
export const s3Service = new S3Service(); // Default instance
export function createS3Service(s3Config: S3Config): S3Service; // Factory
```

### 4. Agent Management Service

**File:** `web/src/services/agentManagementService.ts`

**New Method:**
```typescript
async getS3Buckets(): Promise<Map<string, Agent[]>>
```
- Returns a map of bucket names to arrays of agents using that bucket
- Only includes active agents
- Used by the Dashboard to display available buckets

### 5. New Components

#### BucketList Component
**File:** `web/src/components/BucketList.tsx`

**Purpose:** Displays all S3 buckets from the agents table as clickable cards

**Features:**
- Shows bucket name
- Displays count of agents using the bucket
- Shows up to 3 agent names as tags (with "+X more" for additional agents)
- Navigates to bucket detail page on click
- Loading and empty states

#### BucketDetail Page
**File:** `web/src/pages/BucketDetail.tsx`

**Purpose:** Manages files within a specific S3 bucket

**Features:**
- Displays bucket name and associated agents
- Shows agent details (name, provider, S3 prefix)
- Reuses existing `FileUpload` and `FileList` components
- Creates bucket-specific S3Service instance
- Back navigation to Dashboard
- Error handling for missing buckets

**Route:** `/buckets/:bucketName`

### 6. Updated Components

#### FileUpload Component
**File:** `web/src/components/FileUpload.tsx`

**Changes:**
- Added optional `s3Service` prop
- Defaults to the singleton instance for backward compatibility
- Allows passing custom S3Service instance for bucket-specific operations

#### FileList Component
**File:** `web/src/components/FileList.tsx`

**Changes:**
- Added optional `s3Service` prop
- Defaults to the singleton instance for backward compatibility
- Allows passing custom S3Service instance for bucket-specific operations

#### Dashboard Page
**File:** `web/src/pages/Dashboard.tsx`

**Changes:**
- Removed direct file management (FileUpload, FileList)
- Now displays `BucketList` component
- Loads buckets from `agentManagementService.getS3Buckets()`
- Updated UI to show "S3 Buckets" heading with description

**Before:** Single bucket file management interface
**After:** List of all buckets with navigation to detail pages

#### AgentForm Component
**File:** `web/src/components/AgentForm.tsx`

**Changes:**
- Added "S3 Access Key Environment Variable" field in RAG Configuration section
- Field is optional
- Includes helpful placeholder and description
- Properly initialized in form state and useEffect

### 7. Routing

**File:** `web/src/App.tsx`

**New Route:**
```typescript
<Route
  path="/buckets/:bucketName"
  element={
    <ProtectedRoute>
      <BucketDetail />
    </ProtectedRoute>
  }
/>
```

## User Flow

### Before
1. User logs in
2. Dashboard shows files from `VITE_S3_BUCKET`
3. User can upload/manage files in that single bucket

### After
1. User logs in
2. Dashboard shows list of all S3 buckets from active agents
3. User clicks on a bucket
4. Bucket detail page shows:
   - Which agents use this bucket
   - File upload interface
   - File list for that bucket
5. User can navigate back to bucket list

## Environment Variables

### No Longer Required for Dashboard
- `VITE_S3_BUCKET` - Previously required, now only used as fallback

### Still Required
- `VITE_S3_REGION` - S3 region
- `VITE_S3_ENDPOINT` - S3 endpoint URL
- `VITE_S3_ACCESS_KEY_ID` - Default S3 access key
- `VITE_S3_SECRET_ACCESS_KEY` - Default S3 secret key

### New (Optional)
- Per-agent S3 credentials can be configured via the `s3_access_key_env_var` field
- Example: If agent has `s3_access_key_env_var: "S3_SAFETY_BOT_KEY"`, the system would look for that environment variable
- **Note:** Backend implementation for fetching credentials by env var name is not yet implemented

## Migration Steps

### 1. Database Migration
```bash
# Apply the migration to add the new column
psql $SUPABASE_DATABASE_URL < docs/supabase-migration-add-s3-access-key-env-var.sql
```

Or use the Supabase dashboard to run the SQL.

### 2. Update Code
All code changes are already in place. No additional steps needed.

### 3. Update Agents (Optional)
If you want to use different S3 credentials for specific agents:
1. Go to Agents page
2. Edit an agent
3. Set "S3 Access Key Environment Variable" to the name of an environment variable
4. Ensure that environment variable is set in your deployment

### 4. Test
1. Verify Dashboard shows all buckets from active agents
2. Click on a bucket to view its files
3. Upload/delete/rename files in a bucket
4. Navigate back to Dashboard
5. Test with multiple agents sharing the same bucket

## Future Enhancements

### Credential Management
Currently, the system uses default S3 credentials for all buckets. Future enhancements could include:
- Backend API to securely fetch credentials by environment variable name
- Per-bucket credential validation
- Credential testing before saving agent configuration

### Bucket Statistics
- Show file count per bucket on the Dashboard
- Show total storage used per bucket
- Last modified timestamp

### Bucket Filtering
- Filter buckets by agent provider (OpenAI vs DigitalOcean)
- Search buckets by name
- Sort by name, agent count, etc.

### Prefix Support
- Show files filtered by agent's S3 prefix
- Allow switching between different prefixes within a bucket
- Prefix-specific file management

## Backward Compatibility

All changes maintain backward compatibility:
- Existing `s3Service` singleton still works
- Components accept optional `s3Service` prop with sensible defaults
- Database migration is additive (new nullable column)
- Environment variables remain the same

## Security Considerations

- S3 credentials are never stored in the database (only environment variable names)
- Credentials are loaded server-side from environment variables
- Client-side code uses default credentials from build-time environment
- Future: Implement server-side credential proxy for enhanced security

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Dashboard loads and displays buckets
- [ ] Clicking a bucket navigates to detail page
- [ ] File upload works in bucket detail page
- [ ] File list displays correctly
- [ ] File delete works
- [ ] File rename works
- [ ] Back navigation works
- [ ] Agent form includes new S3 credential field
- [ ] Creating agent with S3 credential field works
- [ ] Editing agent preserves S3 credential field
- [ ] Multiple agents can share the same bucket
- [ ] Empty state displays when no agents exist
- [ ] Loading states display correctly
- [ ] Error handling works for missing buckets

