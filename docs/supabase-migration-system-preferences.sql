-- Migration: Add System Preferences Table
-- Description: Adds system_preferences table for storing system-wide configuration like default AI model
-- Date: 2025-01-28
-- 
-- This migration enables storing system-wide preferences that can only be updated by owners
-- but can be read by all authenticated users.

-- ============================================================================
-- Table: system_preferences
-- Description: Stores system-wide preferences and configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preference_key TEXT NOT NULL UNIQUE,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_system_preferences_key ON system_preferences(preference_key);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE system_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read system preferences
CREATE POLICY "Authenticated users can read system preferences"
  ON system_preferences FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only owners can insert system preferences
CREATE POLICY "Owners can insert system preferences"
  ON system_preferences FOR INSERT
  TO authenticated
  WITH CHECK (is_owner());

-- Policy: Only owners can update system preferences
CREATE POLICY "Owners can update system preferences"
  ON system_preferences FOR UPDATE
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

-- Policy: Only owners can delete system preferences
CREATE POLICY "Owners can delete system preferences"
  ON system_preferences FOR DELETE
  TO authenticated
  USING (is_owner());

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger to automatically update updated_at timestamp and updated_by user
CREATE OR REPLACE FUNCTION update_system_preferences_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_preferences_metadata
  BEFORE UPDATE ON system_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_system_preferences_metadata();

-- ============================================================================
-- Default Data
-- ============================================================================

-- Insert default AI model preference (optional - can be set via UI)
-- INSERT INTO system_preferences (preference_key, preference_value)
-- VALUES ('default_ai_model', '{"model_id": "meta-llama/llama-3.1-70b-instruct"}'::jsonb)
-- ON CONFLICT (preference_key) DO NOTHING;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify table was created
SELECT 
  'system_preferences table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'system_preferences'
    ) THEN '✅ Table exists'
    ELSE '❌ Table missing'
  END as status;

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS enabled'
    ELSE '❌ RLS disabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'system_preferences';

-- Verify policies exist
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ All policies created'
    ELSE '❌ Missing policies'
  END as status
FROM pg_policies
WHERE tablename = 'system_preferences';
