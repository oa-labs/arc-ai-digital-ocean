import { describe, it, expect, vi } from 'vitest';
import { handleMessage } from '../bots/slack/app.js';

describe('Slack bot message handler', () => {
  it('responds with hello to user messages', async () => {
    const say = vi.fn();
    const message = { text: 'Hi there' };

    await handleMessage({ message, say });

    expect(say).toHaveBeenCalledTimes(1);
    expect(say).toHaveBeenCalledWith('hello');
  });

  it('ignores bot messages', async () => {
    const say = vi.fn();
    const message = { subtype: 'bot_message', text: 'hello' };

    await handleMessage({ message, say });

    expect(say).not.toHaveBeenCalled();
  });
});
