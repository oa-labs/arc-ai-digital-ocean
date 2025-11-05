import { DigitalOceanAgentService } from './digitalocean-agent-service.js';
import { getConfig } from '../config/index.js';

export type AgentService = DigitalOceanAgentService;

/**
 * Factory function to create the DigitalOcean agent service
 */
export function createAgentService(): AgentService {
  const config = getConfig();
  return new DigitalOceanAgentService(config.agent);
}

/**
 * Get the current agent provider (always returns 'digitalocean')
 */
export function getAgentProvider(): string {
  return 'digitalocean';
}

/**
 * Check if the current provider is DigitalOcean (always returns true)
 */
export function isDigitalOceanProvider(): boolean {
  return true;
}