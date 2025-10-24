# Changes Summary: Slack Bot RLS Fix

## Date: 2025-01-24

## Problem
After implementing Row Level Security (RLS) policies with user role management, the Slack bot's `/agent list` command was returning "No agent configured for this channel" even though agents existed in the database.

## Root Cause
The Slack bot was using `SUPABASE_ANON_KEY` (anonymous/unauthenticated access) to connect to Supabase, but the RLS policies required authenticated users with admin or owner roles to read from the `agents` and `slack_channel_agents` tables.

## Solution
Updated the codebase to use `SUPABASE_SERVICE_ROLE_KEY` for backend services (Slack bot), which bypasses RLS policies. This is the recommended approach for trusted backend services.

## Files Changed

### 1. `lib/services/agent-manager.ts`
**Change:** Updated `createAgentManager()` to use service role key with fallback to anon key
```typescript
// Before:
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// After:
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
```

### 2. `bots/slack/slack-agent-manager.ts`
**Change:** Updated usage logging to use service role key
```typescript
// Before:
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// After:
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
```

### 3. `lib/services/supabase-thread-context.ts`
**Change:** Updated `createThreadContextStore()` to use service role key for consistency
```typescript
// Before:
const key = supabaseKey || process.env.SUPABASE_ANON_KEY;

// After:
const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
```

### 4. `bots/slack/env.example`
**Change:** Added documentation and example for service role key
```bash
# Supabase Setup
# Use SERVICE_ROLE_KEY for backend services (bypasses RLS)
# ANON_KEY is for client-side access only
SUPABASE_URL=https://example.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_service_role_key_here
SUPABASE_ANON_KEY=sb_anon_key_here
```

## New Files Created

### 1. `docs/SLACK_BOT_RLS_FIX.md`
Comprehensive troubleshooting guide explaining:
- The problem and root cause
- Two solution options (service role key vs. public read policies)
- Step-by-step instructions
- Verification steps
- Troubleshooting tips

### 2. `docs/supabase-migration-add-public-read-policies.sql`
Alternative solution that adds RLS policies to allow anonymous read access to agents and channel mappings. This is for users who prefer to keep using the anon key.

### 3. `docs/CHANGES_SUMMARY.md`
This file - documents all changes made to fix the issue.

## Action Required

### For Deployment:

1. **Add the service role key to your environment:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
   
   You can find this key in your Supabase dashboard under Settings → API.

2. **Rebuild and restart the Slack bot:**
   ```bash
   cd bots/slack
   pnpm run build
   pnpm start
   ```
   
   Or if using Docker:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. **Verify it works:**
   In Slack, run:
   ```
   /agent list
   ```
   
   You should now see your configured agents.

## Alternative Solution (Not Recommended)

If you prefer to keep using the anon key instead of the service role key, you can run the migration in `docs/supabase-migration-add-public-read-policies.sql` to add public read policies. However, using the service role key is the recommended approach for backend services.

## Security Considerations

✅ **Safe:** The service role key is only used in the backend (Slack bot), never exposed to clients
✅ **Secure:** The service role key should only be stored in secure environment variables
✅ **Best Practice:** This is the standard pattern for backend services in Supabase
⚠️ **Important:** Never commit the service role key to version control

## Testing

After deploying these changes, verify that:

1. ✅ `/agent list` shows all configured agents
2. ✅ `/agent info` shows the current channel's agent
3. ✅ `/agent select <name>` works for admins
4. ✅ Agent responses work correctly in channels
5. ✅ Usage logging works (check `agent_usage_logs` table)

## Rollback Plan

If issues occur, you can:

1. **Revert to anon key:** Remove `SUPABASE_SERVICE_ROLE_KEY` from environment
2. **Apply public read policies:** Run `docs/supabase-migration-add-public-read-policies.sql`
3. **Restart the bot**

## Related Documentation

- `docs/SLACK_BOT_RLS_FIX.md` - Detailed troubleshooting guide
- `docs/supabase-migration-user-roles.sql` - RLS policies that caused the issue
- `docs/supabase-migration-add-public-read-policies.sql` - Alternative solution
- `docs/USER_MANAGEMENT.md` - User role management documentation

## Notes

- The code maintains backward compatibility by falling back to `SUPABASE_ANON_KEY` if the service role key is not set
- All changes are non-breaking for existing deployments
- The web application (`web/`) still correctly uses the anon key for client-side access
- The API server (`server/`) already uses the service role key correctly

