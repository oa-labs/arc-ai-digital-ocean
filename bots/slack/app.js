import { App } from '@slack/bolt';

export const handleMessage = async ({ message, say }) => {
  if (message?.subtype === 'bot_message') {
    return;
  }

  await say('hello');
};

export const registerHandlers = (app) => {
  app.message(handleMessage);
  app.event('app_mention', handleMessage);
  return app;
};

export const createSlackApp = (options) => {
  const app = new App(options);
  registerHandlers(app);
  return app;
};
