#!/usr/bin/env node

/**
 * Simple test script to verify DigitalOcean API connection
 * Run with: node test-connection.js
 */

import { config } from 'dotenv';
import { createAgentService } from './lib/services/agent-service-factory.js';

config();

async function testConnection() {
  console.log('🔧 Testing DigitalOcean API connection...\n');

  // Check environment
  if (!process.env.DIGITALOCEAN_API_KEY) {
    console.error('❌ DIGITALOCEAN_API_KEY is required. Please set it in your .env file');
    process.exit(1);
  }

  const agentService = createAgentService();

  const model = process.env.DIGITALOCEAN_MODEL || 'gpt-4o-mini';

  console.log(`🤖 Model: ${model}`);
  console.log(`🔑 API Key: ${process.env.DIGITALOCEAN_API_KEY.substring(0, 10)}...`);
  console.log('');

  try {
    console.log('🚀 Sending test request...');

    const response = await agentService.sendMessage('Say "Connection successful!" if you can read this message.');
    console.log('✅ Response received:');
    console.log(response.content);
    console.log('\n🎉 Connection test successful!');

  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    
    if (error.status) {
      console.error(`Status: ${error.status}`);
    }
    
    process.exit(1);
  }
}

testConnection();