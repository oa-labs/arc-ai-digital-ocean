import OpenAI from 'openai';
import { AgentMessage, AgentResponse, AgentConfig, AgentError } from '../types/index.js';

export class OpenAiAgentService {
  private client: OpenAI;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    });
  }

  /**
   * Send a message to the AI agent and get a response
   */
  async sendMessage(message: string, context?: AgentMessage[]): Promise<AgentResponse> {
    try {
      // Build input array from context and message using EasyInputMessage format
      const input = [
        ...(context || []).map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system' | 'developer',
          content: msg.content,
        })),
        { role: 'user' as const, content: message },
      ];

      // Use the Responses API instead of Chat Completions
      const response = await this.client.responses.create({
        model: this.config.model || 'gpt-3.5-turbo',
        input,
        temperature: this.config.temperature || 0.7,
        max_output_tokens: this.config.maxTokens || 1000,
        store: false, // Disable storage for privacy/compliance
      });

      // Extract content from response using output_text helper
      if (!response.output_text) {
        throw new Error('No response content received from OpenAI');
      }

      return {
        content: response.output_text,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        },
        model: response.model || this.config.model || 'gpt-3.5-turbo',
        timestamp: new Date(),
      };
    } catch (error: any) {
      const agentError: AgentError = {
        message: error.message || 'Unknown error occurred',
        code: error.code,
        status: error.status,
        timestamp: new Date(),
      };
      throw agentError;
    }
  }

  /**
   * Send a simple message without context
   */
  async sendSimpleMessage(message: string): Promise<AgentResponse> {
    return this.sendMessage(message);
  }

  /**
   * Send a system message followed by a user message
   */
  async sendSystemMessage(systemPrompt: string, userMessage: string): Promise<AgentResponse> {
    try {
      // Use the Responses API with instructions parameter for cleaner semantics
      const response = await this.client.responses.create({
        model: this.config.model || 'gpt-3.5-turbo',
        instructions: systemPrompt,
        input: userMessage,
        temperature: this.config.temperature || 0.7,
        max_output_tokens: this.config.maxTokens || 1000,
        store: false, // Disable storage for privacy/compliance
      });

      // Extract content from response using output_text helper
      if (!response.output_text) {
        throw new Error('No response content received from OpenAI');
      }

      return {
        content: response.output_text,
        usage: {
          promptTokens: response.usage?.input_tokens || 0,
          completionTokens: response.usage?.output_tokens || 0,
          totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        },
        model: response.model || this.config.model || 'gpt-3.5-turbo',
        timestamp: new Date(),
      };
    } catch (error: any) {
      const agentError: AgentError = {
        message: error.message || 'Unknown error occurred',
        code: error.code,
        status: error.status,
        timestamp: new Date(),
      };
      throw agentError;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list();
      return models.data.map(model => model.id);
    } catch (error: any) {
      const agentError: AgentError = {
        message: error.message || 'Failed to fetch models',
        code: error.code,
        status: error.status,
        timestamp: new Date(),
      };
      throw agentError;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organization,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }
}