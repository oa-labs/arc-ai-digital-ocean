#!/usr/bin/env node
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { stdin as defaultInput, stdout as defaultOutput } from 'node:process';
import { createRequire } from 'node:module';
import { OpenAiAgentService, getConfig, validateConfig } from '../lib/dist/src/index.js';

const require = createRequire(import.meta.url);
const { version: cliVersion } = require('./package.json');

await import('dotenv/config').catch(() => {});

export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses to direct messages.';

export const EXIT_COMMANDS = new Set(['exit', 'quit', ':q', '\\q']);

export function parseCliArguments(args) {
  const result = {
    message: '',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    error: null
  };

  let consumeNextAsSystem = false;

  for (const arg of args) {
    if (consumeNextAsSystem) {
      result.systemPrompt = arg;
      consumeNextAsSystem = false;
      continue;
    }

    if (arg === '--system' || arg === '-s') {
      consumeNextAsSystem = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      result.error = 'help';
      return result;
    }

    if (arg === '--version' || arg === '-v') {
      result.error = 'version';
      return result;
    }

    if (arg === '--') {
      consumeNextAsSystem = false;
      result.message = args.slice(args.indexOf('--') + 1).join(' ').trim();
      return result;
    }

    if (arg.startsWith('-')) {
      result.error = `Unknown option: ${arg}`;
      return result;
    }

    result.message += (result.message ? ' ' : '') + arg;
  }

  if (consumeNextAsSystem) {
    result.error = 'Missing value for --system option';
  }

  result.message = result.message.trim();
  return result;
}

export async function readFromStream(stream) {
  return new Promise((resolve, reject) => {
    let data = '';
    stream.setEncoding('utf8');
    stream.on('data', chunk => {
      data += chunk;
    });
    stream.on('error', reject);
    stream.on('end', () => {
      resolve(data.trim());
    });
  });
}

export function createAgentService() {
  const validation = validateConfig();
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  const config = getConfig();
  return new OpenAiAgentService(config.agent);
}

export async function sendAgentMessage(agentService, message, systemPrompt = DEFAULT_SYSTEM_PROMPT) {
  const trimmed = message?.trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty');
  }

  const response = await agentService.sendSystemMessage(systemPrompt, trimmed);
  return response;
}

export function printHelp(output = defaultOutput) {
  output.write(`iChat CLI\n\n`);
  output.write(`Usage:\n`);
  output.write(`  ichat-cli "Your message here"\n\n`);
  output.write(`Options:\n`);
  output.write(`  -s, --system <prompt>   Override the default system prompt\n`);
  output.write(`  -h, --help              Show this help message\n`);
  output.write(`  -v, --version           Show CLI version\n`);
  output.write(`\nIf no message is provided, the CLI enters interactive mode.\n`);
}

export function printVersion(output = defaultOutput) {
  output.write(`@ichat-ocean/cli v${cliVersion}\n`);
}

export async function interactiveChat(agentService, systemPrompt, input = defaultInput, output = defaultOutput) {
  const rl = createInterface({ input, output });
  output.write('Entering interactive mode. Type "exit" to quit.\n');

  while (true) {
    const userInput = await rl.question('You> ');
    const normalized = userInput.trim();

    if (!normalized) {
      continue;
    }

    if (EXIT_COMMANDS.has(normalized.toLowerCase())) {
      output.write('Goodbye!\n');
      break;
    }

    try {
      const response = await sendAgentMessage(agentService, normalized, systemPrompt);
      output.write(`\nAgent> ${response.content.trim()}\n\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      output.write(`\n[ERROR] ${message || 'Failed to get response from agent.'}\n\n`);
    }
  }

  await rl.close();
}

export async function runCli({ argv = process.argv, input = defaultInput, output = defaultOutput, agentService } = {}) {
  const args = argv.slice(2);
  const parsed = parseCliArguments(args);

  if (parsed.error === 'help') {
    printHelp(output);
    return;
  }

  if (parsed.error === 'version') {
    printVersion(output);
    return;
  }

  if (parsed.error && parsed.error.startsWith('Unknown option')) {
    output.write(`[ERROR] ${parsed.error}\n`);
    printHelp(output);
    process.exitCode = 1;
    return;
  }

  if (parsed.error === 'Missing value for --system option') {
    output.write(`[ERROR] ${parsed.error}\n`);
    process.exitCode = 1;
    return;
  }

  let service = agentService;
  if (!service) {
    service = createAgentService();
  }

  let message = parsed.message;
  if (!message && !input.isTTY) {
    message = await readFromStream(input);
  }

  if (message) {
    try {
      const response = await sendAgentMessage(service, message, parsed.systemPrompt);
      output.write(`${response.content.trim()}\n`);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      output.write(`[ERROR] ${messageText || 'Failed to get response from agent.'}\n`);
      process.exitCode = 1;
    }
    return;
  }

  if (!input.isTTY) {
    output.write('[ERROR] No message provided via arguments or stdin.\n');
    process.exitCode = 1;
    return;
  }

  await interactiveChat(service, parsed.systemPrompt, input, output);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch(error => {
    console.error('[ERROR]', error?.message || error);
    process.exit(1);
  });
}
