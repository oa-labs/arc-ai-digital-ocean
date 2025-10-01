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
            const messages = [
                ...(context || []).map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
                { role: 'user', content: message },
            ];
            const completion = await this.client.chat.completions.create({
                model: this.config.model || 'gpt-3.5-turbo',
                messages,
                temperature: this.config.temperature || 0.7,
                max_tokens: this.config.maxTokens || 1000,
            });
            const choice = completion.choices[0];
            if (!choice.message?.content) {
                throw new Error('No response content received from OpenAI');
            }
            return {
                content: choice.message.content,
                usage: {
                    promptTokens: completion.usage?.prompt_tokens || 0,
                    completionTokens: completion.usage?.completion_tokens || 0,
                    totalTokens: completion.usage?.total_tokens || 0,
                },
                model: completion.model || this.config.model || 'gpt-3.5-turbo',
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
        const context = [
            { role: 'system', content: systemPrompt, timestamp: new Date() },
        ];
        return this.sendMessage(userMessage, context);
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
