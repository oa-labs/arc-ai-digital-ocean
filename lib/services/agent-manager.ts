import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AgentRecord,
  SlackChannelAgent,
  AgentSelectionResult,
  AgentChangeLog,
  AgentRuntimeConfig,
  RAGDocument,
} from '../types/agent-types.js';
import { AgentConfig } from '../types/index.js';
import { RAGService } from './rag-service.js';
import { DigitalOceanAgentService } from './digitalocean-agent-service.js';

export type AgentServiceInstance = DigitalOceanAgentService;

/**
 * Manages AI agents: retrieval, instantiation, caching, and channel mapping
 */
export class AgentManager {
  private supabase: SupabaseClient;
  private ragService: RAGService | null;
  private agentCache: Map<string, AgentServiceInstance> = new Map();
  private ragDocumentCache: Map<string, RAGDocument[]> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string, ragService: RAGService | null = null) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.ragService = ragService;
  }

  /**
   * Get all active agents
   */
  async listAgents(): Promise<AgentRecord[]> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[AgentManager] Failed to list agents:', error);
      throw new Error(`Failed to list agents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<AgentRecord | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[AgentManager] Failed to get agent:', error);
      throw new Error(`Failed to get agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Get agent by name
   */
  async getAgentByName(name: string): Promise<AgentRecord | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[AgentManager] Failed to get agent by name:', error);
      throw new Error(`Failed to get agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Get the default agent
   */
  async getDefaultAgent(): Promise<AgentRecord | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No default agent configured
      }
      console.error('[AgentManager] Failed to get default agent:', error);
      throw new Error(`Failed to get default agent: ${error.message}`);
    }

    return data;
  }

  /**
   * Get the active agent for a Slack channel
   */
  async getChannelAgent(channelId: string): Promise<AgentRecord | null> {
    const { data, error } = await this.supabase
      .from('slack_channel_agents')
      .select('agent_id')
      .eq('channel_id', channelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No agent assigned
      }
      console.error('[AgentManager] Failed to get channel agent:', error);
      throw new Error(`Failed to get channel agent: ${error.message}`);
    }

    if (!data?.agent_id) {
      return null;
    }

    return this.getAgentById(data.agent_id);
  }

  /**
   * Select an agent for a channel
   */
  async selectAgentForChannel(
    channelId: string,
    agentName: string,
    userId: string,
    channelName?: string,
    teamId?: string
  ): Promise<AgentSelectionResult> {
    try {
      // Find the agent by name
      const agent = await this.getAgentByName(agentName);

      if (!agent) {
        return {
          success: false,
          error: `Agent "${agentName}" not found. Use /agent list to see available agents.`,
        };
      }

      // Get current agent for change log
      const currentMapping = await this.supabase
        .from('slack_channel_agents')
        .select('agent_id')
        .eq('channel_id', channelId)
        .single();

      const previousAgentId = currentMapping.data?.agent_id;

      // Upsert the channel-agent mapping
      const { error: upsertError } = await this.supabase
        .from('slack_channel_agents')
        .upsert(
          {
            channel_id: channelId,
            agent_id: agent.id,
            team_id: teamId,
            channel_name: channelName,
            activated_by: userId,
            activated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'channel_id' }
        );

      if (upsertError) {
        console.error('[AgentManager] Failed to update channel agent:', upsertError);
        return {
          success: false,
          error: 'Failed to update channel agent. Please try again.',
        };
      }

      // Log the change
      await this.logAgentChange(channelId, previousAgentId, agent.id, userId, teamId, channelName);

      // Clear cache for this channel
      this.clearChannelCache(channelId);

      console.log(`[AgentManager] Channel ${channelId} now uses agent ${agent.name}`);

      return {
        success: true,
        agent,
      };
    } catch (error) {
      console.error('[AgentManager] Error selecting agent:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Create an agent service instance for a channel
   */
  async createAgentServiceForChannel(channelId: string): Promise<AgentServiceInstance | null> {
    // Check cache first
    const cached = this.agentCache.get(channelId);
    if (cached) {
      return cached;
    }

    // Get agent configuration
    const agent = await this.getChannelAgent(channelId);
    if (!agent) {
      console.warn(`[AgentManager] No agent configured for channel ${channelId}`);
      return null;
    }

    // Create agent service
    const agentService = await this.createAgentService(agent);

    // Cache it
    if (agentService) {
      this.agentCache.set(channelId, agentService);
    }

    return agentService;
  }

  /**
   * Get the default agent service (fallback when no channel agent is configured)
   */
  async getDefaultAgentService(): Promise<AgentServiceInstance | null> {
    // Check cache first
    const cached = this.agentCache.get('__default__');
    if (cached) {
      return cached;
    }

    // Get default agent configuration
    const agent = await this.getDefaultAgent();
    if (!agent) {
      console.warn('[AgentManager] No default agent configured');
      return null;
    }

    // Create agent service
    const agentService = await this.createAgentService(agent);

    // Cache it
    if (agentService) {
      this.agentCache.set('__default__', agentService);
    }

    return agentService;
  }

  /**
   * Create an agent service instance from an agent record
   */
  async createAgentService(agent: AgentRecord): Promise<AgentServiceInstance | null> {
    try {
      // Load API key from environment
      const apiKey = process.env[agent.api_key_env_var];

      if (!apiKey) {
        console.error(`[AgentManager] API key not found in environment: ${agent.api_key_env_var}`);
        return null;
      }

      // Build agent config
      const config: AgentConfig = {
        apiKey,
        temperature: agent.temperature,
        maxTokens: agent.max_tokens,
        endpoint: agent.endpoint,
      };

      // Create DigitalOcean agent service
      if (!config.endpoint) {
        console.error('[AgentManager] DigitalOcean provider requires endpoint');
        return null;
      }
      const service = new DigitalOceanAgentService(config);

      console.log(`[AgentManager] Created ${agent.provider} agent service for ${agent.name}`);
      return service;
    } catch (error) {
      console.error('[AgentManager] Failed to create agent service:', error);
      return null;
    }
  }

  /**
   * Load RAG documents for an agent from S3
   * NOTE: This is only used for OpenAI agents to build context client-side.
   * For DigitalOcean agents, the S3 bucket is configured on their backend and RAG is handled automatically.
   */
  async loadRAGDocuments(agent: AgentRecord): Promise<RAGDocument[]> {
    if (!this.ragService) {
      console.warn('[AgentManager] RAG service not available');
      return [];
    }

    // Use s3_bucket for backward compatibility, fallback to empty if not present
    const s3Bucket = agent.s3_bucket;
    if (!s3Bucket) {
      console.warn('[AgentManager] No S3 bucket configured for agent:', agent.id);
      return [];
    }

    // Check cache first
    const cacheKey = s3Bucket;
    const cached = this.ragDocumentCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const documents = await this.ragService.loadDocuments(s3Bucket);

      // Cache the documents
      this.ragDocumentCache.set(cacheKey, documents);

      return documents;
    } catch (error) {
      console.error('[AgentManager] Failed to load RAG documents:', error);
      return [];
    }
  }

  /**
   * Log an agent change
   */
  private async logAgentChange(
    channelId: string,
    previousAgentId: string | undefined,
    newAgentId: string,
    changedBy: string,
    teamId?: string,
    channelName?: string
  ): Promise<void> {
    try {
      const changeLog: Partial<AgentChangeLog> = {
        channel_id: channelId,
        previous_agent_id: previousAgentId,
        new_agent_id: newAgentId,
        changed_by: changedBy,
        changed_at: new Date().toISOString(),
        team_id: teamId,
        channel_name: channelName,
      };

      const { error } = await this.supabase.from('agent_change_log').insert(changeLog);

      if (error) {
        console.error('[AgentManager] Failed to log agent change:', error);
      }
    } catch (error) {
      console.error('[AgentManager] Error logging agent change:', error);
    }
  }

  /**
   * Clear cache for a specific channel
   */
  clearChannelCache(channelId: string): void {
    this.agentCache.delete(channelId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.agentCache.clear();
    this.ragDocumentCache.clear();
  }
}

/**
 * Create an AgentManager instance from environment variables
 */
export function createAgentManager(ragService: RAGService | null = null): AgentManager | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  // Use service role key for backend services to bypass RLS
  // Fall back to anon key for backward compatibility
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[AgentManager] Supabase credentials not configured. Agent manager will be disabled.');
    return null;
  }

  return new AgentManager(supabaseUrl, supabaseKey, ragService);
}

