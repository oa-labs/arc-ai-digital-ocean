import { AgentConfig } from '../types/index.js';

export interface SharedConfig {
  agent: AgentConfig;
  environment: 'development' | 'production' | 'test';
  debug: boolean;
}

/**
 * Default configuration values
 */
const defaultConfig: SharedConfig = {
  agent: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
    organization: process.env.OPENAI_ORGANIZATION,
  },
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
 * Validate that required configuration is present
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!currentConfig.agent.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}