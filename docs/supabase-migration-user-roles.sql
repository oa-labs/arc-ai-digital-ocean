-- Migration: Add User Role Management
-- Description: Adds user role support (regular, admin, owner) using Supabase auth.users metadata
-- Date: 2025-01-24
-- 
-- This migration enables role-based access control for the web application.
-- Roles are stored in the user_metadata JSONB column of auth.users table.
--
-- Role Hierarchy:
-- - regular: Default role, no admin privileges
-- - admin: Can manage other users, can promote/demote admins
-- - owner: Has all admin privileges, cannot be modified by other admins or owners

-- ============================================================================
-- Helper Function: Get User Role
-- ============================================================================

-- Function to get the role of the current authenticated user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT,
    'regular'
  );
$$;

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the current authenticated user from their metadata';

-- ============================================================================
-- Helper Function: Check if User is Admin or Owner
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_role() IN ('admin', 'owner');
$$;

COMMENT ON FUNCTION is_admin_or_owner() IS 'Returns true if the current user has admin or owner role';

-- ============================================================================
-- Helper Function: Check if User is Owner
-- ============================================================================

CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT get_user_role() = 'owner';
$$;

COMMENT ON FUNCTION is_owner() IS 'Returns true if the current user has owner role';

-- ============================================================================
-- Update RLS Policies for Agent Management
-- ============================================================================

-- Update existing agent management policies to use the new role system
-- This replaces the agent_manager_permissions table approach with metadata-based roles

-- Drop old policies if they exist and recreate with new role checks
DROP POLICY IF EXISTS "Agent managers can read agents" ON agents;
DROP POLICY IF EXISTS "Agent managers can insert agents" ON agents;
DROP POLICY IF EXISTS "Agent managers can update agents" ON agents;
DROP POLICY IF EXISTS "Agent managers can delete agents" ON agents;

CREATE POLICY "Admins and owners can read agents"
  ON agents FOR SELECT
  TO authenticated
  USING (is_admin_or_owner());

CREATE POLICY "Admins and owners can insert agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "Admins and owners can update agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (is_admin_or_owner())
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "Admins and owners can delete agents"
  ON agents FOR DELETE
  TO authenticated
  USING (is_admin_or_owner());

-- Update slack_channel_agents policies
DROP POLICY IF EXISTS "Agent managers can read channel agents" ON slack_channel_agents;
DROP POLICY IF EXISTS "Agent managers can insert channel agents" ON slack_channel_agents;
DROP POLICY IF EXISTS "Agent managers can update channel agents" ON slack_channel_agents;
DROP POLICY IF EXISTS "Agent managers can delete channel agents" ON slack_channel_agents;

CREATE POLICY "Admins and owners can read channel agents"
  ON slack_channel_agents FOR SELECT
  TO authenticated
  USING (is_admin_or_owner());

CREATE POLICY "Admins and owners can insert channel agents"
  ON slack_channel_agents FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "Admins and owners can update channel agents"
  ON slack_channel_agents FOR UPDATE
  TO authenticated
  USING (is_admin_or_owner())
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "Admins and owners can delete channel agents"
  ON slack_channel_agents FOR DELETE
  TO authenticated
  USING (is_admin_or_owner());

-- Update agent_usage_logs policies
DROP POLICY IF EXISTS "Agent managers can read usage logs" ON agent_usage_logs;

CREATE POLICY "Admins and owners can read usage logs"
  ON agent_usage_logs FOR SELECT
  TO authenticated
  USING (is_admin_or_owner());

-- Update agent_change_log policies
DROP POLICY IF EXISTS "Agent managers can read change log" ON agent_change_log;

CREATE POLICY "Admins and owners can read change log"
  ON agent_change_log FOR SELECT
  TO authenticated
  USING (is_admin_or_owner());

-- ============================================================================
-- Notes
-- ============================================================================

-- To set a user's role, update their user_metadata:
-- 
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"admin"'
-- )
-- WHERE email = 'user@example.com';
--
-- Valid roles: 'regular', 'admin', 'owner'
--
-- The raw_user_meta_data column is automatically synced to the JWT token's
-- user_metadata claim when the user signs in next time.

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'User Role Management Migration Complete';
  RAISE NOTICE 'Created helper functions: get_user_role(), is_admin_or_owner(), is_owner()';
  RAISE NOTICE 'Updated RLS policies to use role-based access control';
  RAISE NOTICE 'Use the set-owner.sql script to assign the first owner';
END $$;

