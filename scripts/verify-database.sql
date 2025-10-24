-- Verification Script for Multi-Agent System Database
-- Run this in Supabase SQL Editor to verify the migration was successful

-- ============================================================================
-- 1. Check if all tables exist
-- ============================================================================

SELECT 
  'Tables Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ All tables exist'
    ELSE '❌ Missing tables'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('agents', 'slack_channel_agents', 'agent_usage_logs', 'agent_change_log', 'agent_managers');

-- ============================================================================
-- 2. List all tables with row counts
-- ============================================================================

SELECT 
  'agents' as table_name,
  COUNT(*) as row_count
FROM agents
UNION ALL
SELECT 
  'slack_channel_agents' as table_name,
  COUNT(*) as row_count
FROM slack_channel_agents
UNION ALL
SELECT 
  'agent_usage_logs' as table_name,
  COUNT(*) as row_count
FROM agent_usage_logs
UNION ALL
SELECT 
  'agent_change_log' as table_name,
  COUNT(*) as row_count
FROM agent_change_log
UNION ALL
SELECT 
  'agent_managers' as table_name,
  COUNT(*) as row_count
FROM agent_managers;

-- ============================================================================
-- 3. Check if RLS is enabled
-- ============================================================================

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS enabled'
    ELSE '❌ RLS disabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('agents', 'slack_channel_agents', 'agent_usage_logs', 'agent_change_log', 'agent_managers')
ORDER BY tablename;

-- ============================================================================
-- 4. Check RLS policies
-- ============================================================================

SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Policies exist'
    ELSE '❌ No policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('agents', 'slack_channel_agents', 'agent_usage_logs', 'agent_change_log', 'agent_managers')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 5. List all RLS policies
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('agents', 'slack_channel_agents', 'agent_usage_logs', 'agent_change_log', 'agent_managers')
ORDER BY tablename, policyname;

-- ============================================================================
-- 6. Check indexes
-- ============================================================================

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('agents', 'slack_channel_agents', 'agent_usage_logs', 'agent_change_log', 'agent_managers')
ORDER BY tablename, indexname;

-- ============================================================================
-- 7. Check triggers
-- ============================================================================

SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('agents', 'slack_channel_agents', 'agent_usage_logs', 'agent_change_log', 'agent_managers')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 8. Check functions
-- ============================================================================

SELECT 
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('update_updated_at_column', 'log_agent_change')
ORDER BY routine_name;

-- ============================================================================
-- 9. Sample data check (if any agents exist)
-- ============================================================================

SELECT 
  id,
  name,
  provider,
  model,
  s3_bucket,
  is_active,
  created_at
FROM agents
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 10. Summary
-- ============================================================================

SELECT 
  '✅ Migration Verification Complete' as status,
  NOW() as verified_at;

-- ============================================================================
-- Expected Results:
-- ============================================================================
-- 
-- 1. Tables Check: Should show "✅ All tables exist" with count = 5
-- 2. Row Counts: All tables should exist (may have 0 rows initially)
-- 3. RLS Enabled: All 5 tables should show "✅ RLS enabled"
-- 4. Policy Count: All tables should have at least 2 policies
-- 5. Policies List: Should show multiple policies per table
-- 6. Indexes: Should show multiple indexes per table
-- 7. Triggers: Should show triggers on agents and slack_channel_agents tables
-- 8. Functions: Should show update_updated_at_column and log_agent_change
-- 9. Sample Data: May be empty if no agents created yet
-- 10. Summary: Shows completion timestamp
-- 
-- ============================================================================

