-- Migration: Add S3 credential environment variable fields to agents table
-- Description: Adds optional fields to store environment variable names for S3 credentials
-- Date: 2025-01-21

-- Add s3_access_key_id_env_var column to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS s3_access_key_id_env_var TEXT;

-- Add s3_secret_key_env_var column to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS s3_secret_key_env_var TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN agents.s3_access_key_id_env_var IS 'Environment variable name containing S3 access key ID for this agent''s bucket. If null, default credentials are used.';
COMMENT ON COLUMN agents.s3_secret_key_env_var IS 'Environment variable name containing S3 secret access key for this agent''s bucket. If null, default credentials are used.';

