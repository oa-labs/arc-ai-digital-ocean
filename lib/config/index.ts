import { AgentConfig } from '../types/index.js';

export interface SharedConfig {
  agent: AgentConfig;
  agentProvider: 'openai' | 'digitalocean';
  environment: 'development' | 'production' | 'test';
  debug: boolean;
}

/**
 * Default configuration values
 */
const defaultConfig: SharedConfig = {
  agent: {
    apiKey: process.env.OPENAI_API_KEY || process.env.DIGITALOCEAN_API_KEY || '',
    model: process.env.OPENAI_MODEL || process.env.DIGITALOCEAN_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || process.env.DIGITALOCEAN_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || process.env.DIGITALOCEAN_MAX_TOKENS || '1000'),
    organization: process.env.OPENAI_ORGANIZATION,
    endpoint: process.env.DIGITALOCEAN_AGENT_ENDPOINT,
  },
  agentProvider: (process.env.AGENT_PROVIDER as SharedConfig['agentProvider']) || 'openai',
  environment: (process.env.NODE_ENV as SharedConfig['environment']) || 'development',
  debug: process.env.DEBUG === '1',
};

/**
 * Current configuration instance
 */
let currentConfig: SharedConfig = { ...defaultConfig };

/**
 * Get the current configuration
 */
export function getConfig(): SharedConfig {
  return { ...currentConfig };
}

/**
 * Update the configuration
 */
export function updateConfig(updates: Partial<SharedConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...updates,
    agent: {
      ...currentConfig.agent,
      ...updates.agent,
    },
  };
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Reload configuration from environment variables
 */
export function reloadConfig(): void {
  currentConfig = {
    agent: {
      apiKey: process.env.OPENAI_API_KEY || process.env.DIGITALOCEAN_API_KEY || '',
      model: process.env.OPENAI_MODEL || process.env.DIGITALOCEAN_MODEL || 'gpt-3.5-turbo',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || process.env.DIGITALOCEAN_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || process.env.DIGITALOCEAN_MAX_TOKENS || '1000'),
      organization: process.env.OPENAI_ORGANIZATION,
      endpoint: process.env.DIGITALOCEAN_AGENT_ENDPOINT,
    },
    agentProvider: (process.env.AGENT_PROVIDER as SharedConfig['agentProvider']) || 'openai',
    environment: (process.env.NODE_ENV as SharedConfig['environment']) || 'development',
    debug: process.env.DEBUG === '1',
  };
}

/**
 * Validate that required configuration is present
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!currentConfig.agent.apiKey) {
    if (currentConfig.agentProvider === 'digitalocean') {
      errors.push('DIGITALOCEAN_API_KEY is required when using DigitalOcean provider');
    } else {
      errors.push('OPENAI_API_KEY is required when using OpenAI provider');
    }
  }

  if (currentConfig.agentProvider === 'digitalocean' && !currentConfig.agent.endpoint) {
    errors.push('DIGITALOCEAN_AGENT_ENDPOINT is required when using DigitalOcean provider');
  }

  if (!['openai', 'digitalocean'].includes(currentConfig.agentProvider)) {
    errors.push('AGENT_PROVIDER must be either "openai" or "digitalocean"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}