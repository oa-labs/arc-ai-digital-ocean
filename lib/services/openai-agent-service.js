import OpenAI from 'openai';
export class OpenAiAgentService {
    client;
    config;
    constructor(config) {
        this.config = config;
        this.client = new OpenAI({
            apiKey: config.apiKey,
            organization: config.organization,
        });
    }
    /**
     * Send a message to the AI agent and get a response
     */
    async sendMessage(message, context) {
        try {
            // Build input array from context and message
            const input = [
                ...(context || []).map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
                { role: 'user', content: message },
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
        }
        catch (error) {
            const agentError = {
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
    async sendSimpleMessage(message) {
        return this.sendMessage(message);
    }
    /**
     * Send a system message followed by a user message
     */
    async sendSystemMessage(systemPrompt, userMessage) {
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
        }
        catch (error) {
            const agentError = {
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
    async getModels() {
        try {
            const models = await this.client.models.list();
            return models.data.map(model => model.id);
        }
        catch (error) {
            const agentError = {
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
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.client = new OpenAI({
            apiKey: this.config.apiKey,
            organization: this.config.organization,
        });
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
