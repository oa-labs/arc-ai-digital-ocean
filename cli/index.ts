#!/usr/bin/env node
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { stdin as defaultInput, stdout as defaultOutput } from 'node:process';
import { Readable, Writable } from 'node:stream';
import {
  loadEnvHierarchical,
  createAgentService,
  validateConfig,
  reloadConfig,
  type AgentService
} from '@ichat-ocean/shared';
import packageJson from './package.json' with { type: 'json' };

declare const require: any;
declare const module: any;

const { version: cliVersion } = packageJson as { version: string };

// Load environment variables hierarchically
loadEnvHierarchical();

// Reload configuration after environment variables are loaded
// This ensures the config picks up the newly loaded env vars
reloadConfig();

export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses to direct messages.';

export const EXIT_COMMANDS = new Set(['exit', 'quit', ':q', '\\q']);

export interface ParsedArguments {
  message: string;
  systemPrompt: string;
  error: string | null;
}

export function parseCliArguments(args: string[]): ParsedArguments {
  const result: ParsedArguments = {
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

export async function readFromStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk: string) => {
      data += chunk;
    });
    stream.on('error', reject);
    stream.on('end', () => {
      resolve(data.trim());
    });
  });
}

export function createAgentServiceInstance(): AgentService {
  const validation = validateConfig();
  if (!validation.valid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  return createAgentService();
}

export async function sendAgentMessage(
  agentService: AgentService, 
  message: string, 
  systemPrompt: string = DEFAULT_SYSTEM_PROMPT
) {
  const trimmed = message?.trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty');
  }

  const response = await agentService.sendSystemMessage(systemPrompt, trimmed);
  return response;
}

export function printHelp(output: Writable = defaultOutput): void {
  output.write(`ArcAI CLI\n\n`);
  output.write(`Usage:\n`);
  output.write(`  ichat-cli "Your message here"\n\n`);
  output.write(`Options:\n`);
  output.write(`  -s, --system <prompt>   Override the default system prompt\n`);
  output.write(`  -h, --help              Show this help message\n`);
  output.write(`  -v, --version           Show CLI version\n`);
  output.write(`\nIf no message is provided, the CLI enters interactive mode.\n`);
}

export function printVersion(output: Writable = defaultOutput): void {
  output.write(`@ichat-ocean/cli v${cliVersion}\n`);
}

export async function interactiveChat(
  agentService: AgentService, 
  systemPrompt: string, 
  input: Readable = defaultInput, 
  output: Writable = defaultOutput
): Promise<void> {
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

export interface RunCliOptions {
  argv?: string[];
  input?: Readable;
  output?: Writable;
  agentService?: AgentService;
}

export async function runCli(options: RunCliOptions = {}): Promise<void> {
  const { 
    argv = process.argv, 
    input = defaultInput, 
    output = defaultOutput, 
    agentService 
  } = options;

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
    service = createAgentServiceInstance();
  }

  let message = parsed.message;
  if (!message && !(input as any).isTTY) {
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

  if (!(input as any).isTTY) {
    output.write('[ERROR] No message provided via arguments or stdin.\n');
    process.exitCode = 1;
    return;
  }

  await interactiveChat(service, parsed.systemPrompt, input, output);
}

// ES module detection: check if this file is being run directly
// In ES modules, we use import.meta.url instead of require.main === module
import { fileURLToPath } from 'url';

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  runCli().catch(error => {
    console.error('[ERROR]', error?.message || error);
    process.exit(1);
  });
}

