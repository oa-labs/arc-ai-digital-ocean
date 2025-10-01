import { App } from '@slack/bolt';
import { AgentService, getConfig, validateConfig } from '../../lib/src/index.js';

const debug = (...args) => {
  if (process.env.DEBUG === '1') {
    console.log('[DEBUG]', ...args);
  }
};

const isDirectMessage = (message) => {
  // channel_type is the most reliable, fallback to channel id starting with 'D'
  return message?.channel_type === 'im' || (typeof message?.channel === 'string' && message.channel.startsWith('D'));
};

const interactiveBlocks = () => ({
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

export const handleMessage = async ({ message, say }) => {
  debug('Received message:', JSON.stringify(message, null, 2));

  if (message?.subtype === 'bot_message') {
    debug('Ignoring bot message');
    return;
  }

  if (isDirectMessage(message)) {
    debug('DM detected, generating AI response');

    try {
      // Use the shared agent service to generate AI response for DM
      const systemPrompt = 'You are a helpful AI assistant for workplace safety and internal communications. Provide clear, professional responses to direct messages.';
      const response = await agentService.sendSystemMessage(systemPrompt, message.text);

      debug('AI response generated for DM:', {
        contentLength: response.content.length,
        model: response.model,
        tokens: response.usage?.totalTokens
      });

      // Send both the AI response and interactive blocks
      await say({
        text: response.content,
        ...interactiveBlocks()
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
    const response = await agentService.sendSystemMessage(systemPrompt, message.text);

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

export const registerHandlers = (app) => {
  debug('Registering message, app_mention, app_home_opened, and action handlers');
  app.message(handleMessage);
  app.event('app_mention', handleMessage);

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

export const createSlackApp = (options) => {
  const app = new App(options);

  // Initialize shared configuration and agent service
  const config = getConfig();
  const configValidation = validateConfig();

  if (!configValidation.valid) {
    console.error('[ERROR] Invalid configuration:', configValidation.errors);
    throw new Error(`Configuration validation failed: ${configValidation.errors.join(', ')}`);
  }

  const agentService = new AgentService(config.agent);

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
    const setupSocketModeHandlers = () => {
      try {
        // The socket mode client might be available as a property
        if (app.client.socketMode) {
          console.log('[DEBUG] Found socketMode client, setting up handlers');

          // Listen for connection events
          app.client.socketMode.on('connect', () => {
            console.log('[DEBUG] Socket mode connected successfully');
          });

          app.client.socketMode.on('disconnect', (reason) => {
            console.log('[DEBUG] Socket mode disconnected:', {
              reason,
              timestamp: new Date().toISOString()
            });
          });

          app.client.socketMode.on('error', (error) => {
            console.error('[ERROR] Socket mode error:', {
              message: error.message,
              code: error.code,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
          });

          // Listen for WebSocket events
          app.client.socketMode.on('ws_open', () => {
            console.log('[DEBUG] WebSocket connection opened');
          });

          app.client.socketMode.on('ws_close', (code, reason) => {
            console.log('[DEBUG] WebSocket connection closed:', {
              code,
              reason,
              timestamp: new Date().toISOString()
            });
          });

          app.client.socketMode.on('ws_error', (error) => {
            console.error('[ERROR] WebSocket error:', {
              message: error.message,
              code: error.code,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
          });

          // Listen for message events
          app.client.socketMode.on('message', (event, payload) => {
            console.log('[DEBUG] Socket mode message received:', {
              event,
              payload: JSON.stringify(payload, null, 2),
              timestamp: new Date().toISOString()
            });
          });

          // Listen for unhandled events (this is where the error is coming from)
          app.client.socketMode.on('unhandled_event', (event, state, context) => {
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
          if (app.socketModeClient) {
            console.log('[DEBUG] Found socketModeClient as direct property');

            app.socketModeClient.on('connect', () => {
              console.log('[DEBUG] Socket mode connected successfully');
            });

            app.socketModeClient.on('disconnect', (reason) => {
              console.log('[DEBUG] Socket mode disconnected:', {
                reason,
                timestamp: new Date().toISOString()
              });
            });

            app.socketModeClient.on('error', (error) => {
              console.error('[ERROR] Socket mode error:', {
                message: error.message,
                code: error.code,
                stack: error.stack,
                timestamp: new Date().toISOString()
              });
            });

            app.socketModeClient.on('unhandled_event', (event, state, context) => {
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
        console.error('[ERROR] Failed to setup socket mode handlers:', error.message);
      }
    };

    // Setup handlers immediately and also after a short delay
    setupSocketModeHandlers();
    setTimeout(setupSocketModeHandlers, 1000);
  }

  registerHandlers(app);
  return app;
};
