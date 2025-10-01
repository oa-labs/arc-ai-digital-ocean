import 'dotenv/config';
import { createSlackApp } from './app.js';

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const useSocketMode = process.env.SLACK_SOCKET_MODE === 'true';

const appOptions = {
  token: requireEnv('SLACK_BOT_TOKEN'),
  signingSecret: requireEnv('SLACK_SIGNING_SECRET')
};

if (useSocketMode) {
  appOptions.socketMode = true;
  appOptions.appToken = requireEnv('SLACK_APP_TOKEN');
}

const app = createSlackApp(appOptions);

const start = async () => {
  try {
    const port = Number(process.env.SLACK_PORT) || 3000;
    await app.start({ port });
    console.log(`⚡️ Slack bot is running on port ${port}`);
  } catch (error) {
    console.error('Failed to start Slack bot:', error);
    process.exit(1);
  }
};

start();
