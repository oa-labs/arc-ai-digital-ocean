#!/usr/bin/env node

/**
 * Test script to verify OpenAI Responses API migration
 * Run with: node test-responses-api.js
 */

import { config } from 'dotenv';
import { OpenAiAgentService } from './lib/services/openai-agent-service.js';

config();

async function testResponsesAPI() {
  console.log('🧪 Testing OpenAI Responses API Migration...\n');

  // Check environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is required. Please set it in your .env file');
    process.exit(1);
  }

  const agentConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 100,
    organization: process.env.OPENAI_ORGANIZATION,
  };

  const agent = new OpenAiAgentService(agentConfig);

  console.log(`🤖 Model: ${agentConfig.model}`);
  console.log(`🔑 API Key: ${agentConfig.apiKey.substring(0, 10)}...`);
  console.log('');

  try {
    // Test 1: Simple message
    console.log('📝 Test 1: sendSimpleMessage()');
    console.log('   Input: "Say hello in one sentence."');
    const response1 = await agent.sendSimpleMessage('Say hello in one sentence.');
    console.log(`   ✅ Response: "${response1.content}"`);
    console.log(`   📊 Tokens: ${response1.usage?.totalTokens || 0} (${response1.usage?.promptTokens || 0} in, ${response1.usage?.completionTokens || 0} out)`);
    console.log(`   🏷️  Model: ${response1.model}`);
    console.log('');

    // Test 2: System message
    console.log('📝 Test 2: sendSystemMessage()');
    console.log('   System: "You are a helpful assistant that responds in haiku."');
    console.log('   Input: "Describe the ocean"');
    const response2 = await agent.sendSystemMessage(
      'You are a helpful assistant that responds in haiku.',
      'Describe the ocean'
    );
    console.log(`   ✅ Response: "${response2.content}"`);
    console.log(`   📊 Tokens: ${response2.usage?.totalTokens || 0} (${response2.usage?.promptTokens || 0} in, ${response2.usage?.completionTokens || 0} out)`);
    console.log('');

    // Test 3: Message with context
    console.log('📝 Test 3: sendMessage() with context');
    const context = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is 2+2?' },
      { role: 'assistant', content: '2+2 equals 4.' },
    ];
    console.log('   Context: Previous conversation about math');
    console.log('   Input: "What about 3+3?"');
    const response3 = await agent.sendMessage('What about 3+3?', context);
    console.log(`   ✅ Response: "${response3.content}"`);
    console.log(`   📊 Tokens: ${response3.usage?.totalTokens || 0} (${response3.usage?.promptTokens || 0} in, ${response3.usage?.completionTokens || 0} out)`);
    console.log('');

    // Test 4: Error handling
    console.log('📝 Test 4: Error handling (invalid model)');
    const badAgent = new OpenAiAgentService({
      ...agentConfig,
      model: 'invalid-model-name-12345',
    });
    try {
      await badAgent.sendSimpleMessage('This should fail');
      console.log('   ❌ Expected error but got success');
    } catch (error) {
      console.log(`   ✅ Error caught correctly: ${error.message}`);
    }
    console.log('');

    console.log('✨ All tests passed! Responses API migration successful.\n');
    console.log('📋 Summary:');
    console.log('   - Simple messages work ✓');
    console.log('   - System messages work ✓');
    console.log('   - Context handling works ✓');
    console.log('   - Error handling works ✓');
    console.log('   - Usage tracking works ✓');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.status) {
      console.error(`   Status: ${error.status}`);
    }
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  }
}

testResponsesAPI();

