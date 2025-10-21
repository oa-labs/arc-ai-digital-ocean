-- Migration: Add Default Agent Support
-- Description: Adds is_default flag to agents table to support setting a default agent
-- Author: ArcAI Ocean Team
-- Date: 2025-01-21

-- Add is_default column to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Add index for quick lookup of default agent
CREATE INDEX IF NOT EXISTS idx_agents_is_default ON agents(is_default) WHERE is_default = true;

-- Add comment
COMMENT ON COLUMN agents.is_default IS 'Whether this agent is the default fallback when no channel-specific agent is configured';

-- Create a function to ensure only one default agent exists
CREATE OR REPLACE FUNCTION ensure_single_default_agent()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this agent as default, unset all other defaults
  IF NEW.is_default = true THEN
    UPDATE agents 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default agent
DROP TRIGGER IF EXISTS trigger_ensure_single_default_agent ON agents;
CREATE TRIGGER trigger_ensure_single_default_agent
  BEFORE INSERT OR UPDATE ON agents
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_agent();

-- Add RLS policy for reading default agent
CREATE POLICY IF NOT EXISTS "Allow public read access to default agent"
ON agents
FOR SELECT
TO anon
USING (is_default = true);

