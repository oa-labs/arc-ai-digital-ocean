# Database Migration Guide

This guide will walk you through setting up the database migration for the multi-agent system.

## Prerequisites

- Supabase project (existing or new)
- Supabase project URL and anon key
- Database access (via Supabase Dashboard or SQL Editor)

## Option 1: Using Supabase Dashboard (Recommended)

This is the easiest method and doesn't require any CLI tools.

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query** button

### Step 2: Run the Migration

1. Open the migration file: `docs/supabase-migration-multi-agent-system.sql`
2. Copy the entire contents of the file
3. Paste it into the SQL Editor
4. Click **Run** button (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Verify the Migration

After running the migration, verify that the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('agents', 'slack_channel_agents', 'agent_usage_logs', 'agent_change_log', 'agent_managers');
```

You should see all 5 tables listed.

### Step 4: Verify RLS Policies

Check that Row Level Security policies were created:

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('agents', 'slack_channel_agents', 'agent_usage_logs', 'agent_change_log', 'agent_managers');
```

You should see multiple policies for each table.

## Option 2: Using Supabase CLI

If you prefer using the CLI, follow these steps.

### Step 1: Install Supabase CLI

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**npm (all platforms):**
```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### Step 3: Link to Your Project

```bash
supabase link --project-ref your-project-ref
```

You can find your project ref in the Supabase dashboard URL:
`https://supabase.com/dashboard/project/[your-project-ref]`

### Step 4: Run the Migration

```bash
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

Or create a migration file:

```bash
# Create a new migration
supabase migration new multi_agent_system

# Copy the SQL content to the new migration file
cp docs/supabase-migration-multi-agent-system.sql supabase/migrations/[timestamp]_multi_agent_system.sql

# Apply the migration
supabase db push
```

## Option 3: Using psql (Direct Database Connection)

If you have PostgreSQL client tools installed:

### Step 1: Get Database Connection String

1. Go to Supabase Dashboard → Settings → Database
2. Copy the connection string (Connection pooling or Direct connection)
3. Replace `[YOUR-PASSWORD]` with your database password

### Step 2: Run the Migration

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f docs/supabase-migration-multi-agent-system.sql
```

## Post-Migration Setup

### 1. Create Your First Agent

After the migration is complete, create a test agent:

```sql
INSERT INTO agents (
  name,
  description,
  provider,
  api_key_env_var,
  model,
  s3_bucket,
  s3_prefix,
  system_prompt
) VALUES (
  'default-agent',
  'Default AI agent for general queries',
  'openai',
  'OPENAI_API_KEY',
  'gpt-4',
  'your-rag-bucket',
  'default/',
  'You are a helpful AI assistant.'
);
```

### 2. Verify the Agent

```sql
SELECT id, name, provider, model, s3_bucket, is_active 
FROM agents 
WHERE name = 'default-agent';
```

### 3. Update Environment Variables

Make sure your application has the necessary environment variables set.

**For Slack Bot** (create `.env` in root directory):
```bash
# Copy from example
cp .env.example .env

# Edit .env and add:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# S3 Configuration
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Agent API Keys (add one for each agent)
OPENAI_API_KEY=your-openai-key
AGENT_SAFETY_OPENAI_KEY=your-safety-agent-key
AGENT_SUPPORT_DIGITALOCEAN_KEY=your-support-agent-key
```

**For Web UI** (create `web/.env`):
```bash
# Copy from example
cp web/.env.example web/.env

# Edit web/.env and add:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

VITE_S3_REGION=nyc3
VITE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_S3_BUCKET=your-bucket-name
VITE_S3_ACCESS_KEY_ID=your-access-key
VITE_S3_SECRET_ACCESS_KEY=your-secret-key
```

## Troubleshooting

### Error: "relation already exists"

If you see this error, it means some tables already exist. You have two options:

**Option 1: Drop existing tables** (⚠️ This will delete all data!)
```sql
DROP TABLE IF EXISTS agent_managers CASCADE;
DROP TABLE IF EXISTS agent_change_log CASCADE;
DROP TABLE IF EXISTS agent_usage_logs CASCADE;
DROP TABLE IF EXISTS slack_channel_agents CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
```

Then run the migration again.

**Option 2: Skip existing tables**

The migration uses `CREATE TABLE IF NOT EXISTS`, so it should skip existing tables. If you get errors, you may need to manually create only the missing tables.

### Error: "permission denied"

Make sure you're using the database password, not the anon key, when connecting directly to the database.

### Error: "RLS policy already exists"

If RLS policies already exist, you can drop them first:

```sql
-- Drop all policies for a table
DROP POLICY IF EXISTS "Users can view all active agents" ON agents;
DROP POLICY IF EXISTS "Authenticated users can create agents" ON agents;
-- ... repeat for all policies
```

Or modify the migration to use `CREATE POLICY IF NOT EXISTS` (PostgreSQL 15+).

### Tables created but RLS not working

Make sure RLS is enabled on all tables:

```sql
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_channel_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_managers ENABLE ROW LEVEL SECURITY;
```

## Verification Checklist

After running the migration, verify:

- [ ] All 5 tables created (`agents`, `slack_channel_agents`, `agent_usage_logs`, `agent_change_log`, `agent_managers`)
- [ ] Indexes created on all tables
- [ ] RLS enabled on all tables
- [ ] RLS policies created for all tables
- [ ] Triggers created (`update_updated_at_column`, `log_agent_change`)
- [ ] At least one agent created for testing
- [ ] Environment variables configured
- [ ] Web UI can connect to Supabase
- [ ] Slack bot can connect to Supabase

## Next Steps

After the migration is complete:

1. **Create agents** via the web UI or SQL
2. **Upload RAG documents** to S3 buckets
3. **Configure Slack bot** with `/agent` slash command
4. **Test agent selection** in a Slack channel
5. **Monitor usage** via the Analytics tab in web UI

## Rollback

If you need to rollback the migration:

```sql
-- Drop all tables (⚠️ This will delete all data!)
DROP TABLE IF EXISTS agent_managers CASCADE;
DROP TABLE IF EXISTS agent_change_log CASCADE;
DROP TABLE IF EXISTS agent_usage_logs CASCADE;
DROP TABLE IF EXISTS slack_channel_agents CASCADE;
DROP TABLE IF EXISTS agents CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
DROP TRIGGER IF EXISTS log_slack_channel_agent_changes ON slack_channel_agents;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS log_agent_change();
```

## Support

If you encounter issues:

1. Check the Supabase logs in Dashboard → Logs
2. Verify your database connection string
3. Ensure you have the correct permissions
4. Check the PostgreSQL version (should be 15+)
5. Review the migration file for syntax errors

## Migration File Location

The migration SQL file is located at:
```
docs/supabase-migration-multi-agent-system.sql
```

This file contains:
- 5 table definitions
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamps and logging
- Comments and documentation

