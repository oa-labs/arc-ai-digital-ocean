import { AgentConfig } from '../types/index.js';
import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

export interface SharedConfig {
  agent: AgentConfig;
  agentProvider: 'openai' | 'digitalocean';
  environment: 'development' | 'production' | 'test';
  debug: boolean;
}

/**
 * Find the project root by searching for .git directory
 */
function findProjectRoot(startDir: string): string | null {
  let currentDir = startDir;
  const root = resolve('/');

  while (currentDir !== root) {
    const gitPath = join(currentDir, '.git');
    if (existsSync(gitPath)) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }

  return null;
}

/**
 * Load environment variables hierarchically from .env files
 * Searches from current working directory up to the project root (.git marker)
 * Closer .env files take precedence over parent ones
 *
 * @returns Object with path to loaded .env file (or null if none found)
 */
export function loadEnvHierarchical(): { envPath: string | null; provider: string | null } {
  const cwd = process.cwd();
  const projectRoot = findProjectRoot(cwd);

  if (!projectRoot) {
    console.log('[loadEnvHierarchical] No .git directory found, loading from CWD only');
  }

  // Collect all .env files from CWD up to project root
  const envFiles: string[] = [];
  let currentDir = cwd;
  const root = projectRoot || cwd;

  while (true) {
    const envPath = join(currentDir, '.env');
    if (existsSync(envPath)) {
      envFiles.push(envPath);
    }

    if (currentDir === root) {
      break;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root
      break;
    }
    currentDir = parentDir;
  }

  if (envFiles.length === 0) {
    console.log('[loadEnvHierarchical] No .env files found in hierarchy');
    return { envPath: null, provider: null };
  }

  // Load in reverse order (parent first, then children override)
  // This ensures closer files take precedence
  for (let i = envFiles.length - 1; i >= 0; i--) {
    const envPath = envFiles[i];
    dotenvConfig({ path: envPath, override: false });
  }

  // The first (closest) .env file is the primary one
  const primaryEnvPath = envFiles[0];
  const provider = process.env.AGENT_PROVIDER || 'openai';

  console.log(`[loadEnvHierarchical] Loaded .env from: ${primaryEnvPath}`);
  if (envFiles.length > 1) {
    console.log(`[loadEnvHierarchical] Also loaded ${envFiles.length - 1} parent .env file(s)`);
  }
  console.log(`[loadEnvHierarchical] Agent provider: ${provider}`);

  return { envPath: primaryEnvPath, provider };
}

/**
 * Build agent configuration based on the provider
 */
function buildAgentConfig(provider: SharedConfig['agentProvider']): AgentConfig {
  switch (provider) {
    case 'openai':
      return {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-5-nano-2025-08-07',
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
        organization: process.env.OPENAI_ORGANIZATION,
      };
    case 'digitalocean':
      return {
        apiKey: process.env.DIGITALOCEAN_API_KEY || '',
        model: process.env.DIGITALOCEAN_MODEL || 'gpt-5-nano-2025-08-07',
        temperature: parseFloat(process.env.DIGITALOCEAN_TEMPERATURE || '0.3'),
        maxTokens: parseInt(process.env.DIGITALOCEAN_MAX_TOKENS || '1000'),
        endpoint: process.env.DIGITALOCEAN_AGENT_ENDPOINT,
      };
    default:
      throw new Error(`Unsupported agent provider: ${provider}`);
  }
}

/**
 * Default configuration values
 */
const defaultConfig: SharedConfig = {
  agent: buildAgentConfig((process.env.AGENT_PROVIDER as SharedConfig['agentProvider']) || 'openai'),
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
  const provider = (process.env.AGENT_PROVIDER as SharedConfig['agentProvider']) || 'openai';
  currentConfig = {
    agent: buildAgentConfig(provider),
    agentProvider: provider,
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