import 'dotenv/config';
import { createSlackApp } from './app.js';

const debug = (...args) => {
  if (process.env.DEBUG === '1') {
    console.log('[DEBUG]', ...args);
  }
};

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const useSocketMode = process.env.SLACK_SOCKET_MODE === 'true';
debug('Socket mode:', useSocketMode);

const appOptions = {
  token: requireEnv('SLACK_BOT_TOKEN'),
  signingSecret: requireEnv('SLACK_SIGNING_SECRET')
};

if (useSocketMode) {
  appOptions.socketMode = true;
  appOptions.appToken = requireEnv('SLACK_APP_TOKEN');
}

debug('App options:', { ...appOptions, token: '[REDACTED]', signingSecret: '[REDACTED]', appToken: appOptions.appToken ? '[REDACTED]' : undefined });

const app = createSlackApp(appOptions);

const start = async () => {
  try {
    const port = Number(process.env.SLACK_PORT) || 3000;
    debug('Starting app on port:', port);
    await app.start({ port });
    console.log(`⚡️ Slack bot is running on port ${port}`);
    debug('App started successfully');
  } catch (error) {
    console.error('Failed to start Slack bot:', error);
    process.exit(1);
  }
};

start();
