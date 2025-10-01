import { AgentMessage, AgentResponse, AgentConfig } from '../types/index.js';
export declare class AgentService {
    private client;
    private config;
    constructor(config: AgentConfig);
    /**
     * Send a message to the AI agent and get a response
     */
    sendMessage(message: string, context?: AgentMessage[]): Promise<AgentResponse>;
    /**
     * Send a simple message without context
     */
    sendSimpleMessage(message: string): Promise<AgentResponse>;
    /**
     * Send a system message followed by a user message
     */
    sendSystemMessage(systemPrompt: string, userMessage: string): Promise<AgentResponse>;
    /**
     * Get available models
     */
    getModels(): Promise<string[]>;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<AgentConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): AgentConfig;
}
//# sourceMappingURL=agent-service.d.ts.map