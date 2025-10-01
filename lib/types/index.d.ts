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
}
export interface AgentError {
    message: string;
    code?: string;
    status?: number;
    timestamp: Date;
}
//# sourceMappingURL=index.d.ts.map