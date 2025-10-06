// Simple test script to validate the configurable agent service setup

console.log('Testing configuration system...');

// Import first
import { getConfig, validateConfig, createAgentService, reloadConfig } from './lib/dist/src/index.js';

// Test with OpenAI provider (default)
process.env.AGENT_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = 'test-key';
reloadConfig();

try {
  const config = getConfig();
  console.log('Config loaded:', {
    agentProvider: config.agentProvider,
    hasApiKey: !!config.agent.apiKey,
    hasEndpoint: !!config.agent.endpoint
  });

  const validation = validateConfig();
  console.log('Config validation:', validation);

  if (validation.valid) {
    console.log('Creating OpenAI agent service...');
    const service = createAgentService();
    console.log('Service created successfully:', service.constructor.name);
  }
} catch (error) {
  console.error('OpenAI test failed:', error.message);
}

// Test with DigitalOcean provider
process.env.AGENT_PROVIDER = 'digitalocean';
process.env.DIGITALOCEAN_API_KEY = 'test-key';
process.env.DIGITALOCEAN_AGENT_ENDPOINT = 'https://test-endpoint.com';
reloadConfig();

try {
  const config = getConfig();
  console.log('DigitalOcean config loaded:', {
    agentProvider: config.agentProvider,
    hasApiKey: !!config.agent.apiKey,
    hasEndpoint: !!config.agent.endpoint
  });

  const validation = validateConfig();
  console.log('DigitalOcean config validation:', validation);

  if (validation.valid) {
    console.log('Creating DigitalOcean agent service...');
    const service = createAgentService();
    console.log('Service created successfully:', service.constructor.name);
  }
} catch (error) {
  console.error('DigitalOcean test failed:', error.message);
}

console.log('Configuration test completed.');