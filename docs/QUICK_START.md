# Quick Start Guide - Multi-Agent System

Get your multi-agent Slack bot up and running in 5 steps!

## 🚀 Quick Setup (5 Minutes)

### Step 1: Database Migration (2 min)

**Option A: Supabase Dashboard** (Easiest)
1. Go to https://supabase.com/dashboard
2. Open your project → SQL Editor → New query
3. Copy/paste contents of `docs/supabase-migration-multi-agent-system.sql`
4. Click **Run**

**Option B: Using Script**
```bash
./scripts/setup-database.sh
```

**Verify:**
```sql
-- Run in SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'agent%';
```

### Step 2: Environment Variables (1 min)

**Root `.env` (for Slack bot):**
```bash
cp .env.example .env
```

Edit `.env`:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# S3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret

# Agent API Keys
OPENAI_API_KEY=sk-...
```

**Web `.env` (for web UI):**
```bash
cp web/.env.example web/.env
```

Edit `web/.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_S3_ACCESS_KEY_ID=your-key
VITE_S3_SECRET_ACCESS_KEY=your-secret
```

### Step 3: Create Your First Agent (1 min)

**Option A: Using SQL**
```sql
-- First, create the agent
INSERT INTO agents (
  name, description, provider, api_key_env_var, 
  model, system_prompt
) VALUES (
  'default-agent',
  'Default AI assistant',
  'openai',
  'OPENAI_API_KEY',
  'gpt-4',
  'You are a helpful AI assistant.'
);

-- Then, configure its S3 source
INSERT INTO agent_s3_sources (
  agent_id, bucket, prefix
) VALUES (
  (SELECT id FROM agents WHERE name = 'default-agent'),
  'your-rag-bucket',
  ''
);
```

**Option B: Using Web UI** (after Step 4)
1. Go to http://localhost:5173/agents
2. Click "Add Agent" (requires DigitalOcean token configured)
3. Select an agent from your DigitalOcean deployment
4. Configure S3 source settings
5. Click "Import Agent"

### Step 4: Start the Web UI (30 sec)

```bash
cd web
pnpm install
pnpm dev
```

Open http://localhost:5173

### Step 5: Configure Slack Bot (30 sec)

**Add Slash Command:**
1. Go to https://api.slack.com/apps
2. Select your app → Slash Commands → Create New Command
3. Command: `/agent`
4. Request URL: `https://your-bot-url/slack/events`
5. Description: "Manage AI agents"
6. Usage hint: `list | select <name> | info | help`

**Add OAuth Scopes** (if not already added):
- `chat:write`
- `channels:read`
- `groups:read`
- `users:read`
- `commands`

**Start the bot:**
```bash
cd bots/slack
pnpm install
pnpm dev
```

## ✅ Verification

### Test Database
```sql
-- Should return your agent
SELECT name, provider, model FROM agents;
```

### Test Web UI
1. Open http://localhost:5173
2. Sign in with Supabase auth
3. Navigate to Agents page
4. You should see your agent

### Test Slack Bot
In any Slack channel:
```
/agent list
```

Should show available agents.

```
/agent select default-agent
```

Should assign the agent to the channel (admin only).

```
@YourBot hello
```

Should get a response from the agent.

## 📊 Usage

### Add Agents

**Via Web UI:**
1. Go to Agents page
2. Click "Add Agent" (requires DigitalOcean token)
3. Select an agent from your DigitalOcean deployment
4. Configure:
   - S3 Sources
   - API Key Env Var (e.g., "AGENT_SAFETY_KEY")
   - Temperature and max tokens
   - System prompt
5. Click "Import Agent"

**Via SQL:**
```sql
-- Create the agent
INSERT INTO agents (name, provider, api_key_env_var, model)
VALUES ('safety-bot', 'openai', 'AGENT_SAFETY_KEY', 'gpt-4');

-- Add S3 source
INSERT INTO agent_s3_sources (agent_id, bucket, prefix)
VALUES (
  (SELECT id FROM agents WHERE name = 'safety-bot'),
  'safety-docs',
  ''
);
```

### Assign Agents to Channels

In Slack (admin only):
```
/agent select safety-bot
```

### Upload RAG Documents

