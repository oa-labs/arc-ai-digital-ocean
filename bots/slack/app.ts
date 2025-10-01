import { App, AppOptions, AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { AgentService, getConfig, validateConfig } from '../../lib/dist/index.js';

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

  agentService = new AgentService(config.agent);
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

  if (isDirectMessage(msg)) {
    debug('DM detected, generating AI response');

    try {
      // Use the shared agent service to generate AI response for DM
      const systemPrompt = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses to direct messages.';
      const messageText = 'text' in msg ? msg.text || '' : '';
      const response = await agentService.sendSystemMessage(systemPrompt, messageText);

      debug('AI response generated for DM:', {
        contentLength: response.content.length,
        model: response.model,
        tokens: response.usage?.totalTokens
      });

      // Send only the AI response
      await say({
        text: response.content
      });
    } catch (error) {
      console.error('[ERROR] Failed to generate AI response for DM:', error);
      // Fallback to just interactive blocks if AI fails
      await say({ text: 'Sorry, I encountered an error. Here are some interactive options:', ...interactiveBlocks() });
    }
    return;
  }

  debug('Channel/context message: processing with AI agent');

  try {
    // Use the shared agent service to generate AI response
    const systemPrompt = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
    const messageText = 'text' in msg ? msg.text || '' : '';
    const response = await agentService.sendSystemMessage(systemPrompt, messageText);

    debug('AI response generated:', {
      contentLength: response.content.length,
      model: response.model,
      tokens: response.usage?.totalTokens
    });

    await say(response.content);
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

  try {
    // Use the shared agent service to generate AI response
    const systemPrompt = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses.';
    const messageText = event.text || '';
    const response = await agentService.sendSystemMessage(systemPrompt, messageText);

    debug('AI response generated:', {
      contentLength: response.content.length,
      model: response.model,
      tokens: response.usage?.totalTokens
    });

    await say(response.content);
  } catch (error) {
    console.error('[ERROR] Failed to generate AI response:', error);
    await say('Sorry, I encountered an error while processing your message. Please try again.');
  }
};

export const registerHandlers = (app: App): App => {
  debug('Registering message, app_mention, app_home_opened, and action handlers');
  app.message(handleMessage);
  app.event('app_mention', handleAppMention);

  // App Home: publish Home tab when opened
  app.event('app_home_opened', async ({ event, client }) => {
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
  app.action('btn_say_hi', async ({ ack, body, say, respond }) => {
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
  app.action('btn_open_modal', async ({ ack, body, client }) => {
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
  app.view('demo_modal', async ({ ack, body }) => {
    await ack();
    debug('Modal submitted by user', body?.user?.id);
  });

  return app;
};

export const createSlackApp = (options: AppOptions): App => {
  const app = new App(options);

  // Add error event listeners for better troubleshooting
  app.error(async (error) => {
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

