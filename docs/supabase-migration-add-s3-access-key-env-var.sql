-- Migration: Add s3_access_key_env_var to agents table
-- Description: Adds an optional field to store the environment variable name for S3 credentials
-- Date: 2025-01-21

-- Add s3_access_key_env_var column to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS s3_access_key_env_var TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN agents.s3_access_key_env_var IS 'Environment variable name containing S3 access credentials for this agent''s bucket. If null, default credentials are used.';

