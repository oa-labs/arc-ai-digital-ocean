# Slack Assistant Setup Guide

This guide walks through setting up the Slack Assistant integration for threaded conversations with context management.

## Prerequisites

1. Slack App with Socket Mode enabled
2. Supabase project (for thread context storage)
3. DigitalOcean AI API key

## Slack App Configuration

### 1. Enable Agents & AI Apps Feature

In your Slack App Settings:
- Navigate to **Features** → **Agents & AI**
- Enable the **Agents & AI Apps** feature

### 2. OAuth Scopes

Add the following bot token scopes in **OAuth & Permissions**:
- `assistant:write` - Required for Assistant features
- `chat:write` - Send messages
- `im:history` - Read direct message history
- `channels:history` - Read channel history (if needed)
- `app_mentions:read` - Respond to @mentions

### 3. Event Subscriptions

Subscribe to the following bot events in **Event Subscriptions**:
- `assistant_thread_started` - When user opens Assistant
- `assistant_thread_context_changed` - When user switches context
- `message.im` - Direct messages to the bot
- `app_mention` - @mentions in channels (for backwards compatibility)

## Environment Variables

Add these to your `.env` file in `bots/slack/`:

```bash
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token  # Required for Socket Mode
SLACK_SOCKET_MODE=true

# Supabase Configuration (for thread context storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# AI Provider (DigitalOcean)
DIGITALOCEAN_API_KEY=your-digitalocean-key
DIGITALOCEAN_AGENT_ENDPOINT=https://your-agent-endpoint.digitalocean.com
DIGITALOCEAN_MODEL=gpt-4  # or gpt-3.5-turbo
DIGITALOCEAN_TEMPERATURE=0.7
DIGITALOCEAN_MAX_TOKENS=1000

# Debug mode
DEBUG=1  # Optional, for verbose logging
```

## Database Setup

Run the Supabase migration to create the thread context table:

```sql
-- See docs/supabase-migration-slack-thread-contexts.sql
CREATE TABLE slack_thread_contexts (
  thread_ts TEXT PRIMARY KEY,
  context JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Or use the Supabase CLI:
```bash
# Apply migration
supabase db push

# Or via SQL editor in Supabase Dashboard
# Copy and paste the migration from docs/supabase-migration-slack-thread-contexts.sql
```

## Features

### Thread Context Management
- Stores conversation context in Supabase
- Maintains channel, team, and enterprise information
- Automatically saves context on thread start and changes

### Streaming Responses
- Responses stream character-by-character to the user
- Provides real-time feedback with "thinking..." status

### Feedback Buttons
- Users can rate responses with 👍/👎 buttons
- Feedback is logged for quality analysis

### Backwards Compatibility
- Still responds to regular DMs and @mentions
- Assistant features work alongside existing handlers

## Testing

1. Open Slack and navigate to your workspace
2. Click on the app in the sidebar or DM the bot
3. Click the Assistant icon (if available) or send a message
4. The bot should:
   - Set "thinking..." status
   - Stream the AI response
   - Show feedback buttons at the end

## Debugging

Enable debug mode with `DEBUG=1` to see detailed logs:
- Thread context saves/loads
- Assistant middleware execution
- AI response generation
- Feedback events

## Architecture

```
User Message → Assistant Middleware → Thread Context Store (Supabase)
                      ↓
            Retrieve Thread History
                      ↓
              AI Agent Service (DigitalOcean)
                      ↓
          Stream Response → Feedback Buttons
```

## Known Limitations

- Thread context is stored in Supabase (ensure credentials are configured)
- Streaming simulates chunks from full responses (not true LLM streaming yet)
- Assistant features require Slack Bolt v4.0.0+

## Troubleshooting

### "AssistantThreadContextStore not found"
- Ensure @slack/bolt is version 4.0.0 or higher
- Run `pnpm install` to update dependencies

### "Failed to save thread context"
- Check SUPABASE_URL and SUPABASE_ANON_KEY are set correctly
- Verify the slack_thread_contexts table exists
- Check Supabase logs for permission errors

### Responses not streaming
- Verify the user is interacting via Assistant interface
- Check that `userMessage` handler is executing (enable DEBUG=1)
- Ensure AI service is responding correctly

## Further Reading

- [Slack Assistant Documentation](https://docs.slack.dev/tools/bolt-js/concepts/ai-apps)
- [Bolt for JavaScript v4 Release Notes](https://github.com/slackapi/bolt-js/releases)
- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
