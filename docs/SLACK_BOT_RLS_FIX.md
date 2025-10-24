# Slack Bot RLS Policy Fix

## Problem

After implementing Row Level Security (RLS) policies with user role management, the Slack bot's `/agent list` command returns "No agent configured for this channel" even though agents exist in the database.

## Root Cause

The Slack bot uses `SUPABASE_ANON_KEY` to connect to Supabase, which provides **unauthenticated** access. However, the RLS policies require **authenticated users with admin or owner roles** to read from the `agents` and `slack_channel_agents` tables.

### What's Happening

1. The Slack bot calls `agentManager.listAgents()`
2. This queries the `agents` table using the anon key
3. The RLS policy checks `is_admin_or_owner()` which returns `false` for anonymous users
4. The query returns 0 rows (even though agents exist)
5. The bot displays "No agents configured yet"

## Solution Options

You have two options to fix this issue:

### Option 1: Use Service Role Key (Recommended) ✅

**Best for:** Backend services like the Slack bot that need full database access

The Slack bot is a **trusted backend service** and should use the service role key, which bypasses RLS policies entirely.

#### Steps:

1. **Add the service role key to your environment:**

   ```bash
   # In your .env file or deployment environment
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

   You can find this key in your Supabase dashboard under Settings → API.

2. **The code has been updated** to automatically use the service role key if available:
   - `lib/services/agent-manager.ts` - Uses `SUPABASE_SERVICE_ROLE_KEY` with fallback to `SUPABASE_ANON_KEY`
   - `bots/slack/slack-agent-manager.ts` - Same for usage logging

3. **Restart your Slack bot:**

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

4. **Verify it works:**

   In Slack, run:
   ```
   /agent list
   ```

   You should now see your configured agents.

### Option 2: Add Public Read Policies

**Best for:** If you want to keep using the anon key and allow public read access

This option adds RLS policies that allow anonymous users to **read** agents and channel mappings (but not write).

#### Steps:

1. **Run the migration:**

   Execute the SQL in `docs/supabase-migration-add-public-read-policies.sql` in your Supabase SQL editor.

2. **Restart your Slack bot** (no code changes needed)

3. **Verify it works** by running `/agent list` in Slack

#### Security Considerations:

- ✅ Safe: Agent configurations are not sensitive (API keys are stored as env var names, not actual keys)
- ✅ Write operations still require admin/owner authentication
- ✅ Only active agents are visible
- ⚠️ Anyone with the anon key can read agent configurations

## Recommended Approach

**Use Option 1 (Service Role Key)** because:

1. ✅ The Slack bot is a trusted backend service
2. ✅ It needs to perform operations on behalf of users
3. ✅ It's the standard pattern for backend services in Supabase
4. ✅ No additional database migrations needed
5. ✅ More secure (service role key should only be in backend, never exposed to clients)

## Verification

After applying the fix, verify that:

1. **`/agent list`** shows all configured agents
2. **`/agent info`** shows the current channel's agent
3. **`/agent select <name>`** works for admins (requires Slack workspace admin or channel creator permissions)
4. **Agent responses** work correctly in channels

## Troubleshooting

### Still seeing "No agents configured"?

1. **Check environment variables:**
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Check the logs:**
   ```bash
   docker logs slack-bot-container-name
   ```

   Look for:
   - `[AgentManager] Supabase credentials not configured` - Missing env vars
   - `[AgentManager] Failed to list agents:` - RLS policy issue

3. **Verify agents exist in database:**
   ```sql
   SELECT id, name, is_active FROM agents;
   ```

4. **Check RLS policies:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename IN ('agents', 'slack_channel_agents');
   ```

### Service role key not working?

1. **Verify the key is correct** - Copy it from Supabase dashboard → Settings → API
2. **Ensure no extra spaces** in the environment variable
3. **Restart the application** after adding the env var
4. **Check the key is being loaded:**
   ```typescript
   console.log('Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
   ```

## Related Files

- `lib/services/agent-manager.ts` - AgentManager implementation
- `bots/slack/slack-agent-manager.ts` - Slack-specific wrapper
- `docs/supabase-migration-user-roles.sql` - RLS policies that caused the issue
- `docs/supabase-migration-add-public-read-policies.sql` - Alternative solution (Option 2)

## Prevention

When implementing RLS policies in the future:

1. ✅ Consider which services need access (backend vs. client)
2. ✅ Use service role key for trusted backend services
3. ✅ Use anon key only for client-side access
4. ✅ Test all API endpoints after applying RLS policies
5. ✅ Document which key should be used for each service

