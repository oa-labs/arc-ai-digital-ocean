/**
 * Evalite Test Harness for Workplace Safety Q&A
 *
 * This test suite evaluates the quality of AI-generated responses
 * to workplace safety questions using Evalite metrics.
 */

import { config } from 'dotenv';
import { evalite } from 'evalite';
import { Factuality, Levenshtein } from 'autoevals';
import OpenAI from 'openai';

// Load environment variables from .env file
config();

// Initialize OpenAI client with OpenRouter support
// Supports both OpenAI and OpenRouter APIs
// For OpenRouter: Set OPENAI_BASE_URL=https://openrouter.ai/api/v1 and use your OpenRouter API key
// For OpenAI: Use default base URL and your OpenAI API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  defaultHeaders: process.env.OPENAI_BASE_URL?.includes('openrouter.ai') ? {
    'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://github.com/evalite',
    'X-Title': process.env.OPENROUTER_TITLE || 'Evalite Workplace Safety Test',
  } : {},
});

/**
 * Workplace Safety Q&A Evaluation
 */
evalite("Workplace Safety Q&A Evaluation", {
  data: async () => [
    {
      input: "What are the steps to use a fire extinguisher?",
      expected: "The PASS method should be used: Pull the pin, Aim at the base, Squeeze the handle, Sweep side to side.",
      context: [
        "Fire Safety Protocol: Use the PASS method for fire extinguishers - Pull, Aim, Squeeze, Sweep.",
        "Only attempt to extinguish small, contained fires. Evacuate for larger fires.",
        "Always maintain a clear exit path when using a fire extinguisher."
      ]
    },
    {
      input: "What PPE is required when working in the warehouse?",
      expected: "Required PPE includes safety boots, high-visibility vest, hard hat, safety glasses, and gloves.",
      context: [
        "Warehouse Safety Requirements: All personnel must wear steel-toed boots, high-visibility vests, and safety glasses.",
        "Hard hats are mandatory in areas marked with overhead hazard signs.",
        "Gloves must be worn when handling materials, and ear protection is required in designated high-noise zones.",
        "All PPE must comply with OSHA standards."
      ]
    },
    {
      input: "What should I do if I hear the fire alarm?",
      expected: "Stop work, leave belongings, exit via nearest marked exit using stairs, gather at assembly point, and wait for clearance.",
      context: [
        "Emergency Evacuation: Upon hearing the alarm, cease all activities and evacuate immediately.",
        "Use the nearest marked exit and stairs only. Elevators must not be used during emergencies.",
        "Assembly Point: All personnel must gather at the north parking lot.",
        "Do not re-enter the building until authorized by emergency responders.",
        "If smoke is present, stay low to the ground and use alternate exits."
      ]
    },
    {
      input: "What should I do if there's a chemical spill?",
      expected: "Evacuate the area, alert others, notify supervisor and emergency services, don't clean unless trained, use eyewash if exposed, and block the area.",
      context: [
        "Chemical Spill Protocol: Immediately evacuate the affected area and warn others.",
        "Contact your supervisor and the emergency response team (ext. 911).",
        "Only trained personnel should attempt spill cleanup.",
        "If exposed, use emergency eyewash or safety shower immediately.",
        "Secure the area to prevent unauthorized access until hazmat team arrives.",
        "All cleanup must follow the Safety Data Sheet (SDS) procedures."
      ]
    },
    {
      input: "How do I report a workplace injury?",
      expected: "Seek medical help if needed, notify supervisor within 24 hours, complete Incident Report Form with details, submit to HR and supervisor, and provide medical documentation.",
      context: [
        "Injury Reporting: All workplace injuries must be reported within 24 hours.",
        "First, seek appropriate medical attention for the injury.",
        "Complete the Incident Report Form with full details: date, time, location, witnesses, and injury description.",
        "Submit the form to both your immediate supervisor and Human Resources.",
        "Provide any medical documentation and follow-up reports as required.",
        "Even minor injuries must be documented for safety compliance and insurance purposes."
      ]
    }
  ],
  task: async (input, testCase) => {
    // Evalite passes input as first parameter, full testCase as second
    // Debug: Log what we receive
    console.log('\n=== Received Parameters ===');
    console.log('input:', input);
    console.log('testCase:', testCase);

    // Get question and context from the correct source
    const question = input || testCase?.input;
    const context = testCase?.context || [];

    const contextStr = Array.isArray(context)
      ? context.join('\n')
      : context;

    const messages = [
      {
        role: 'system',
        content: 'You are a workplace safety expert. Answer questions about workplace safety clearly and accurately based on the provided context information.'
      },
      {
        role: 'user',
        content: `Question: ${question}\n\nContext Information:\n${contextStr}\n\nPlease answer the question based on the context provided above.`
      }
    ];

    // Debug: Log the actual messages being sent
    console.log('\n=== Request Details ===');
    console.log('Question:', question);
    console.log('Context:', contextStr);

    try {
      const model = process.env.OPENAI_MODEL || 'microsoft/wizardlm-2-8x22b';
      const isOpenRouter = process.env.OPENAI_BASE_URL?.includes('openrouter.ai');

      // Build request parameters with proper compatibility
      const requestParams = {
        model: model,
        messages: messages,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '1'),
      };

      // OpenRouter uses 'max_tokens', OpenAI uses 'max_completion_tokens'
      if (isOpenRouter) {
        requestParams.max_tokens = parseInt(process.env.OPENAI_MAX_TOKENS || '300');
      } else {
        requestParams.max_completion_tokens = parseInt(process.env.OPENAI_MAX_TOKENS || '300');
      }

      const completion = await openai.chat.completions.create(requestParams);

      completion.choices.forEach(element => {
        console.log(element.message);
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error calling API:', error);
      // Provide more detailed error information for debugging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  },
  scorers: [Levenshtein]
});
