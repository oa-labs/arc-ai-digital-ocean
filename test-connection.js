#!/usr/bin/env node

/**
 * Simple test script to verify OpenRouter/OpenAI API connection
 * Run with: node test-connection.js
 */

import { config } from 'dotenv';
import OpenAI from 'openai';

config();

async function testConnection() {
  console.log('🔧 Testing API connection...\n');

  // Check environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is required. Please set it in your .env file');
    process.exit(1);
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
  });

  const model = process.env.OPENAI_MODEL || 'microsoft/wizardlm-2-8x22b';

  console.log(`📡 API: ${process.env.OPENAI_BASE_URL || 'OpenRouter'}`);
  console.log(`🤖 Model: ${model}`);
  console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
  console.log('');

  try {
    console.log('🚀 Sending test request...');

    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond clearly and concisely.'
        },
        {
          role: 'user',
          content: 'Say "Connection successful!" if you can read this message.'
        }
      ],
      max_tokens: 50,
      temperature: 0.1,
    });

    const response = completion.choices[0].message.content;
    console.log(`✅ Success! Response: "${response}"`);

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('401')) {
      console.error('💡 This looks like an authentication error. Check your API key.');
    } else if (error.message.includes('404')) {
      console.error('💡 Model not found. Check if the model name is correct.');
    } else if (error.message.includes('429')) {
      console.error('💡 Rate limit exceeded. Try again later.');
    }

    process.exit(1);
  }
}

testConnection();