-- Migration: Multi-Agent System for Slack Bot
-- Description: Creates tables for managing multiple AI agents with per-channel configuration
-- Author: ArcAI Ocean Team
-- Date: 2025-01-21

-- ============================================================================
-- Table: agents
-- Description: Stores AI agent configurations that can be assigned to channels
-- ============================================================================

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'digitalocean')),
  api_key_env_var TEXT NOT NULL, -- Environment variable name (e.g., 'AGENT_SAFETY_OPENAI_KEY')
  model TEXT, -- e.g., 'gpt-4', 'gpt-5-nano-2025-08-07'
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0),
  endpoint TEXT, -- Required for DigitalOcean provider
  organization TEXT, -- Optional for OpenAI
  s3_bucket TEXT NOT NULL, -- S3 bucket name for RAG database
  s3_prefix TEXT, -- Optional prefix/path within bucket (e.g., 'safety-docs/')
  system_prompt TEXT, -- Default system prompt for this agent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for agents table
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_provider ON agents(provider);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at DESC);

-- Comments for agents table
COMMENT ON TABLE agents IS 'AI agent configurations with provider settings and RAG database references';
COMMENT ON COLUMN agents.api_key_env_var IS 'Name of environment variable containing the API key (not the key itself)';
COMMENT ON COLUMN agents.s3_bucket IS 'S3 bucket name where RAG documents are stored';
COMMENT ON COLUMN agents.s3_prefix IS 'Optional path prefix within the S3 bucket';

-- ============================================================================
-- Table: slack_channel_agents
-- Description: Maps Slack channels to their active AI agents
-- ============================================================================

CREATE TABLE IF NOT EXISTS slack_channel_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE, -- Slack channel ID
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  team_id TEXT, -- Slack team/workspace ID
  channel_name TEXT, -- Human-readable channel name
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_by TEXT, -- Slack user ID who activated this agent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for slack_channel_agents table
CREATE INDEX IF NOT EXISTS idx_slack_channel_agents_channel ON slack_channel_agents(channel_id);
CREATE INDEX IF NOT EXISTS idx_slack_channel_agents_agent ON slack_channel_agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_slack_channel_agents_team ON slack_channel_agents(team_id);
CREATE INDEX IF NOT EXISTS idx_slack_channel_agents_activated_at ON slack_channel_agents(activated_at DESC);

-- Comments for slack_channel_agents table
COMMENT ON TABLE slack_channel_agents IS 'Maps Slack channels to their active AI agents';
COMMENT ON COLUMN slack_channel_agents.channel_id IS 'Unique Slack channel identifier';
COMMENT ON COLUMN slack_channel_agents.activated_by IS 'Slack user ID of the person who activated this agent';

-- ============================================================================
-- Table: agent_usage_logs
-- Description: Tracks agent usage for monitoring, analytics, and billing
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL, -- Slack user ID
  message_ts TEXT, -- Slack message timestamp
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  model TEXT,
  response_time_ms INTEGER,
  error_message TEXT, -- Populated if the request failed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agent_usage_logs table
CREATE INDEX IF NOT EXISTS idx_agent_usage_logs_agent ON agent_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_logs_created ON agent_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_usage_logs_channel ON agent_usage_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_logs_user ON agent_usage_logs(user_id);

-- Comments for agent_usage_logs table
COMMENT ON TABLE agent_usage_logs IS 'Logs all agent API calls for monitoring and analytics';
COMMENT ON COLUMN agent_usage_logs.response_time_ms IS 'Time taken to generate response in milliseconds';

-- ============================================================================
-- Table: agent_change_log
-- Description: Audit trail for agent configuration changes per channel
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  previous_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  new_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  changed_by TEXT NOT NULL, -- Slack user ID
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  team_id TEXT,
  channel_name TEXT
);

-- Indexes for agent_change_log table
CREATE INDEX IF NOT EXISTS idx_agent_change_log_channel ON agent_change_log(channel_id);
CREATE INDEX IF NOT EXISTS idx_agent_change_log_changed_at ON agent_change_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_change_log_new_agent ON agent_change_log(new_agent_id);

-- Comments for agent_change_log table
COMMENT ON TABLE agent_change_log IS 'Audit trail of all agent changes per channel';
COMMENT ON COLUMN agent_change_log.changed_by IS 'Slack user ID who made the change';

-- ============================================================================
-- Table: agent_managers (Optional - for custom permission management)
-- Description: Users with permission to manage agents workspace-wide
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  granted_by TEXT, -- Slack user ID who granted this permission
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(slack_user_id, team_id)
);

-- Indexes for agent_managers table
CREATE INDEX IF NOT EXISTS idx_agent_managers_user ON agent_managers(slack_user_id);
CREATE INDEX IF NOT EXISTS idx_agent_managers_team ON agent_managers(team_id);
CREATE INDEX IF NOT EXISTS idx_agent_managers_active ON agent_managers(is_active);

-- Comments for agent_managers table
COMMENT ON TABLE agent_managers IS 'Users with custom permissions to manage agents (beyond Slack admins)';

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for agents table
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for slack_channel_agents table
DROP TRIGGER IF EXISTS update_slack_channel_agents_updated_at ON slack_channel_agents;
CREATE TRIGGER update_slack_channel_agents_updated_at
  BEFORE UPDATE ON slack_channel_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_channel_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_managers ENABLE ROW LEVEL SECURITY;

-- Policies for agents table
-- Allow authenticated users to read active agents
CREATE POLICY "Allow authenticated users to read active agents"
  ON agents FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow authenticated users to read all agents (including inactive)
CREATE POLICY "Allow authenticated users to read all agents"
  ON agents FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert agents
CREATE POLICY "Allow authenticated users to create agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update agents
CREATE POLICY "Allow authenticated users to update agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for slack_channel_agents table
CREATE POLICY "Allow all to read channel agents"
  ON slack_channel_agents FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow all to insert channel agents"
  ON slack_channel_agents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to update channel agents"
  ON slack_channel_agents FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Policies for agent_usage_logs table
CREATE POLICY "Allow all to insert usage logs"
  ON agent_usage_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to read usage logs"
  ON agent_usage_logs FOR SELECT
  TO authenticated
  USING (true);

-- Policies for agent_change_log table
CREATE POLICY "Allow all to insert change logs"
  ON agent_change_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to read change logs"
  ON agent_change_log FOR SELECT
  TO authenticated
  USING (true);

-- Policies for agent_managers table
CREATE POLICY "Allow all to read agent managers"
  ON agent_managers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated to manage agent managers"
  ON agent_managers FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert a default agent (uncomment to use)
-- INSERT INTO agents (name, description, provider, api_key_env_var, model, s3_bucket, system_prompt)
-- VALUES (
--   'default-agent',
--   'Default AI assistant for general queries',
--   'openai',
--   'OPENAI_API_KEY',
--   'gpt-3.5-turbo',
--   'arc-ai-kb',
--   'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.'
-- )
-- ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Multi-Agent System Migration Complete';
  RAISE NOTICE 'Created tables: agents, slack_channel_agents, agent_usage_logs, agent_change_log, agent_managers';
  RAISE NOTICE 'Created indexes and triggers';
  RAISE NOTICE 'Enabled Row Level Security policies';
END $$;

