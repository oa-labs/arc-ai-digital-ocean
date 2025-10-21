# Multi-Agent System for Slack Bot

This document describes the multi-agent system architecture that allows each Slack channel to use a different AI agent with its own RAG (Retrieval-Augmented Generation) database.

## Overview

The multi-agent system enables:
- **Channel-specific AI agents**: Each Slack channel can be configured to use a different AI agent
- **Multiple AI providers**: Support for both OpenAI and DigitalOcean AI providers
- **Isolated RAG databases**: Each agent has its own S3-based knowledge base
- **Admin-only configuration**: Only workspace admins and channel creators can change agents
- **Usage tracking**: Comprehensive logging of agent usage and changes
- **Backward compatibility**: Existing deployments continue to work with default agent

### RAG Architecture

The system handles RAG (Retrieval-Augmented Generation) differently based on the AI provider:

**OpenAI Agents:**
- RAG documents are loaded from S3 and searched **client-side** by the Slack bot
- The bot builds context from relevant documents and includes it in the prompt
- S3 bucket/prefix is used to load and search documents in real-time

**DigitalOcean Agents:**
- RAG is configured and handled **automatically on the DigitalOcean backend**
- The Slack bot sends messages directly without loading/searching documents
- S3 bucket/prefix is configured in DigitalOcean's agent settings
- The web UI is used to manage files in S3 that DigitalOcean's RAG will use

## Architecture

### Database Schema

The system uses 5 Supabase tables:

1. **`agents`** - Stores agent configurations
   - `id` (UUID) - Unique agent identifier
   - `name` (TEXT) - Agent name (unique)
   - `provider` (TEXT) - 'openai' or 'digitalocean'
   - `api_key_env_var` (TEXT) - Environment variable name for API key
   - `model` (TEXT) - Model name (e.g., 'gpt-4')
   - `s3_bucket` (TEXT) - S3 bucket for RAG documents
   - `s3_prefix` (TEXT) - Optional S3 prefix for RAG documents
   - `system_prompt` (TEXT) - Custom system prompt
   - `temperature`, `max_tokens`, `endpoint`, `organization` - Model parameters

2. **`slack_channel_agents`** - Maps Slack channels to agents
   - `channel_id` (TEXT) - Slack channel ID (primary key)
   - `agent_id` (UUID) - Reference to agents table
   - `activated_by` (TEXT) - User who activated this agent
   - `team_id`, `channel_name` - Slack metadata

3. **`agent_usage_logs`** - Tracks agent usage
   - Logs every message processed by an agent
   - Includes token counts, response times, errors

4. **`agent_change_log`** - Audit trail for agent changes
   - Tracks when agents are changed for channels
   - Includes previous and new agent IDs

5. **`agent_managers`** - Optional custom permissions
   - Allows granting agent management rights to specific users

### Components

#### Shared Library (`@/lib`)

- **`lib/types/agent-types.ts`** - TypeScript interfaces for all agent-related types
- **`lib/services/agent-manager.ts`** - Core agent management service
  - Queries Supabase for agents and channel mappings
  - Creates and caches agent service instances
  - Loads RAG documents from S3 (for OpenAI agents only)
  - Logs usage and changes
- **`lib/services/rag-service.ts`** - RAG document loading and search (OpenAI agents only)
  - Loads documents from S3
  - Performs keyword-based search (can be enhanced with embeddings)
  - Builds context strings for prompts
  - Not used for DigitalOcean agents (RAG handled on their backend)

#### Slack Bot (`@/bots/slack`)

- **`bots/slack/permissions.ts`** - Permission checking using Slack API
  - Checks if user is workspace owner, admin, or channel creator
  - Used to restrict `/agent select` command
- **`bots/slack/slash-commands.ts`** - Slash command handlers
  - `/agent list` - List all available agents (all users)
  - `/agent select <name>` - Change channel's agent (admin only)
  - `/agent info` - Show current channel's agent (all users)
  - `/agent help` - Show help message (all users)
