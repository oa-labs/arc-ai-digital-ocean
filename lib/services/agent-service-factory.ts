import { OpenAiAgentService } from './openai-agent-service.js';
import { DigitalOceanAgentService } from './digitalocean-agent-service.js';
import { getConfig } from '../config/index.js';

export type AgentService = OpenAiAgentService | DigitalOceanAgentService;

/**
 * Factory function to create the appropriate agent service based on configuration
 */
export function createAgentService(): AgentService {
  const config = getConfig();

  switch (config.agentProvider) {
    case 'openai':
      return new OpenAiAgentService(config.agent);
    case 'digitalocean':
      return new DigitalOceanAgentService(config.agent);
    default:
      throw new Error(`Unsupported agent provider: ${config.agentProvider}`);
  }
}

/**
 * Get the current agent provider
 */
export function getAgentProvider(): string {
  return getConfig().agentProvider;
}

/**
 * Check if the current provider is OpenAI
 */
export function isOpenAIProvider(): boolean {
  return getConfig().agentProvider === 'openai';
}

/**
 * Check if the current provider is DigitalOcean
 */
export function isDigitalOceanProvider(): boolean {
  return getConfig().agentProvider === 'digitalocean';
}