-- Migration: Rename agent_managers to agent_manager_permissions
-- Description: Updates the is_active_agent_manager() function and RLS policies to use the renamed table
-- Date: 2025-01-24

-- Step 1: Drop existing RLS policies on the old table (if they exist)
DROP POLICY IF EXISTS "Agent managers can read manager assignments" ON agent_managers;
DROP POLICY IF EXISTS "Service role manages manager assignments" ON agent_managers;

-- Step 2: Drop and recreate the is_active_agent_manager() function with the new table name
DROP FUNCTION IF EXISTS is_active_agent_manager();

CREATE OR REPLACE FUNCTION is_active_agent_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM agent_manager_permissions am
    WHERE am.user_id = auth.uid()
      AND am.is_active = true
  );
$$;

COMMENT ON FUNCTION is_active_agent_manager() IS 'Returns true when the current auth user is an active agent manager';

-- Step 3: Recreate RLS policies on the new table name
-- Enable RLS on the renamed table (if not already enabled)
ALTER TABLE agent_manager_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_manager_permissions table
CREATE POLICY "Agent managers can read manager assignments"
  ON agent_manager_permissions FOR SELECT
  TO authenticated
  USING (is_active_agent_manager());

CREATE POLICY "Service role manages manager assignments"
  ON agent_manager_permissions FOR ALL
  TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: agent_managers renamed to agent_manager_permissions';
  RAISE NOTICE 'Updated is_active_agent_manager() function';
  RAISE NOTICE 'Updated RLS policies';
END $$;

