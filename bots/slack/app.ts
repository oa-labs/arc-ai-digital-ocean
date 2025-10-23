import { App, Assistant } from '@slack/bolt';
import type { App as AppType, AppOptions, AllMiddlewareArgs, SlackEventMiddlewareArgs, AssistantConfig } from '@slack/bolt';
import { createAgentService, AgentService, getConfig, validateConfig, createThreadContextStore, ThreadContextStore } from '@arc-ai/shared';
import { SlackThreadContextStoreAdapter } from './thread-context-adapter.js';
import { markdownToSlackMessage } from './markdown-formatter.js';
import { slackAgentManager } from './slack-agent-manager.js';
import { handleAgentCommand } from './slash-commands.js';

/**
 * Decodes HTML entities in text
 * Handles both named entities (&amp;) and numeric entities (&#123; or &#x7B;)
 */
const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
};

/**
 * Removes citation references like [[C1]], [[C2]], etc. from text
 * Logs a warning when citations are found so we remember to add hyperlinks later
 */
const removeCitations = (text: string): string => {
  const citationPattern = /\[\[C\d+\]\]/g;
  const citations = text.match(citationPattern);

  if (citations && citations.length > 0) {
    console.warn('[WARN] Citation references found and removed:', citations.join(', '));
    console.warn('[WARN] TODO: Replace citation references with actual hyperlinks');
  }

  return text.replace(citationPattern, '');
};

const debug = (...args: any[]): void => {
  if (process.env.DEBUG === '1') {
    console.log('[DEBUG]', ...args);
  }
};

// Initialize shared configuration and agent service at module level
let agentService: AgentService | { sendSystemMessage: () => Promise<never> };
try {
  const config = getConfig();
  const configValidation = validateConfig();

  if (!configValidation.valid) {
    console.error('[ERROR] Invalid configuration:', configValidation.errors);
    throw new Error(`Configuration validation failed: ${configValidation.errors.join(', ')}`);
  }

  agentService = createAgentService();
  console.log('[INFO] Agent service initialized successfully');
} catch (error) {
  console.error('[ERROR] Failed to initialize agent service:', (error as Error).message);
  // Create a fallback agent service that will throw errors when used
  agentService = {
    sendSystemMessage: async (): Promise<never> => {
      throw new Error('Agent service not properly initialized. Check your configuration.');
    }
  };
}

interface SlackMessage {
  channel_type?: string;
  channel?: string;
  text?: string;
  subtype?: string;
}

const isDirectMessage = (message: SlackMessage | undefined): boolean => {
  // channel_type is the most reliable, fallback to channel id starting with 'D'
  return message?.channel_type === 'im' || (typeof message?.channel === 'string' && message.channel.startsWith('D'));
};

interface InteractiveBlocks {
  blocks: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    elements?: Array<{
      type: string;
      text?: {
        type: string;
        text: string;
      };
      action_id?: string;
      value?: string;
    }>;
  }>;
}

const interactiveBlocks = (): InteractiveBlocks => ({
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Hi! I can respond to buttons and open modals from here.'
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Say hi back' },
          action_id: 'btn_say_hi',
          value: 'hi'
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Open modal' },
          action_id: 'btn_open_modal',
          value: 'open'
        }
      ]
    }
  ]
});

