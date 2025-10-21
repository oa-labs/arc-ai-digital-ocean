import {
  AgentManager,
  createAgentManager,
  createRAGService,
  RAGService,
  AgentRecord,
  AgentServiceInstance,
  RAGDocument,
} from '@ichat-ocean/shared';

const debug = (...args: any[]): void => {
  if (process.env.DEBUG === '1') {
    console.log('[DEBUG]', ...args);
  }
};

/**
 * Slack-specific wrapper for AgentManager
 * Handles channel-based agent retrieval and RAG context building
 *
 * RAG Architecture:
 * - OpenAI agents: RAG documents are loaded from S3 and searched client-side
 * - DigitalOcean agents: RAG is configured on the DigitalOcean backend and handled automatically
 *   (S3 buckets are still used to manage the files that DigitalOcean's RAG uses)
 */
export class SlackAgentManager {
  private agentManager: AgentManager | null;
  private ragService: RAGService | null;

  constructor() {
    this.ragService = createRAGService();
    this.agentManager = createAgentManager(this.ragService);

    if (!this.agentManager) {
      console.warn('[SlackAgentManager] Agent manager not initialized - multi-agent features disabled');
    }

    if (!this.ragService) {
      console.warn('[SlackAgentManager] RAG service not initialized - RAG features disabled');
    }
  }

  /**
   * Check if multi-agent system is enabled
   */
  isEnabled(): boolean {
    return this.agentManager !== null;
  }

  /**
   * Get agent service for a channel
   */
  async getAgentServiceForChannel(channelId: string): Promise<AgentServiceInstance | null> {
    if (!this.agentManager) {
      return null;
    }

    try {
      return await this.agentManager.createAgentServiceForChannel(channelId);
    } catch (error) {
      console.error('[SlackAgentManager] Failed to get agent service:', error);
      return null;
    }
  }

  /**
   * Get agent configuration for a channel
   */
  async getAgentForChannel(channelId: string): Promise<AgentRecord | null> {
    if (!this.agentManager) {
      return null;
    }

    try {
      return await this.agentManager.getChannelAgent(channelId);
    } catch (error) {
      console.error('[SlackAgentManager] Failed to get agent:', error);
      return null;
    }
  }

  /**
   * Build RAG context for a message
   * NOTE: Only builds RAG context for OpenAI agents.
   * DigitalOcean agents handle RAG automatically on their backend.
   */
  async buildRAGContext(channelId: string, message: string): Promise<string> {
    if (!this.agentManager || !this.ragService) {
      return '';
    }

    try {
      // Get agent for this channel
      const agent = await this.agentManager.getChannelAgent(channelId);
      if (!agent) {
        debug('No agent configured for channel, skipping RAG');
        return '';
      }

      // Only build RAG context for OpenAI agents
      // DigitalOcean agents have RAG configured on their backend
      if (agent.provider === 'digitalocean') {
        debug(`Agent ${agent.name} is DigitalOcean provider - RAG handled by backend`);
        return '';
      }

      // Load RAG documents for this agent
      const documents = await this.agentManager.loadRAGDocuments(agent);
      if (documents.length === 0) {
        debug('No RAG documents found for agent', agent.name);
        return '';
      }

      debug(`Loaded ${documents.length} RAG documents for agent ${agent.name}`);

      // Search for relevant documents
      const searchResults = await this.ragService.searchDocuments(documents, message, 5);
      if (searchResults.length === 0) {
        debug('No relevant documents found for query');
        return '';
      }

      debug(`Found ${searchResults.length} relevant documents`);

      // Build context string
      const context = this.ragService.buildContext(searchResults, 4000);

      return context;
    } catch (error) {
      console.error('[SlackAgentManager] Failed to build RAG context:', error);
      return '';
    }
  }

  /**
   * Get system prompt for a channel's agent
   */
  async getSystemPrompt(channelId: string): Promise<string> {
    if (!this.agentManager) {
      return 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
    }

    try {
      const agent = await this.agentManager.getChannelAgent(channelId);
      if (!agent || !agent.system_prompt) {
        return 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
      }

      return agent.system_prompt;
    } catch (error) {
      console.error('[SlackAgentManager] Failed to get system prompt:', error);
      return 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
    }
  }

  /**
   * Build enhanced prompt with RAG context
   * NOTE: For OpenAI agents, this loads documents from S3 and builds context.
   * For DigitalOcean agents, this returns the message unchanged since RAG is handled automatically.
   */
  async buildEnhancedPrompt(channelId: string, userMessage: string): Promise<string> {
    const ragContext = await this.buildRAGContext(channelId, userMessage);

    if (!ragContext) {
      return userMessage;
    }

    // Prepend RAG context to the user message (OpenAI agents only)
    return `Context from knowledge base:\n${ragContext}\n\n---\n\nUser question: ${userMessage}`;
  }

  /**
   * Log agent usage
   */
  async logUsage(
    channelId: string,
    userId: string,
    messageTs: string | undefined,
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
    model: string | undefined,
    responseTimeMs: number,
    errorMessage?: string
  ): Promise<void> {
    if (!this.agentManager) {
      return;
    }

    try {
      const agent = await this.agentManager.getChannelAgent(channelId);
      if (!agent) {
        return;
      }

      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.from('agent_usage_logs').insert({
        agent_id: agent.id,
        channel_id: channelId,
        user_id: userId,
        message_ts: messageTs,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        model,
        response_time_ms: responseTimeMs,
        error_message: errorMessage,
      });
    } catch (error) {
      console.error('[SlackAgentManager] Failed to log usage:', error);
    }
  }

  /**
   * Clear cache for a channel (e.g., after agent change)
   */
  clearChannelCache(channelId: string): void {
    if (this.agentManager) {
      this.agentManager.clearChannelCache(channelId);
    }
  }
}

// Export singleton instance
export const slackAgentManager = new SlackAgentManager();

