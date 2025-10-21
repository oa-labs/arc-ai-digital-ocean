-- Migration: Remove per-agent S3 credentials
-- Date: 2025-10-21
-- Description: Remove s3_access_key_id_env_var and s3_secret_key_env_var columns
--              from agents table since we now use global S3 credentials
--              (VITE_S3_ACCESS_KEY_ID and VITE_S3_SECRET_ACCESS_KEY)

-- Drop the columns
ALTER TABLE agents DROP COLUMN IF EXISTS s3_access_key_id_env_var;
ALTER TABLE agents DROP COLUMN IF EXISTS s3_secret_key_env_var;

-- Optional: Add a comment to document the change
COMMENT ON TABLE agents IS 'Agent configurations. S3 credentials are now configured globally via environment variables.';

-- Rollback (if needed):
-- ALTER TABLE agents ADD COLUMN s3_access_key_id_env_var TEXT;
-- ALTER TABLE agents ADD COLUMN s3_secret_key_env_var TEXT;