export const handleMessage = async ({ message, event, say }: SlackEventMiddlewareArgs<'message'> & AllMiddlewareArgs): Promise<void> => {
  // For app_mention events, the message data is in 'event', not 'message'
  const msg = message || event;

  debug('Received message:', JSON.stringify(msg, null, 2));

  if (msg?.subtype === 'bot_message') {
    debug('Ignoring bot message');
    return;
  }

  const channelId = 'channel' in msg ? msg.channel : '';
  const messageText = 'text' in msg ? msg.text || '' : '';
  const startTime = Date.now();

  if (isDirectMessage(msg)) {
    debug('DM detected, generating AI response');

    try {
      // Try to use channel-specific agent if multi-agent is enabled
      let response;
      let usedMultiAgent = false;

      if (slackAgentManager.isEnabled()) {
        const channelAgentService = await slackAgentManager.getAgentServiceForChannel(channelId);
        if (channelAgentService) {
          const systemPrompt = await slackAgentManager.getSystemPrompt(channelId);
          const enhancedPrompt = await slackAgentManager.buildEnhancedPrompt(channelId, messageText);
          response = await channelAgentService.sendSystemMessage(systemPrompt, enhancedPrompt);
          usedMultiAgent = true;
          debug('Used multi-agent system for DM');
        } else {
          // Try to use default agent from database
          const defaultAgentService = await slackAgentManager.getDefaultAgentService();
          if (defaultAgentService) {
            const defaultAgent = await slackAgentManager.getDefaultAgent();
            const systemPrompt = defaultAgent?.system_prompt || 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses to direct messages.';
            response = await defaultAgentService.sendSystemMessage(systemPrompt, messageText);
            usedMultiAgent = true;
            debug('Used default agent from database for DM');
          }
        }
      }

      // Fallback to environment-based agent service
      if (!response) {
        const systemPrompt = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses to direct messages.';
        response = await agentService.sendSystemMessage(systemPrompt, messageText);
        debug('Used environment-based agent service for DM');
      }

      debug('AI response generated for DM:', {
        contentLength: response.content.length,
        model: response.model,
        tokens: response.usage?.totalTokens,
        multiAgent: usedMultiAgent
      });

      // Log usage if multi-agent
      if (usedMultiAgent && response.usage) {
        const responseTime = Date.now() - startTime;
        await slackAgentManager.logUsage(
          channelId,
          'user' in msg ? (msg as any).user : '',
          'ts' in msg ? (msg as any).ts : undefined,
          response.usage.promptTokens,
          response.usage.completionTokens,
          response.usage.totalTokens,
          response.model,
          responseTime
        );
      }

      // Send only the AI response with formatted blocks
      const formattedMessage = await markdownToSlackMessage(response.content);
      await say(formattedMessage);
    } catch (error) {
      console.error('[ERROR] Failed to generate AI response for DM:', error);
      // Fallback to just interactive blocks if AI fails
      await say({ text: 'Sorry, I encountered an error. Here are some interactive options:', ...interactiveBlocks() });
    }
    return;
  }

  debug('Channel/context message: processing with AI agent');

  try {
    // Try to use channel-specific agent if multi-agent is enabled
    let response;
    let usedMultiAgent = false;

    if (slackAgentManager.isEnabled()) {
      const channelAgentService = await slackAgentManager.getAgentServiceForChannel(channelId);
      if (channelAgentService) {
        const systemPrompt = await slackAgentManager.getSystemPrompt(channelId);
        const enhancedPrompt = await slackAgentManager.buildEnhancedPrompt(channelId, messageText);
        response = await channelAgentService.sendSystemMessage(systemPrompt, enhancedPrompt);
        usedMultiAgent = true;
        debug('Used multi-agent system for channel message');
      } else {
        // Try to use default agent from database
        const defaultAgentService = await slackAgentManager.getDefaultAgentService();
        if (defaultAgentService) {
          const defaultAgent = await slackAgentManager.getDefaultAgent();
          const systemPrompt = defaultAgent?.system_prompt || 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
          const enhancedPrompt = await slackAgentManager.buildEnhancedPrompt(channelId, messageText);
          response = await defaultAgentService.sendSystemMessage(systemPrompt, enhancedPrompt);
          usedMultiAgent = true;
          debug('Used default agent from database for channel message');
        }
      }
    }

    // Fallback to environment-based agent service
    if (!response) {
      const systemPrompt = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
      response = await agentService.sendSystemMessage(systemPrompt, messageText);
      debug('Used environment-based agent service for channel message');
    }

    debug('AI response generated:', {
      contentLength: response.content.length,
      model: response.model,
      tokens: response.usage?.totalTokens,
      multiAgent: usedMultiAgent
    });

    // Log usage if multi-agent
    if (usedMultiAgent && response.usage) {
      const responseTime = Date.now() - startTime;
      await slackAgentManager.logUsage(
        channelId,
        'user' in msg ? (msg as any).user : '',
        'ts' in msg ? (msg as any).ts : undefined,
        response.usage.promptTokens,
        response.usage.completionTokens,
        response.usage.totalTokens,
        response.model,
        responseTime
      );
    }

    const formattedMessage = await markdownToSlackMessage(response.content);
    await say(formattedMessage);
  } catch (error) {
    console.error('[ERROR] Failed to generate AI response:', error);
    await say('Sorry, I encountered an error while processing your message. Please try again.');
  }
};