- **`bots/slack/slack-agent-manager.ts`** - Slack-specific agent manager wrapper
  - Retrieves agent service for a channel
  - Builds RAG context for messages (OpenAI agents only)
  - Skips RAG for DigitalOcean agents (handled automatically)
  - Logs usage to Supabase
- **`bots/slack/app.ts`** - Main Slack app (updated)
  - Integrates multi-agent system into message handlers
  - Falls back to default agent if multi-agent not configured

## Setup

### 1. Database Migration

Run the SQL migration to create the required tables:

```bash
# Apply the migration to your Supabase database
psql $SUPABASE_DATABASE_URL < docs/supabase-migration-multi-agent-system.sql
```

Or use the Supabase dashboard to run the SQL from `docs/supabase-migration-multi-agent-system.sql`.

### 2. Environment Variables

Add the following environment variables:

```bash
# Supabase (required for multi-agent system)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# S3 for RAG documents (required if using RAG)
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Agent API keys (one per agent)
# The environment variable names should match the api_key_env_var field in the agents table
AGENT_SAFETY_OPENAI_KEY=sk-...
AGENT_SUPPORT_DIGITALOCEAN_KEY=do-...
```

### 3. Create Agents

Insert agents into the `agents` table:

```sql
-- Example: OpenAI agent for safety
INSERT INTO agents (name, description, provider, api_key_env_var, model, s3_bucket, s3_prefix, system_prompt)
VALUES (
  'safety-bot',
  'AI agent specialized in workplace safety',
  'openai',
  'AGENT_SAFETY_OPENAI_KEY',
  'gpt-4',
  'my-rag-bucket',
  'safety-docs/',
  'You are a workplace safety expert. Provide clear, actionable safety guidance.'
);

-- Example: DigitalOcean agent for support
INSERT INTO agents (name, description, provider, api_key_env_var, model, endpoint, s3_bucket)
VALUES (
  'support-bot',
  'AI agent for customer support',
  'digitalocean',
  'AGENT_SUPPORT_DIGITALOCEAN_KEY',
  'gpt-5-nano-2025-08-07',
  'https://api.digitalocean.com/v2/ai/chat/completions',
  'my-rag-bucket'
);
```

### 4. Upload RAG Documents

Upload documents to S3 for each agent:

```bash
# Upload safety documents
aws s3 cp safety-manual.txt s3://my-rag-bucket/safety-docs/
aws s3 cp safety-procedures.txt s3://my-rag-bucket/safety-docs/

# Upload support documents
aws s3 cp faq.txt s3://my-rag-bucket/support-docs/
```

### 5. Configure Slack App

Add the `/agent` slash command to your Slack app:

1. Go to https://api.slack.com/apps
2. Select your app
3. Go to "Slash Commands"
4. Click "Create New Command"
5. Set:
   - Command: `/agent`
   - Request URL: `https://your-bot-url/slack/events`
   - Short Description: `Manage AI agents for this channel`
   - Usage Hint: `list | select <name> | info | help`

Add required OAuth scopes:
- `users:read` - To check user permissions
- `channels:read` - To check channel info
- `groups:read` - To check private channel info
- `conversations.info` - To get channel details

### 6. Restart Slack Bot

Restart your Slack bot to load the new code:

```bash
cd bots/slack
npm run build
npm start
```

## Usage

### For All Users

**List available agents:**
```
/agent list
```

**View current channel's agent:**
```
/agent info
```

**Get help:**
```
/agent help
```

### For Admins Only

**Change channel's agent:**
```
/agent select safety-bot
```

Only workspace owners, workspace admins, and channel creators can change agents.

## Data Flow

### For OpenAI Agents (Client-Side RAG)

1. **User sends message** in Slack channel
2. **Slack bot receives message** via Bolt framework
3. **SlackAgentManager** checks if multi-agent is enabled
4. **AgentManager** queries Supabase for channel's agent
5. **AgentManager** creates/retrieves cached agent service instance
6. **RAGService** loads relevant documents from S3
7. **RAGService** searches documents for relevant context using keyword matching
8. **Enhanced prompt** is built with RAG context + user message
9. **OpenAI agent service** sends prompt to OpenAI API
10. **Response** is formatted and sent back to Slack
11. **Usage is logged** to Supabase

