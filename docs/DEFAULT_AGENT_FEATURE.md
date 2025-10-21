# Default Agent Feature

## Overview

This feature adds support for setting a default agent that will be used as a fallback when no channel-specific agent is configured. This provides a better user experience by allowing administrators to configure a default agent through the UI instead of relying solely on environment variables.

## How It Works

### Agent Selection Priority

When a message is received in Slack, the bot now follows this priority order:

1. **Channel-Specific Agent** - If a channel has an agent assigned via `/agent select`, use that agent
2. **Default Agent (Database)** - If no channel agent is configured, use the default agent from the database (if one is set)
3. **Environment-Based Agent** - If no default agent is set in the database, fall back to the agent configured via environment variables (`AGENT_PROVIDER`, `OPENAI_API_KEY`, etc.)

### Database Changes

A new `is_default` column has been added to the `agents` table:

```sql
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
```

**Important:** Only ONE agent can be marked as default at a time. This is enforced by a database trigger that automatically unsets `is_default` on all other agents when you set a new default.

## Setup Instructions

### 1. Run the Database Migration

Execute the migration SQL in your Supabase SQL editor:

```bash
# File: docs/supabase-migration-add-default-agent.sql
```

This will:
- Add the `is_default` column to the `agents` table
- Create an index for quick lookup
- Add a trigger to ensure only one default agent exists
- Add RLS policy for reading the default agent

### 2. Set a Default Agent

You can set a default agent in two ways:

#### Option A: Via the Web UI

1. Go to the Agents page in the web UI
2. Create or edit an agent
3. Check the "Set as Default" checkbox
4. Save the agent

#### Option B: Via SQL

```sql
UPDATE agents 
SET is_default = true 
WHERE name = 'your-agent-name';
```

The trigger will automatically unset `is_default` on all other agents.

### 3. Rebuild and Redeploy

After making the code changes, rebuild the shared library and Slack bot:

```bash
# Rebuild shared library
cd lib
pnpm run build

# Rebuild Slack bot
cd ../bots/slack
pnpm run build

# Rebuild and push container (if using Docker/Podman)
pnpm run build:container
pnpm run push:container

# Or restart the bot if running locally
pnpm run start
```

## Code Changes Summary

### Backend Changes

1. **lib/types/agent-types.ts** - Added `is_default?: boolean` to `AgentRecord` interface
2. **lib/services/agent-manager.ts** - Added methods:
   - `getDefaultAgent()` - Get the default agent from database
   - `getDefaultAgentService()` - Create agent service for default agent
3. **bots/slack/slack-agent-manager.ts** - Added wrapper methods for default agent
4. **bots/slack/app.ts** - Updated message handlers to use default agent as fallback

### Frontend Changes

1. **web/src/services/agentManagementService.ts** - Added:
   - `is_default` field to `Agent` interface
   - `setDefaultAgent(id)` method
   - `getDefaultAgent()` method
2. **web/src/components/AgentForm.tsx** - Added "Set as Default" checkbox
3. **web/src/pages/Agents.tsx** - Added "Default" badge to show which agent is default

## Usage

### For End Users

No changes needed! The bot will automatically use the default agent when no channel-specific agent is configured.

### For Administrators

1. **Set a default agent** via the web UI or SQL
2. **Assign channel-specific agents** using `/agent select <name>` in Slack channels
3. **View which agent is default** - Look for the blue "Default" badge in the Agents page

### Slack Commands

- `/agent list` - Shows all available agents
- `/agent select <name>` - Assigns an agent to the current channel
- `/agent info` - Shows the current channel's agent (or indicates if using default)

## Benefits

1. **Better UX** - No need to restart the bot to change the default agent
2. **Centralized Management** - All agent configuration in one place (database)
3. **Graceful Fallback** - Always have a working agent, even if no channel-specific agent is set
4. **Easy Testing** - Quickly switch default agents without changing environment variables

## Troubleshooting

### Default agent not being used

1. Check that the agent has `is_default = true` in the database:
   ```sql
   SELECT name, is_default, is_active FROM agents WHERE is_default = true;
   ```

2. Ensure the agent is active (`is_active = true`)

3. Check the Slack bot logs for messages like:
   - `"Used default agent from database for DM"`
   - `"Used default agent from database for channel message"`

### Multiple default agents

This shouldn't happen due to the trigger, but if it does:

```sql
-- Unset all defaults
UPDATE agents SET is_default = false;

-- Set only one as default
UPDATE agents SET is_default = true WHERE name = 'your-agent-name';
```

### RLS Policy Issues

If you get permission errors, ensure the RLS policy is created:

```sql
CREATE POLICY IF NOT EXISTS "Allow public read access to default agent"
ON agents
FOR SELECT
TO anon
USING (is_default = true);
```

## Future Enhancements

Potential improvements for this feature:

1. **Per-Team Defaults** - Allow different default agents for different Slack workspaces
2. **Time-Based Defaults** - Schedule different default agents for different times of day
3. **Default Agent Analytics** - Track how often the default agent is used vs channel-specific agents
4. **UI Indicator** - Show in Slack when the default agent is being used (e.g., in the response)