export const handleAppMention = async ({ event, say }: SlackEventMiddlewareArgs<'app_mention'> & AllMiddlewareArgs): Promise<void> => {
  debug('Received app_mention:', JSON.stringify(event, null, 2));

  if (event?.subtype === 'bot_message') {
    debug('Ignoring bot message');
    return;
  }

  debug('App mention: processing with AI agent');

  const channelId = event.channel || '';
  const messageText = event.text || '';
  const startTime = Date.now();

  try {
    // Try to use channel-specific agent if multi-agent is enabled
    let response;
    let usedMultiAgent = false;

    if (slackAgentManager.isEnabled()) {
      const channelAgentService = await slackAgentManager.getAgentServiceForChannel(channelId);
      if (channelAgentService) {
        const systemPrompt = await slackAgentManager.getSystemPrompt(channelId);
        const enhancedPrompt = await slackAgentManager.buildEnhancedPrompt(channelId, messageText);
        response = await channelAgentService.sendSystemMessage(systemPrompt, enhancedPrompt);
        usedMultiAgent = true;
        debug('Used multi-agent system for app mention');
      } else {
        // Try to use default agent from database
        const defaultAgentService = await slackAgentManager.getDefaultAgentService();
        if (defaultAgentService) {
          const defaultAgent = await slackAgentManager.getDefaultAgent();
          const systemPrompt = defaultAgent?.system_prompt || 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
          const enhancedPrompt = await slackAgentManager.buildEnhancedPrompt(channelId, messageText);
          response = await defaultAgentService.sendSystemMessage(systemPrompt, enhancedPrompt);
          usedMultiAgent = true;
          debug('Used default agent from database for app mention');
        }
      }
    }

    // Fallback to environment-based agent service
    if (!response) {
      const systemPrompt = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
      response = await agentService.sendSystemMessage(systemPrompt, messageText);
      debug('Used environment-based agent service for app mention');
    }

    debug('AI response generated:', {
      contentLength: response.content.length,
      model: response.model,
      tokens: response.usage?.totalTokens,
      multiAgent: usedMultiAgent
    });

    // Log usage if multi-agent
    if (usedMultiAgent && response.usage) {
      const responseTime = Date.now() - startTime;
      await slackAgentManager.logUsage(
        channelId,
        event.user || '',
        event.ts,
        response.usage.promptTokens,
        response.usage.completionTokens,
        response.usage.totalTokens,
        response.model,
        responseTime
      );
    }

    const formattedMessage = await markdownToSlackMessage(response.content);
    await say(formattedMessage);
  } catch (error) {
    console.error('[ERROR] Failed to generate AI response:', error);
    await say('Sorry, I encountered an error while processing your message. Please try again.');
  }
};

const createAssistantConfig = (): AssistantConfig => {
  const threadContextStore = createThreadContextStore();
  const assistantThreadContextStore = threadContextStore
    ? new SlackThreadContextStoreAdapter(threadContextStore)
    : undefined;

  return {
    threadStarted: async ({ saveThreadContext, client, context }) => {
      debug('Assistant thread started');
      try {
        await saveThreadContext();
        debug('Thread context saved on start');
      } catch (e) {
        console.error('[ERROR] Failed to save thread context on start:', e);
      }
    },

    threadContextChanged: async ({ saveThreadContext }) => {
      debug('Assistant thread context changed');
      try {
        await saveThreadContext();
        debug('Thread context saved on change');
      } catch (e) {
        console.error('[ERROR] Failed to save thread context on change:', e);
      }
    },

    userMessage: async ({ client, context, logger, message, getThreadContext, say, setTitle, setStatus }) => {
      if (!('text' in message) || !('thread_ts' in message) || !message.text || !message.thread_ts) {
        return;
      }

      const { channel, thread_ts } = message;
      const { userId, teamId } = context;

      try {
        await setTitle(message.text.substring(0, 100));
        await setStatus({
          status: 'thinking...',
        });

        // Retrieve thread history for context
        const thread = await client.conversations.replies({
          channel,
          ts: thread_ts,
          oldest: thread_ts,
        });

        const threadHistory = thread.messages?.map((m: any) => {
          const role = m.bot_id ? 'Assistant' : 'User';
          return `${role}: ${m.text || ''}`;
        }) || [];
        const parsedThreadHistory = threadHistory.join('\n');

        const systemPrompt = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
        const fullPrompt = parsedThreadHistory ? `${parsedThreadHistory}\nUser: ${message.text}` : message.text;

        debug('Generating AI response for assistant thread');
        const response = await agentService.sendSystemMessage(systemPrompt, fullPrompt);

        // Stream the response
        const streamer = client.chatStream({
          channel: channel,
          recipient_team_id: teamId,
          recipient_user_id: userId,
          thread_ts: thread_ts,
        });

        // Process content: decode HTML entities and remove citations
        let processedContent = decodeHtmlEntities(response.content);
        processedContent = removeCitations(processedContent);

        // Stream the markdown content - Slack's chatStream handles markdown_text natively
        const chunkSize = 50;
        for (let i = 0; i < processedContent.length; i += chunkSize) {
          const chunk = processedContent.substring(i, Math.min(i + chunkSize, processedContent.length));
          await streamer.append({
            markdown_text: chunk,
          });
        }

        // Add feedback buttons at the end
        await streamer.stop({
          blocks: [
            {
              type: 'context_actions',
              elements: [
                {
                  type: 'feedback_buttons',
                  action_id: 'feedback',
                  positive_button: { text: { type: 'plain_text', text: 'Good' }, value: 'good-feedback' },
                  negative_button: { text: { type: 'plain_text', text: 'Bad' }, value: 'bad-feedback' },
                },
              ],
            },
          ],
        });

        debug('AI response streamed successfully');
      } catch (e) {
        console.error('[ERROR] Failed to generate AI response for assistant:', e);
        await say({ text: 'Sorry, something went wrong!' });
      }
    },

    ...(assistantThreadContextStore && { threadContextStore: assistantThreadContextStore }),
  };
};