**Via Web UI:**
1. Go to Files page (Dashboard)
2. Click "Upload Files"
3. Select files
4. Upload to agent's configured S3 sources

**Via S3 CLI:**
```bash
aws s3 cp document.txt s3://your-bucket/safety-docs/ \
  --endpoint-url https://nyc3.digitaloceanspaces.com
```

### Monitor Usage

**Via Web UI:**
1. Go to Agents page → Analytics tab
2. View metrics:
   - Total messages
   - Token usage
   - Response times
   - Errors
3. Select time range (24h, 7d, 30d, 90d)

**Via SQL:**
```sql
-- Usage by agent
SELECT 
  a.name,
  COUNT(*) as messages,
  SUM(l.total_tokens) as tokens,
  AVG(l.response_time_ms) as avg_response_time
FROM agent_usage_logs l
JOIN agents a ON l.agent_id = a.id
WHERE l.created_at > NOW() - INTERVAL '7 days'
GROUP BY a.name;
```

## 🔧 Common Tasks

### Add a New Agent

1. Create agent in web UI or SQL
2. Add API key to environment:
   ```bash
   # In .env
   AGENT_NEWBOT_KEY=your-api-key
   ```
3. Restart Slack bot
4. Assign to channel: `/agent select newbot`

### Change Agent for a Channel

```
/agent select different-agent
```

### View Current Agent

```
/agent info
```

### View All Agents

```
/agent list
```

### Deactivate an Agent

**Via Web UI:**
1. Go to Agents page
2. Click "Delete" on agent card

**Via SQL:**
```sql
UPDATE agents SET is_active = false WHERE name = 'old-agent';
```

### View Agent Change History

**Via SQL:**
```sql
SELECT 
  channel_id,
  old_agent_name,
  new_agent_name,
  changed_by,
  changed_at
FROM agent_change_log
WHERE channel_id = 'C1234567890'
ORDER BY changed_at DESC;
```

## 🐛 Troubleshooting

### Bot not responding
1. Check bot is running: `pnpm dev` in `bots/slack`
2. Check environment variables in `.env`
3. Check Slack app has correct scopes
4. Check bot is invited to channel

### Agent not found
1. Check agent exists: `SELECT * FROM agents WHERE name = 'agent-name';`
2. Check agent is active: `is_active = true`
3. Restart Slack bot to reload cache

### Permission denied in Slack
1. Only workspace admins and channel creators can change agents
2. Check user permissions: `/agent info` (anyone can view)

### Web UI not loading agents
1. Check Supabase URL and key in `web/.env`
2. Check RLS policies allow read access
3. Check browser console for errors

### RAG documents not loading
1. Check S3 credentials in `.env`
2. Check agent_s3_sources table for agent's S3 configuration
3. Check documents exist in S3
4. Check file extensions (.txt, .md, .pdf)

## 📚 Documentation

- **Full Architecture**: `docs/MULTI_AGENT_SYSTEM.md`
- **Database Migration**: `docs/DATABASE_MIGRATION_GUIDE.md`
- **Web UI Guide**: `docs/WEB_UI_GUIDE.md`
- **Implementation Details**: `docs/IMPLEMENTATION_SUMMARY.md`
- **Setup Checklist**: `docs/SETUP_CHECKLIST.md`

## 🎯 Next Steps

1. ✅ Database migrated
2. ✅ Environment configured
3. ✅ First agent created
4. ✅ Web UI running
5. ✅ Slack bot configured

**Now you can:**
- Create multiple agents for different purposes
- Upload RAG documents for each agent
- Assign agents to different Slack channels
- Monitor usage and performance
- Scale to hundreds of agents and channels

## 💡 Tips

- **Agent Naming**: Use descriptive names (e.g., "safety-bot", "support-bot")
- **S3 Organization**: Use agent_s3_sources table to configure multiple S3 sources per agent with different prefixes
- **API Keys**: Use separate keys for each agent for better tracking
- **Testing**: Create a test channel to try new agents before production
- **Monitoring**: Check Analytics tab regularly for usage patterns
- **Backups**: Export agent configs periodically

## 🆘 Support

If you need help:
1. Check the troubleshooting section above
2. Review the full documentation in `docs/`
3. Check Supabase logs in dashboard
4. Check Slack bot logs in terminal
5. Check browser console for web UI errors

Happy building! 🚀

