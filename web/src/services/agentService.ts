import { OpenAiAgentService, getConfig, validateConfig, AgentMessage, AgentResponse } from '@ichat-ocean/shared';

class WebAgentService {
  private agentService: OpenAiAgentService;

  constructor() {
    const config = getConfig();
    const configValidation = validateConfig();

    if (!configValidation.valid) {
      throw new Error(`Configuration validation failed: ${configValidation.errors.join(', ')}`);
    }

    this.agentService = new OpenAiAgentService(config.agent);
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(message: string, context?: AgentMessage[]): Promise<AgentResponse> {
    return this.agentService.sendMessage(message, context);
  }

  /**
   * Send a simple message without context
   */
  async sendSimpleMessage(message: string): Promise<AgentResponse> {
    return this.agentService.sendSimpleMessage(message);
  }

  /**
   * Send a system message with context
   */
  async sendSystemMessage(systemPrompt: string, userMessage: string): Promise<AgentResponse> {
    return this.agentService.sendSystemMessage(systemPrompt, userMessage);
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    return this.agentService.getModels();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: any): void {
    this.agentService.updateConfig(newConfig);
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.agentService.getConfig();
  }
}

// Export singleton instance
export const webAgentService = new WebAgentService();