export const registerHandlers = (app: AppType): AppType => {
  debug('Registering message, app_mention, app_home_opened, assistant, and action handlers');

  // Register Assistant
  const assistant = new Assistant(createAssistantConfig());
  app.assistant(assistant);
  debug('Assistant registered');

  // Keep existing handlers for backwards compatibility
  app.message(handleMessage);
  app.event('app_mention', handleAppMention);

  // Register slash command for agent management
  app.command('/agent', handleAgentCommand);

  // App Home: publish Home tab when opened
  app.event('app_home_opened', async ({ event, client, ack }: any) => {
    await ack();
    debug('app_home_opened for user', event?.user);
    try {
      await client.views.publish({
        user_id: event.user,
        view: {
          type: 'home',
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: 'Welcome to the Bot Home' } },
            { type: 'section', text: { type: 'mrkdwn', text: 'Use the button below to open a modal.' } },
            { type: 'actions', elements: [
              { type: 'button', text: { type: 'plain_text', text: 'Open modal' }, action_id: 'btn_open_modal', value: 'open' }
            ]}
          ]
        }
      });
    } catch (err) {
      console.error('Failed to publish App Home view:', err);
    }
  });

  // Button: say hi back (only works in message contexts)
  app.action('btn_say_hi', async ({ ack, body, say, respond }: any) => {
    await ack();
    debug('btn_say_hi clicked by user', body?.user?.id);
    // In Home tab, respond/say are not available; this is for message threads only
    if (respond) {
      await respond({ text: 'Hi there! 👋', replace_original: false });
    } else if (say) {
      await say('Hi there! 👋');
    }
  });

  // Button: open a modal (requires chat:write scope)
  app.action('btn_open_modal', async ({ ack, body, client }: any) => {
    await ack();
    debug('btn_open_modal clicked; opening modal');
    try {
      // Type guard to check if trigger_id exists
      if ('trigger_id' in body && body.trigger_id) {
        await client.views.open({
          trigger_id: body.trigger_id,
          view: {
            type: 'modal',
            callback_id: 'demo_modal',
            title: { type: 'plain_text', text: 'Demo Modal' },
            submit: { type: 'plain_text', text: 'Submit' },
            close: { type: 'plain_text', text: 'Close' },
            blocks: [
              {
                type: 'input',
                block_id: 'inp',
                label: { type: 'plain_text', text: 'Say something' },
                element: { type: 'plain_text_input', action_id: 'say' }
              }
            ]
          }
        });
      }
    } catch (err) {
      console.error('Failed to open modal:', err);
    }
  });

  // Handle modal submission
  app.view('demo_modal', async ({ ack, body }: any) => {
    await ack();
    debug('Modal submitted by user', body?.user?.id);
  });

  // Handle feedback buttons from Assistant responses
  app.action('feedback', async ({ ack, body, client, logger }: any) => {
    await ack();
    debug('Feedback received from user', body?.user?.id);

    try {
      const value = body?.actions?.[0]?.value;
      const isPositive = value === 'good-feedback';
      const feedbackText = isPositive ? 'Thanks for the positive feedback! 👍' : 'Thanks for the feedback. We\'ll work on improving! 👎';

      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: feedbackText,
      });

      // Log feedback for analysis
      console.log('[INFO] Assistant feedback:', {
        userId: body.user.id,
        feedback: isPositive ? 'positive' : 'negative',
        messageTs: body.message?.ts,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ERROR] Failed to handle feedback:', error);
    }
  });

  return app;
};

