-- Migration: Add Public Read Access for Slack Bot
-- Description: Adds RLS policies to allow anonymous (anon) read access to agents and channel mappings
-- Date: 2025-01-24
-- 
-- This migration is an ALTERNATIVE to using the service role key.
-- It allows the Slack bot to use SUPABASE_ANON_KEY while still maintaining security.
-- 
-- Security Notes:
-- - Read access is granted to anonymous users for agents and channel mappings
-- - Write operations still require admin/owner authentication
-- - This is safe because agent configurations are not sensitive data
-- - API keys are stored as environment variable names, not actual keys

-- ============================================================================
-- Add Public Read Policies for Agents Table
-- ============================================================================

-- Allow anonymous users to read active agents
CREATE POLICY IF NOT EXISTS "Allow public read access to active agents"
ON agents
FOR SELECT
TO anon
USING (is_active = true);

-- Note: The "Allow public read access to default agent" policy already exists
-- from the default agent migration, but we keep it for clarity

-- ============================================================================
-- Add Public Read Policies for Slack Channel Agents Table
-- ============================================================================

-- Allow anonymous users to read channel agent mappings
CREATE POLICY IF NOT EXISTS "Allow public read access to channel agents"
ON slack_channel_agents
FOR SELECT
TO anon
USING (true);

-- ============================================================================
-- Notes
-- ============================================================================

-- These policies allow the Slack bot to:
-- 1. List all active agents (/agent list command)
-- 2. Get agent configuration for a channel
-- 3. Get the default agent
--
-- Write operations (creating/updating agents and mappings) still require
-- authenticated users with admin or owner roles.
--
-- If you prefer to use the service role key instead, you can skip this migration
-- and set SUPABASE_SERVICE_ROLE_KEY in your environment variables.

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Public Read Access Migration Complete';
  RAISE NOTICE 'Anonymous users can now read agents and channel mappings';
  RAISE NOTICE 'Write operations still require admin/owner authentication';
END $$;

