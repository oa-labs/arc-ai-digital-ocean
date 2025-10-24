# Quick Fix: "/agent list" Returns No Agents

## Problem
`/agent list` command in Slack returns "No agent configured for this channel" even though agents exist.

## Quick Fix (2 minutes)

### Step 1: Add Service Role Key
Add this to your `.env` file or deployment environment:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find it:** Supabase Dashboard → Settings → API → `service_role` key

### Step 2: Rebuild and Restart

```bash
cd bots/slack
pnpm run build
pnpm start
```

Or with Docker:
```bash
docker-compose down
docker-compose up -d --build
```

### Step 3: Test
In Slack, run:
```
/agent list
```

✅ You should now see your agents!

## Why This Fixes It

- The Slack bot was using the **anon key** (for public/client access)
- RLS policies require **admin/owner authentication** to read agents
- The **service role key** bypasses RLS (safe for backend services)

## Need More Help?

See `docs/SLACK_BOT_RLS_FIX.md` for detailed troubleshooting.

## Alternative Solution

If you can't use the service role key, run this SQL in Supabase:

```sql
-- File: docs/supabase-migration-add-public-read-policies.sql
CREATE POLICY IF NOT EXISTS "Allow public read access to active agents"
ON agents FOR SELECT TO anon USING (is_active = true);

CREATE POLICY IF NOT EXISTS "Allow public read access to channel agents"
ON slack_channel_agents FOR SELECT TO anon USING (true);
```

Then restart the bot (no code changes needed).

