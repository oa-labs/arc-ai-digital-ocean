import type { AllAssistantMiddlewareArgs } from '@slack/bolt/dist/Assistant';
import type { AssistantThreadContextStore, AssistantThreadContext } from '@slack/bolt/dist/AssistantThreadContextStore';
import { ThreadContextStore } from '@ichat-ocean/shared';

/**
 * Adapter that wraps our custom ThreadContextStore to work with Slack's AssistantThreadContextStore interface
 */
export class SlackThreadContextStoreAdapter implements AssistantThreadContextStore {
  constructor(private store: ThreadContextStore) {}

  async get(args: AllAssistantMiddlewareArgs): Promise<AssistantThreadContext> {
    const threadTs = 'payload' in args && 'assistant_thread' in args.payload && args.payload.assistant_thread
      ? args.payload.assistant_thread.thread_ts
      : undefined;

    if (!threadTs || typeof threadTs !== 'string') {
      return {};
    }

    const context = await this.store.get(threadTs);
    return {
      channel_id: context?.channel_id,
      team_id: context?.team_id,
      enterprise_id: context?.enterprise_id || null,
    };
  }

  async save(args: AllAssistantMiddlewareArgs): Promise<void> {
    const payload = 'payload' in args ? args.payload : undefined;
    if (!payload || !('assistant_thread' in payload) || !payload.assistant_thread) {
      return;
    }

    const threadTs = payload.assistant_thread.thread_ts;
    const context = payload.assistant_thread.context as any;

    if (typeof threadTs !== 'string') {
      return;
    }

    await this.store.save(threadTs, {
      channel_id: context?.channel_id || '',
      team_id: context?.team_id,
      enterprise_id: context?.enterprise_id || undefined,
      is_enterprise_install: false,
      thread_ts: threadTs,
      context,
    });
  }
}
