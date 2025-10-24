-- Migration: Add initial agent manager
-- Description: Adds the first user as an agent manager so they can create/manage agents
-- Date: 2025-01-24

-- Step 1: Check current authenticated users
-- Run this first to find your user_id:
-- SELECT id, email FROM auth.users;

-- Step 2: Insert your user as an agent manager
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from Step 1
-- Replace 'YOUR_EMAIL_HERE' with your email for reference

INSERT INTO agent_manager_permissions (user_id, slack_user_id, team_id, granted_by, is_active)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with your actual user_id from auth.users
  'admin',              -- Slack user ID (can be any identifier for now)
  'default',            -- Team ID (can be any identifier for now)
  'system',             -- Granted by system/initial setup
  true
)
ON CONFLICT (user_id, team_id) DO UPDATE
SET is_active = true;

-- Verification
SELECT 
  amp.id,
  amp.user_id,
  u.email,
  amp.slack_user_id,
  amp.team_id,
  amp.is_active,
  amp.granted_at
FROM agent_manager_permissions amp
JOIN auth.users u ON u.id = amp.user_id;

