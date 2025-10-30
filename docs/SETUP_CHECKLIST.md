# Multi-Agent System Setup Checklist

Use this checklist to deploy the multi-agent system to production.

## Prerequisites

- [ ] Supabase project created
- [ ] S3-compatible storage (DigitalOcean Spaces or AWS S3)
- [ ] Slack app with bot token
- [ ] Access to environment variables

## Step 1: Database Setup

- [ ] Copy SQL migration from `docs/supabase-migration-multi-agent-system.sql`
- [ ] Run migration in Supabase SQL Editor or via psql:
  ```bash
  psql $SUPABASE_DATABASE_URL < docs/supabase-migration-multi-agent-system.sql
  ```
- [ ] Verify tables created:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name LIKE 'agent%';
  ```
  Should return: `agents`, `slack_channel_agents`, `agent_usage_logs`, `agent_change_log`, `agent_managers`

## Step 2: Environment Variables

Add these to your `.env` file or deployment environment:

- [ ] `SUPABASE_URL=https://your-project.supabase.co`
- [ ] `SUPABASE_ANON_KEY=your-anon-key`
- [ ] `S3_ENDPOINT=https://nyc3.digitaloceanspaces.com` (or your S3 endpoint)
- [ ] `S3_REGION=nyc3` (or your region)
- [ ] `S3_ACCESS_KEY_ID=your-access-key`
- [ ] `S3_SECRET_ACCESS_KEY=your-secret-key`

For each agent you create, add its API key:
- [ ] `AGENT_<NAME>_<PROVIDER>_KEY=your-api-key`
  - Example: `AGENT_SAFETY_OPENAI_KEY=sk-...`
  - Example: `AGENT_SUPPORT_DIGITALOCEAN_KEY=do-...`

## Step 3: Create Agents

Run SQL to create your first agent:

- [ ] Create OpenAI agent:
  ```sql
  INSERT INTO agents (name, description, provider, api_key_env_var, model, s3_bucket, system_prompt)
  VALUES (
    'safety-bot',
    'AI agent specialized in workplace safety',
    'openai',
    'AGENT_SAFETY_OPENAI_KEY',
    'gpt-4',
    'my-rag-bucket',
    'You are a workplace safety expert. Provide clear, actionable safety guidance.'
  );
  ```

- [ ] OR create DigitalOcean agent:
  ```sql
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

- [ ] Verify agents created:
  ```sql
  SELECT id, name, provider, is_active FROM agents;
  ```

## Step 4: Upload RAG Documents (Optional)

If using RAG, upload documents to S3:

- [ ] Create S3 bucket (if not exists):
  ```bash
  aws s3 mb s3://my-rag-bucket
  ```

- [ ] Upload documents:
  ```bash
  aws s3 cp safety-manual.txt s3://my-rag-bucket/safety-docs/
  aws s3 cp safety-procedures.txt s3://my-rag-bucket/safety-docs/
  ```

- [ ] Verify documents uploaded:
  ```bash
  aws s3 ls s3://my-rag-bucket/safety-docs/
  ```

## Step 5: Configure Slack App

- [ ] Go to https://api.slack.com/apps
- [ ] Select your Slack app
- [ ] Add OAuth scopes (OAuth & Permissions):
  - [ ] `users:read` - To check user permissions
  - [ ] `channels:read` - To check channel info
  - [ ] `groups:read` - To check private channel info
  - [ ] `conversations.info` - To get channel details
- [ ] Reinstall app to workspace (if scopes were added)
- [ ] Create slash command (Slash Commands):
  - [ ] Command: `/agent`
  - [ ] Request URL: `https://your-bot-url/slack/events`
  - [ ] Short Description: `Manage AI agents for this channel`
  - [ ] Usage Hint: `list | select <name> | info | help`
- [ ] Save changes

## Step 6: Deploy Code

- [ ] Build shared library:
  ```bash
  cd lib
  npm run build
  ```

- [ ] Build Slack bot:
  ```bash
  cd bots/slack
  npm run build
  ```

- [ ] Restart Slack bot:
  ```bash
  npm start
  ```

- [ ] Check logs for successful initialization:
  ```
  [INFO] Agent service initialized successfully
  [SlackAgentManager] Agent manager initialized
  [SlackAgentManager] RAG service initialized
  ```

## Step 7: Test in Slack

- [ ] Test `/agent help` command
  - Should show help message to all users
  
- [ ] Test `/agent list` command
  - Should show list of available agents
  
- [ ] Test `/agent info` command
  - Should show "No agent configured" or current agent
  
- [ ] Test `/agent select <name>` command (as admin)
  - Should change channel's agent
  - Should show success message
  
- [ ] Test `/agent select <name>` command (as non-admin)
  - Should show permission denied message
  
- [ ] Send a message to the channel
  - Should get response from selected agent
  - Should use RAG context if documents uploaded

## Step 8: Verify Database Logs

- [ ] Check agent usage logs:
  ```sql
  SELECT * FROM agent_usage_logs ORDER BY created_at DESC LIMIT 10;
  ```

- [ ] Check agent change logs:
  ```sql
  SELECT * FROM agent_change_log ORDER BY changed_at DESC LIMIT 10;
  ```

## Step 9: Monitor Performance

- [ ] Set up monitoring for:
  - [ ] Agent response times
  - [ ] Token usage per agent
  - [ ] Error rates
  - [ ] Cache hit rates

- [ ] Create dashboard with queries from `docs/MULTI_AGENT_SYSTEM.md`

## Troubleshooting

If something doesn't work, check:

- [ ] Environment variables are set correctly
  ```bash
  echo $SUPABASE_URL
  echo $SUPABASE_ANON_KEY
  ```

- [ ] Database tables exist
  ```sql
  \dt agent*
  ```

- [ ] Agents are active
  ```sql
  SELECT name, is_active FROM agents;
  ```

- [ ] API keys are set
  ```bash
  echo $AGENT_SAFETY_OPENAI_KEY
  ```

- [ ] Slack app has required scopes
  - Check OAuth & Permissions page

- [ ] Slack bot logs for errors
  ```bash
  tail -f logs/slack-bot.log
  ```

## Rollback Plan

If you need to rollback:

- [ ] Remove environment variables:
  ```bash
  unset SUPABASE_URL
  unset SUPABASE_ANON_KEY
  ```

- [ ] Restart bot - it will fall back to default agent

- [ ] Optionally drop tables:
  ```sql
  DROP TABLE IF EXISTS agent_usage_logs;
  DROP TABLE IF EXISTS agent_change_log;
  DROP TABLE IF EXISTS agent_managers;
  DROP TABLE IF EXISTS slack_channel_agents;
  DROP TABLE IF EXISTS agents;
  ```

## Success Criteria

✅ Multi-agent system is working when:
- [ ] `/agent` commands work in Slack
- [ ] Admins can change agents for channels
- [ ] Non-admins see permission denied
- [ ] Messages use channel-specific agents
- [ ] RAG context is included in responses (if configured)
- [ ] Usage is logged to Supabase
- [ ] No errors in bot logs

## Next Steps

After successful deployment:
- [ ] Create more agents for different use cases
- [ ] Upload more RAG documents
- [ ] Set up monitoring dashboard
- [ ] Train team on using `/agent` commands
- [ ] Consider implementing web UI (Phase 4)
- [ ] Consider adding automated tests (Phase 5)

## Support

For issues or questions:
- Check `docs/MULTI_AGENT_SYSTEM.md` for detailed documentation
- Check `docs/IMPLEMENTATION_SUMMARY.md` for implementation details
- Review Slack bot logs for error messages
- Contact development team

