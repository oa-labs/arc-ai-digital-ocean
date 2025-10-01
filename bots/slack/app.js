import { App } from '@slack/bolt';

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
    debug('DM detected, sending interactive blocks');
    await say({ text: 'Interactive message', ...interactiveBlocks() });
    return;
  }

  debug('Channel/context message: replying with "hello"');
  await say('hello');
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
  registerHandlers(app);
  return app;
};
