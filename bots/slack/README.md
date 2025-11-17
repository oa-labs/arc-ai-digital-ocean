# ArcAI Slack Bot

Slack bot integration for the ArcAI workplace safety AI assistant.

## Quick Start

1. **Prerequisites**
   - Node.js 22+
   - PostgreSQL database (existing)
   - Slack workspace with admin access

2. **Installation**
   ```bash
   cd bots/slack
   pnpm install
   ```

3. **Database Setup**
   ```bash
   # Create the required table in your PostgreSQL database
   psql -h your-host -U your-user -d your-database -f database-setup.sql
   ```

4. **Environment Configuration**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Build and Run**
   ```bash
   pnpm run build
   pnpm run start
   ```

## Database Setup

Create a file named `database-setup.sql` with the following content and run it against your PostgreSQL database:

```sql
-- Thread context storage for Slack conversations
CREATE TABLE IF NOT EXISTS slack_thread_contexts (
  thread_ts TEXT PRIMARY KEY,
  context JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slack_thread_contexts_updated_at ON slack_thread_contexts(updated_at);
CREATE INDEX IF NOT EXISTS idx_slack_thread_contexts_thread_ts ON slack_thread_contexts(thread_ts);

-- Optional: Create a user for the bot if you want to restrict access
-- CREATE USER slack_bot WITH PASSWORD 'your-secure-password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON slack_thread_contexts TO slack_bot;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO slack_bot;
```

## Slack App Configuration

### 1. Create Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Enter app name and select your workspace

### 2. Enable Socket Mode

1. Navigate to **Settings** → **Socket Mode**
2. Toggle Socket Mode **On**
3. Note: This is required for the bot to work without exposing a public endpoint

### 3. Configure OAuth Scopes

Add the following bot token scopes in **OAuth & Permissions**:

**Required for Assistant features:**
- `assistant:write` - Required for Assistant features

**Required for basic functionality:**
- `chat:write` - Send messages
- `im:history` - Read direct message history
- `im:read` - Read direct messages
- `im:write` - Write to direct messages
- `app_mentions:read` - Respond to @mentions
- `channels:history` - Read channel history (if needed)
- `users:read` - Read user information

### 4. Configure Event Subscriptions

Subscribe to the following bot events in **Event Subscriptions**:

**Assistant events:**
- `assistant_thread_started` - When user opens Assistant
- `assistant_thread_context_changed` - When user switches context

**Message events:**
- `message.im` - Direct messages to the bot
- `app_mention` - @mentions in channels (for backwards compatibility)

### 5. Install App to Workspace

1. Go to **Install App** → **Install to Workspace**
2. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
3. Go to **Basic Information** → **App-Level Tokens** → **Generate Token and Scopes**
4. Create a token with `connections:write` scope (starts with `xapp-`)

## Environment Configuration

Create a `.env` file in the project root:

```bash
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
SLACK_APP_TOKEN=xapp-1-your-app-token-here
SLACK_SOCKET_MODE=true
SLACK_PORT=3000

# DigitalOcean AI Configuration
DIGITALOCEAN_API_KEY=your-digitalocean-api-key-here
DIGITALOCEAN_AGENT_ENDPOINT=https://your-agent-endpoint.digitalocean.com
DIGITALOCEAN_MODEL=gpt-4o-mini
DIGITALOCEAN_MAX_TOKENS=1000
DIGITALOCEAN_TEMPERATURE=0.7

# PostgreSQL Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
# Or individual variables:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=arcai_slack
# DB_USER=slack_bot
# DB_PASSWORD=your-secure-password

# Debug mode (optional)
DEBUG=1
```

## Development

### Build and Run

```bash
# Build the TypeScript code
pnpm run build

# Start the bot
pnpm run start

# Or build and run in one command
pnpm run start:dev
```

### Development with Auto-rebuild

```bash
# Watch for changes and rebuild automatically
pnpm run dev
```

### Type Checking

```bash
# Check types without building
pnpm run type-check
```

## Features

### Thread Context Management
- Stores conversation context in PostgreSQL
- Maintains channel, team, and enterprise information
- Automatically saves context on thread start and changes

### Streaming Responses
- Responses stream character-by-character to the user
- Provides real-time feedback with "thinking..." status

### Feedback Buttons
- Users can rate responses with 👍/👎 buttons
- Feedback is logged for quality analysis

### Slash Commands

The bot supports the following slash commands:

- `/agent list` - List all available agents
- `/agent select <name>` - Change the agent for the current channel (admin only)
- `/agent info` - Show information about the current channel's agent
- `/agent help` - Display help for agent commands

### App Home (Home tab)
- In your Slack app settings → App Home → enable the Home tab
- Ensure the bot token has `chat:write` scope (required for `views.publish`)
- When a user opens the app's Home, the bot publishes a Home view with a button to open a modal

## Testing

```bash
# Run tests
pnpm dlx vitest run
```

## Troubleshooting

### Common Issues

**"Bot not responding"**
1. Check that the bot is running: `ps aux | grep "node.*slack"`
2. Verify environment variables are set correctly
3. Check Slack app configuration and scopes
4. Restart the bot: `pnpm run start`

**"Database connection failed"**
1. Verify DATABASE_URL is correct
2. Check that the PostgreSQL database is running
3. Ensure the database user has proper permissions
4. Test connection: `psql $DATABASE_URL`

**"Agent service not properly initialized"**
1. Verify DigitalOcean API credentials
2. Check that DIGITALOCEAN_AGENT_ENDPOINT is accessible
3. Ensure the model name is supported (gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo)

**"AssistantThreadContextStore not found"**
1. Ensure @slack/bolt is version 4.0.0 or higher
2. Run `pnpm install` to update dependencies

### Debug Mode

Enable debug mode with `DEBUG=1` to see detailed logs:
- Thread context saves/loads
- Assistant middleware execution
- AI response generation
- Feedback events

```bash
DEBUG=1 pnpm run start
```

### Health Check

The bot includes a health check endpoint (when not in socket mode):
```bash
curl http://localhost:3000/health
```

## Architecture

```
User Message → Assistant Middleware → Thread Context Store (PostgreSQL)
                      ↓
            Retrieve Thread History
                      ↓
              AI Agent Service (DigitalOcean)
                      ↓
          Stream Response → Feedback Buttons
```

## Project Context

This Slack bot is part of the ArcAI ecosystem. For more information:

- [Production Deployment Guide](PRODUCTION.md) - Docker deployment
- [Main Project README](../README.md) - Overview of the complete ArcAI system
- [Shared Library](../lib/README.md) - Common functionality and agent services

## Security Considerations

- Store sensitive credentials in environment variables, not in code
- Use database users with limited privileges
- Enable SSL/TLS for database connections in production
- Regularly rotate API keys and tokens
- Monitor bot logs for unusual activity