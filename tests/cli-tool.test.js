import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_SYSTEM_PROMPT, parseCliArguments, sendAgentMessage } from '../cli/index.js';

describe('CLI argument parsing', () => {
  it('joins positional arguments into a single message', () => {
    const result = parseCliArguments(['Hello', 'world']);
    expect(result.message).toBe('Hello world');
    expect(result.systemPrompt).toBe(DEFAULT_SYSTEM_PROMPT);
    expect(result.error).toBeNull();
  });

  it('allows overriding the system prompt', () => {
    const result = parseCliArguments(['--system', 'custom prompt', 'Hello']);
    expect(result.systemPrompt).toBe('custom prompt');
    expect(result.message).toBe('Hello');
  });

  it('captures unknown options as errors', () => {
    const result = parseCliArguments(['--unknown']);
    expect(result.error).toBe('Unknown option: --unknown');
  });
});

describe('sendAgentMessage', () => {
  it('forwards the trimmed message to the agent service', async () => {
    const agentService = {
      sendSystemMessage: vi.fn().mockResolvedValue({ content: 'ok' })
    };

    const response = await sendAgentMessage(agentService, '  hello ', 'sys');

    expect(agentService.sendSystemMessage).toHaveBeenCalledWith('sys', 'hello');
    expect(response).toEqual({ content: 'ok' });
  });

  it('rejects empty messages', async () => {
    const agentService = {
      sendSystemMessage: vi.fn()
    };

    await expect(sendAgentMessage(agentService, '   ')).rejects.toThrow('Message cannot be empty');
    expect(agentService.sendSystemMessage).not.toHaveBeenCalled();
  });
});
