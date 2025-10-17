// Shared TypeScript interfaces and types

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AgentResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  timestamp: Date;
}

export interface AgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  organization?: string;
  endpoint?: string;
}

export interface AgentError {
  message: string;
  code?: string;
  status?: number;
  timestamp: Date;
}

export interface SlackThreadContext {
  channel_id: string;
  team_id?: string;
  enterprise_id?: string;
  is_enterprise_install?: boolean;
  thread_ts?: string;
  context?: Record<string, any>;
}

export interface SlackThreadContextRecord {
  thread_ts: string;
  context: SlackThreadContext;
  created_at?: string;
  updated_at?: string;
}