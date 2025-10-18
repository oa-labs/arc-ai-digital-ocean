import { AgentMessage, AgentResponse, AgentConfig, AgentError } from '../types/index.js';

interface DigitalOceanChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string; role?: string };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
}

interface DigitalOceanModelsResponse {
  models?: Array<{ id?: string; slug?: string; name?: string }>;
  data?: Array<{ id?: string; slug?: string; name?: string }>;
}

export class DigitalOceanAgentService {
  private config: AgentConfig;
  private endpoint: string;

  constructor(config: AgentConfig) {
    if (!config.endpoint) {
      throw new Error('DigitalOcean agent endpoint is required');
    }

    this.config = { ...config };
    this.endpoint = this.normalizeEndpoint(config.endpoint);
  }

  async sendMessage(message: string, context?: AgentMessage[]): Promise<AgentResponse> {
    try {
      const messages = [
        ...(context || []).map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: message },
      ];

      const body: Record<string, unknown> = {
        messages,
        stream: false,
        include_functions_info: false,
        include_retrieval_info: false,
        include_guardrails_info: false,
      };

      if (this.config.model) {
        body.model = this.config.model;
      }

      if (typeof this.config.temperature === 'number') {
        body.temperature = this.config.temperature;
      }

      if (typeof this.config.maxTokens === 'number') {
        body.max_tokens = this.config.maxTokens;
      }

      const response = await fetch(`${this.endpoint}/api/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      let data: DigitalOceanChatCompletionResponse | { error?: { message?: string; code?: string }; message?: string } | undefined;

      try {
        data = await response.json();
      } catch (parseError) {
        if (response.ok) {
          throw parseError;
        }
      }

      if (!response.ok) {
        const errorMessage = (data as any)?.error?.message || (data as any)?.message || 'DigitalOcean agent request failed';
        const agentError: AgentError = {
          message: errorMessage,
          status: response.status,
          code: (data as any)?.error?.code,
          timestamp: new Date(),
          provider: 'digitalocean',
          endpoint: this.endpoint,
          model: this.config.model,
          requestId: response.headers.get('x-request-id') || response.headers.get('request-id') || undefined,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          requestBody: body, // Include sanitized request body for debugging
        };
        throw agentError;
      }

      const completion = (data || {}) as DigitalOceanChatCompletionResponse;
      const choice = completion.choices && completion.choices[0];
      const content = choice?.message?.content;

      if (!content) {
        const agentError: AgentError = {
          message: 'No response content received from DigitalOcean agent',
          status: response.status,
          timestamp: new Date(),
        };
        throw agentError;
      }

      return {
        content,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        model: completion.model || this.config.model,
        timestamp: new Date(),
      };
    } catch (error: any) {
      if (error.timestamp) {
        throw error;
      }

      const agentError: AgentError = {
        message: error.message || 'Unknown error occurred',
        status: error.status,
        code: error.code,
        timestamp: new Date(),
        provider: 'digitalocean',
        endpoint: this.endpoint,
        model: this.config.model,
        stack: error.stack,
      };
      throw agentError;
    }
  }

  async sendSimpleMessage(message: string): Promise<AgentResponse> {
    return this.sendMessage(message);
  }

  async sendSystemMessage(systemPrompt: string, userMessage: string): Promise<AgentResponse> {
    const context: AgentMessage[] = [
      { role: 'system', content: systemPrompt, timestamp: new Date() },
    ];
    return this.sendMessage(userMessage, context);
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await fetch('https://api.digitalocean.com/v2/gen-ai/models', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      let data: DigitalOceanModelsResponse | { models?: unknown; data?: unknown; message?: string } | undefined;

      try {
        data = await response.json();
      } catch (parseError) {
        if (response.ok) {
          throw parseError;
        }
      }

      if (!response.ok) {
        const errorMessage = (data as any)?.message || 'Failed to fetch DigitalOcean models';
        const agentError: AgentError = {
          message: errorMessage,
          status: response.status,
          timestamp: new Date(),
          provider: 'digitalocean',
          endpoint: 'https://api.digitalocean.com/v2/gen-ai/models',
          requestId: response.headers.get('x-request-id') || response.headers.get('request-id') || undefined,
          responseHeaders: Object.fromEntries(response.headers.entries()),
        };
        throw agentError;
      }

      const modelsSource = data || {};
      const models = Array.isArray(modelsSource.models)
        ? modelsSource.models
        : Array.isArray(modelsSource.data)
        ? modelsSource.data
        : [];
      return models
        .map(model => model?.id || model?.slug || model?.name)
        .filter((id): id is string => Boolean(id));
    } catch (error: any) {
      if (error.timestamp) {
        throw error;
      }

      const agentError: AgentError = {
        message: error.message || 'Unknown error occurred while fetching models',
        status: error.status,
        code: error.code,
        timestamp: new Date(),
        provider: 'digitalocean',
        endpoint: 'https://api.digitalocean.com/v2/gen-ai/models',
        stack: error.stack,
      };
      throw agentError;
    }
  }

  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.endpoint) {
      this.endpoint = this.normalizeEndpoint(this.config.endpoint);
    }
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  private normalizeEndpoint(endpoint: string): string {
    return endpoint.trim().replace(/\/$/, '');
  }
}
