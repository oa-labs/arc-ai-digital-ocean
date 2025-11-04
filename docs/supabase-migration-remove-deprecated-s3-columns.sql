-- Migration: Remove deprecated s3_bucket and s3_prefix columns from agents table
-- Date: 2025-11-04
-- Description: These columns are deprecated in favor of the agent_s3_sources table
--              which supports multiple S3 buckets per agent.
--
-- Prerequisites:
-- - supabase-migration-multi-bucket-support.sql must have been run
-- - All agents should have been migrated to use agent_s3_sources table
--
-- This migration:
-- 1. Drops the deprecated s3_bucket column
-- 2. Drops the deprecated s3_prefix column

-- Drop deprecated columns
ALTER TABLE agents 
  DROP COLUMN IF EXISTS s3_bucket,
  DROP COLUMN IF EXISTS s3_prefix;

-- Verify the columns are gone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'agents' 
    AND column_name IN ('s3_bucket', 's3_prefix')
  ) THEN
    RAISE EXCEPTION 'Failed to drop s3_bucket and/or s3_prefix columns';
  ELSE
    RAISE NOTICE 'Successfully removed deprecated s3_bucket and s3_prefix columns from agents table';
  END IF;
END $$;
