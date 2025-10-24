-- Script: Set User as Owner
-- Description: Standalone script to set a specific user account as an "owner"
-- Date: 2025-01-24
--
-- This script should be run manually by a database administrator to assign
-- the owner role to a specific user account. The owner role cannot be removed
-- or changed by other admins or owners through the application UI.
--
-- INSTRUCTIONS:
-- 1. First, find the user ID by running the query in Step 1
-- 2. Replace 'user@example.com' with the actual email address
-- 3. Copy the user ID from the results
-- 4. Run the UPDATE statement in Step 2 with the correct user ID or email
-- 5. Verify the change with the query in Step 3
-- 6. The user must sign out and sign back in for the role to take effect

-- ============================================================================
-- Step 1: Find the User ID
-- ============================================================================

-- Run this query to find the user you want to make an owner:
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'role' as current_role
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- Step 2: Set User as Owner (Choose ONE method)
-- ============================================================================

-- Method A: Set owner by email address
-- Replace 'user@example.com' with the actual email address
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"owner"'
)
WHERE email = 'user@example.com';

-- Method B: Set owner by user ID
-- Replace 'USER_ID_HERE' with the actual user ID from Step 1
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"owner"'
-- )
-- WHERE id = 'USER_ID_HERE';

-- ============================================================================
-- Step 3: Verify the Change
-- ============================================================================

-- Run this query to verify the owner was set correctly:
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'owner';

-- ============================================================================
-- Additional Operations
-- ============================================================================

-- To set a user as admin (instead of owner):
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"admin"'
-- )
-- WHERE email = 'user@example.com';

-- To remove admin/owner role (set back to regular user):
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"regular"'
-- )
-- WHERE email = 'user@example.com';

-- To remove the role field entirely (user will default to 'regular'):
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data - 'role'
-- WHERE email = 'user@example.com';

-- ============================================================================
-- Important Notes
-- ============================================================================

-- 1. The user MUST sign out and sign back in for the role change to take effect
--    The role is stored in the JWT token which is only refreshed on login
--
-- 2. Owner role is protected in the application:
--    - Owners cannot be demoted by other admins or owners through the UI
--    - Owner accounts are read-only in the user management interface
--    - Only database administrators can change owner roles via SQL
--
-- 3. Valid role values:
--    - 'regular' - Default role, no admin privileges
--    - 'admin' - Can manage users and agents, can promote/demote other admins
--    - 'owner' - Has all admin privileges, protected from modification
--
-- 4. Multiple owners are allowed:
--    You can have multiple owner accounts for redundancy
--
-- 5. Security:
--    - This script should only be run by database administrators
--    - Keep a record of who has owner access
--    - Regularly audit owner and admin accounts

