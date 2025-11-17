-- Thread context storage for Slack conversations
CREATE TABLE IF NOT EXISTS slack_thread_contexts (
  thread_ts TEXT PRIMARY KEY,
  context JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slack_thread_contexts_updated_at ON slack_thread_contexts(updated_at);
CREATE INDEX IF NOT EXISTS idx_slack_thread_contexts_thread_ts ON slack_thread_contexts(thread_ts);

-- Optional: Create a user for the bot if you want to restrict access
-- CREATE USER slack_bot WITH PASSWORD 'your-secure-password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON slack_thread_contexts TO slack_bot;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO slack_bot;