-- Migration: Multi-Bucket Support for Agents
-- Description: Adds support for multiple S3 buckets per agent via junction table
-- Author: ArcAI Team
-- Date: 2025-01-28

-- ============================================================================
-- Table: agent_s3_sources
-- Description: Junction table mapping agents to their S3 storage sources
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_s3_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'digitalocean' CHECK (provider IN ('digitalocean','aws','gcs')),
  bucket_name TEXT NOT NULL,
  prefix TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, provider, bucket_name, prefix)
);

-- Indexes for agent_s3_sources table
CREATE INDEX IF NOT EXISTS idx_agent_s3_sources_agent ON agent_s3_sources(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_s3_sources_bucket ON agent_s3_sources(bucket_name);

-- Comments for agent_s3_sources table
COMMENT ON TABLE agent_s3_sources IS 'Maps agents to their S3 storage sources (many-to-many)';
COMMENT ON COLUMN agent_s3_sources.agent_id IS 'Reference to the agent that uses this S3 source';
COMMENT ON COLUMN agent_s3_sources.provider IS 'Cloud provider (digitalocean, aws, gcs)';
COMMENT ON COLUMN agent_s3_sources.bucket_name IS 'S3/Spaces bucket name';
COMMENT ON COLUMN agent_s3_sources.prefix IS 'Optional prefix/path within the bucket';

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger for agent_s3_sources table
DROP TRIGGER IF EXISTS update_agent_s3_sources_updated_at ON agent_s3_sources;
CREATE TRIGGER update_agent_s3_sources_updated_at
  BEFORE UPDATE ON agent_s3_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on agent_s3_sources table
ALTER TABLE agent_s3_sources ENABLE ROW LEVEL SECURITY;

-- Policies for agent_s3_sources table
CREATE POLICY "Agent managers can read agent_s3_sources"
  ON agent_s3_sources FOR SELECT
  TO authenticated
  USING (is_active_agent_manager());

CREATE POLICY "Agent managers can insert agent_s3_sources"
  ON agent_s3_sources FOR INSERT
  TO authenticated
  WITH CHECK (is_active_agent_manager());

CREATE POLICY "Agent managers can update agent_s3_sources"
  ON agent_s3_sources FOR UPDATE
  TO authenticated
  USING (is_active_agent_manager())
  WITH CHECK (is_active_agent_manager());

CREATE POLICY "Agent managers can delete agent_s3_sources"
  ON agent_s3_sources FOR DELETE
  TO authenticated
  USING (is_active_agent_manager());

-- ============================================================================
-- Data Migration
-- ============================================================================

-- Backfill existing agents' S3 buckets into the new table
INSERT INTO agent_s3_sources (agent_id, provider, bucket_name, prefix)
SELECT id, provider, s3_bucket, COALESCE(s3_prefix, '')
FROM agents
WHERE s3_bucket IS NOT NULL
ON CONFLICT (agent_id, provider, bucket_name, prefix) DO NOTHING;

-- ============================================================================
-- Deprecation Markers
-- ============================================================================

-- Mark legacy columns as deprecated (will be removed in future migration)
COMMENT ON COLUMN agents.s3_bucket IS 'DEPRECATED: use agent_s3_sources table instead';
COMMENT ON COLUMN agents.s3_prefix IS 'DEPRECATED: use agent_s3_sources table instead';

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Multi-Bucket Support Migration Complete';
  RAISE NOTICE 'Created table: agent_s3_sources';
  RAISE NOTICE 'Backfilled %', (SELECT COUNT(*) FROM agent_s3_sources);
  RAISE NOTICE 'Enabled Row Level Security policies';
END $$;
