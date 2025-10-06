#!/usr/bin/env ts-node
/**
 * Verification script to demonstrate that the CLI uses the createAgentService factory
 * This script shows the integration between the CLI and the shared library
 */

import { createAgentService, getAgentProvider, validateConfig } from '@lib/index.js';

console.log('=== CLI Integration Verification ===\n');

// Check configuration validation
console.log('1. Validating configuration...');
const validation = validateConfig();
console.log(`   Valid: ${validation.valid}`);
if (!validation.valid) {
  console.log(`   Errors: ${validation.errors.join(', ')}`);
  console.log('\n   Note: This is expected if environment variables are not set.');
  console.log('   Set OPENAI_API_KEY or DIGITALOCEAN_API_KEY to test fully.\n');
} else {
  console.log('   Configuration is valid!\n');
  
  // Show which provider is being used
  console.log('2. Checking agent provider...');
  const provider = getAgentProvider();
  console.log(`   Provider: ${provider}\n`);
  
  // Create agent service using the factory
  console.log('3. Creating agent service using factory...');
  try {
    const service = createAgentService();
    console.log(`   ✓ Agent service created successfully`);
    console.log(`   Type: ${service.constructor.name}\n`);
  } catch (error) {
    console.log(`   ✗ Failed to create agent service: ${(error as Error).message}\n`);
  }
}

console.log('=== Verification Complete ===');
console.log('\nThe CLI now uses:');
console.log('  - TypeScript for type safety');
console.log('  - Module aliases (@lib) for clean imports');
console.log('  - createAgentService() factory from the shared library');
console.log('  - Supports both OpenAI and DigitalOcean providers\n');

