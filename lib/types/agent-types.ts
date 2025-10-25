// Type definitions for multi-agent system

/**
 * Agent record from the database
 */
export interface AgentRecord {
  id: string;
  name: string;
  description?: string;
  provider: 'digitalocean';
  api_key_env_var: string;
  temperature?: number;
  max_tokens?: number;
  endpoint?: string;
  s3_bucket: string;
  s3_prefix?: string;
  system_prompt?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
  is_default?: boolean; // Whether this is the default fallback agent
}

/**
 * Slack channel to agent mapping
 */
export interface SlackChannelAgent {
  id: string;
  channel_id: string;
  agent_id: string;
  team_id?: string;
  channel_name?: string;
  activated_at: string;
  activated_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Agent with channel mapping information
 */
export interface AgentWithChannel extends AgentRecord {
  channel_mapping?: SlackChannelAgent;
}

/**
 * Agent usage log entry
 */
export interface AgentUsageLog {
  id: string;
  agent_id: string;
  channel_id: string;
  user_id: string;
  message_ts?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  response_time_ms?: number;
  error_message?: string;
  created_at: string;
}

/**
 * Agent change log entry
 */
export interface AgentChangeLog {
  id: string;
  channel_id: string;
  previous_agent_id?: string;
  new_agent_id?: string;
  changed_by: string;
  changed_at: string;
  team_id?: string;
  channel_name?: string;
}

/**
 * Agent manager permission record (custom permission)
 */
export interface AgentManagerPermission {
  id: string;
  user_id: string;
  slack_user_id: string;
  team_id: string;
  granted_by?: string;
  granted_at: string;
  is_active: boolean;
}

/**
 * Result of agent selection operation
 */
export interface AgentSelectionResult {
  success: boolean;
  agent?: AgentRecord;
  error?: string;
}

/**
 * RAG document from S3
 */
export interface RAGDocument {
  key: string;
  content: string;
  metadata?: {
    lastModified?: Date;
    size?: number;
    contentType?: string;
  };
}

/**
 * RAG search result
 */
export interface RAGSearchResult {
  document: RAGDocument;
  relevanceScore: number;
  excerpt?: string;
}

/**
 * Agent runtime configuration (built from AgentRecord)
 */
export interface AgentRuntimeConfig {
  agentRecord: AgentRecord;
  apiKey: string; // Loaded from environment
  ragDocuments?: RAGDocument[];
}