export const createSlackApp = (options: AppOptions): AppType => {
  const app = new App(options);

  // Add error event listeners for better troubleshooting
  app.error(async (error: Error & { code?: string }) => {
    console.error('[ERROR] Slack app error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Add socket mode specific error handling if using socket mode
  if (options.socketMode) {
    console.log('[DEBUG] Setting up socket mode error handlers');
    console.log('[DEBUG] Client object keys:', Object.keys(app.client));

    // Try to access socket mode client after app is created
    const setupSocketModeHandlers = (): void => {
      try {
        // The socket mode client might be available as a property
        const appWithSocketMode = app as any;
        if (appWithSocketMode.client.socketMode) {
          console.log('[DEBUG] Found socketMode client, setting up handlers');

          // Listen for connection events
          appWithSocketMode.client.socketMode.on('connect', () => {
            console.log('[DEBUG] Socket mode connected successfully');
          });

          appWithSocketMode.client.socketMode.on('disconnect', (reason: any) => {
            console.log('[DEBUG] Socket mode disconnected:', {
              reason,
              timestamp: new Date().toISOString()
            });
          });

          appWithSocketMode.client.socketMode.on('error', (error: Error) => {
            console.error('[ERROR] Socket mode error:', {
              message: error.message,
              code: (error as any).code,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
          });

          // Listen for WebSocket events
          appWithSocketMode.client.socketMode.on('ws_open', () => {
            console.log('[DEBUG] WebSocket connection opened');
          });

          appWithSocketMode.client.socketMode.on('ws_close', (code: number, reason: string) => {
            console.log('[DEBUG] WebSocket connection closed:', {
              code,
              reason,
              timestamp: new Date().toISOString()
            });
          });

          appWithSocketMode.client.socketMode.on('ws_error', (error: Error) => {
            console.error('[ERROR] WebSocket error:', {
              message: error.message,
              code: (error as any).code,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
          });

          // Listen for message events
          appWithSocketMode.client.socketMode.on('message', (event: string, payload: any) => {
            console.log('[DEBUG] Socket mode message received:', {
              event,
              payload: JSON.stringify(payload, null, 2),
              timestamp: new Date().toISOString()
            });
          });

          // Listen for unhandled events (this is where the error is coming from)
          appWithSocketMode.client.socketMode.on('unhandled_event', (event: string, state: any, context: any) => {
            console.error('[ERROR] Unhandled socket event:', {
              event,
              state,
              context: JSON.stringify(context, null, 2),
              timestamp: new Date().toISOString()
            });
          });
        } else {
          console.log('[DEBUG] socketMode client not found, trying alternative access');
          // Try alternative ways to access the socket mode client
          if (appWithSocketMode.socketModeClient) {
            console.log('[DEBUG] Found socketModeClient as direct property');

            appWithSocketMode.socketModeClient.on('connect', () => {
              console.log('[DEBUG] Socket mode connected successfully');
            });

            appWithSocketMode.socketModeClient.on('disconnect', (reason: any) => {
              console.log('[DEBUG] Socket mode disconnected:', {
                reason,
                timestamp: new Date().toISOString()
              });
            });

            appWithSocketMode.socketModeClient.on('error', (error: Error) => {
              console.error('[ERROR] Socket mode error:', {
                message: error.message,
                code: (error as any).code,
                stack: error.stack,
                timestamp: new Date().toISOString()
              });
            });

            appWithSocketMode.socketModeClient.on('unhandled_event', (event: string, state: any, context: any) => {
              console.error('[ERROR] Unhandled socket event:', {
                event,
                state,
                context: JSON.stringify(context, null, 2),
                timestamp: new Date().toISOString()
              });
            });
          }
        }
      } catch (error) {
        console.error('[ERROR] Failed to setup socket mode handlers:', (error as Error).message);
      }
    };

    // Setup handlers immediately and also after a short delay
    setupSocketModeHandlers();
    setTimeout(setupSocketModeHandlers, 1000);
  }

  registerHandlers(app);
  return app;
};

