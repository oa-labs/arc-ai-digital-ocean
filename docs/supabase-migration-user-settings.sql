-- Migration: Add User Settings Table
-- Description: Adds user_settings table for storing user-specific configuration like DigitalOcean Personal Access Tokens
-- Date: 2025-01-27
-- 
-- This migration enables users to store their DigitalOcean Personal Access Token securely
-- with Row Level Security (RLS) ensuring users can only access their own settings.

-- ============================================================================
-- Table: user_settings
-- Description: Stores user-specific settings and configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digitalocean_token TEXT, -- Encrypted DigitalOcean Personal Access Token
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own settings
CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own settings
CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify table was created
SELECT 
  'user_settings table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'user_settings'
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
WHERE schemaname = 'public' AND tablename = 'user_settings';

-- Verify policies exist
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ All policies created'
    ELSE '❌ Missing policies'
  END as status
FROM pg_policies
WHERE tablename = 'user_settings';

