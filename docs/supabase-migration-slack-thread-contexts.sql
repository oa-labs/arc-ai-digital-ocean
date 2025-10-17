-- Migration: Create slack_thread_contexts table for storing Slack Assistant thread context

CREATE TABLE IF NOT EXISTS slack_thread_contexts (
  thread_ts TEXT PRIMARY KEY,
  context JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_slack_thread_contexts_created_at ON slack_thread_contexts(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_slack_thread_contexts_updated_at
    BEFORE UPDATE ON slack_thread_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE slack_thread_contexts IS 'Stores Slack Assistant thread context for maintaining conversation state';
COMMENT ON COLUMN slack_thread_contexts.thread_ts IS 'Slack thread timestamp (unique identifier)';
COMMENT ON COLUMN slack_thread_contexts.context IS 'JSON object containing channel_id, team_id, enterprise_id, etc.';