### For DigitalOcean Agents (Backend RAG)

1. **User sends message** in Slack channel
2. **Slack bot receives message** via Bolt framework
3. **SlackAgentManager** checks if multi-agent is enabled
4. **AgentManager** queries Supabase for channel's agent
5. **AgentManager** creates/retrieves cached agent service instance
6. **SlackAgentManager** skips RAG context building (handled by DigitalOcean)
7. **DigitalOcean agent service** sends message directly to DigitalOcean API
8. **DigitalOcean backend** automatically searches configured RAG database
9. **Response** is formatted and sent back to Slack
10. **Usage is logged** to Supabase

## Backward Compatibility

The multi-agent system is **fully backward compatible**:

- If `SUPABASE_URL` and `SUPABASE_ANON_KEY` are not set, the system falls back to the default agent
- Existing channels without agent mappings use the default agent
- All existing functionality continues to work

## Security

- **API keys are never stored in the database** - Only environment variable names are stored
- **Row Level Security (RLS)** is enabled on all tables
- **Admin-only agent selection** - Only authorized users can change agents
- **Audit trail** - All agent changes are logged with user IDs

## Monitoring

### View Agent Usage

```sql
SELECT
  a.name as agent_name,
  COUNT(*) as message_count,
  SUM(total_tokens) as total_tokens,
  AVG(response_time_ms) as avg_response_time_ms
FROM agent_usage_logs l
JOIN agents a ON l.agent_id = a.id
WHERE l.created_at > NOW() - INTERVAL '7 days'
GROUP BY a.name
ORDER BY message_count DESC;
```

### View Agent Changes

```sql
SELECT
  c.channel_name,
  pa.name as previous_agent,
  na.name as new_agent,
  l.changed_by,
  l.changed_at
FROM agent_change_log l
LEFT JOIN agents pa ON l.previous_agent_id = pa.id
JOIN agents na ON l.new_agent_id = na.id
ORDER BY l.changed_at DESC
LIMIT 20;
```

## Future Enhancements

- **Web UI** for agent management (Phase 4)
- **Embedding-based RAG search** instead of keyword matching
- **Agent templates** for quick setup
- **Per-user agent preferences** in DMs
- **Agent performance analytics** dashboard
- **A/B testing** between agents
- **Custom agent permissions** beyond workspace admins

## Troubleshooting

### Multi-agent system not working

1. Check environment variables:
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   ```

2. Check Slack bot logs:
   ```bash
   # Look for these messages:
   # [SlackAgentManager] Agent manager not initialized - multi-agent features disabled
   # [SlackAgentManager] RAG service not initialized - RAG features disabled
   ```

3. Verify database tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'agent%';
   ```

### Permission denied errors

1. Verify user is workspace admin or channel creator
2. Check Slack app has required scopes: `users:read`, `channels:read`, `groups:read`
3. Reinstall Slack app if scopes were added after installation

### RAG not working

**For OpenAI Agents (Client-Side RAG):**

1. Check S3 credentials:
   ```bash
   echo $S3_ENDPOINT
   echo $S3_ACCESS_KEY_ID
   ```

2. Verify S3 bucket and prefix in agents table
3. Check documents exist in S3:
   ```bash
   aws s3 ls s3://my-rag-bucket/safety-docs/
   ```

4. Enable debug logging to see RAG document loading:
   ```bash
   DEBUG=1 npm start
   ```

**For DigitalOcean Agents (Backend RAG):**

1. Verify RAG database is configured in DigitalOcean agent settings
2. Check that S3 bucket is accessible from DigitalOcean
3. Ensure files are uploaded to the correct S3 bucket/prefix
4. The Slack bot does NOT load documents for DigitalOcean agents - RAG is handled automatically

### Agent not found

1. Verify agent exists and is active:
   ```sql
   SELECT name, is_active FROM agents;
   ```

2. Check API key environment variable is set:
   ```bash
   echo $AGENT_SAFETY_OPENAI_KEY
   ```

## Support

For issues or questions, please contact the development team or file an issue in the repository.

