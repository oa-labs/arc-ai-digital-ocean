import { loadEnvHierarchical } from '@arc-ai/shared';
import { createSlackApp } from './app.js';
import { AppOptions } from '@slack/bolt';

// Load environment variables hierarchically
loadEnvHierarchical();

const debug = (...args: any[]): void => {
  if (process.env.DEBUG === '1') {
    console.log('[DEBUG]', ...args);
  }
};

// Log environment variable status for debugging
console.log('[INFO] Environment check:');
console.log('[INFO]  - SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? `Set (${process.env.SLACK_BOT_TOKEN.substring(0, 10)}...)` : 'NOT SET');
console.log('[INFO]  - SLACK_SIGNING_SECRET:', process.env.SLACK_SIGNING_SECRET ? 'Set' : 'NOT SET');
console.log('[INFO]  - SLACK_APP_TOKEN:', process.env.SLACK_APP_TOKEN ? `Set (${process.env.SLACK_APP_TOKEN.substring(0, 10)}...)` : 'NOT SET');
console.log('[INFO]  - SLACK_SOCKET_MODE:', process.env.SLACK_SOCKET_MODE || 'NOT SET');

const requireEnv = (name: string): string => {
  const value = process.env[name]?.split('#')[0].trim();
  if (!value) {
    console.error(`[ERROR] Missing required environment variable: ${name}`);
    console.error('[ERROR] Please ensure environment variables are passed to the container.');
    console.error('[ERROR] Example: docker run --env-file .env ... or use -e flags');
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const useSocketMode = ['true', '1', 'yes', 'on'].includes(
  process.env.SLACK_SOCKET_MODE?.split('#')[0].trim().toLowerCase() || ''
);
debug('Socket mode:', useSocketMode);

interface UnhandledEventHook {
  (event: string, currentState: string, context: any): void;
}

const appOptions: AppOptions & { unhandledEventHooks?: UnhandledEventHook[] } = {
  token: requireEnv('SLACK_BOT_TOKEN'),
  signingSecret: requireEnv('SLACK_SIGNING_SECRET')
};

if (useSocketMode) {
  appOptions.socketMode = true;
  appOptions.appToken = requireEnv('SLACK_APP_TOKEN');

  // Add global unhandled event hook to handle the 'server explicit disconnect' error
  appOptions.unhandledEventHooks = [
    (event: string, currentState: string, context: any): void => {
      console.error('[ERROR] Unhandled socket event in state machine:', {
        event,
        currentState,
        context: JSON.stringify(context, null, 2),
        timestamp: new Date().toISOString()
      });

      // Handle specific problematic events
      if (event === 'server explicit disconnect' && currentState === 'connecting') {
        console.error('[ERROR] Server explicitly disconnected during connection phase');
        console.error('[ERROR] This may indicate:');
        console.error('[ERROR]  - Invalid app token');
        console.error('[ERROR]  - Network connectivity issues');
        console.error('[ERROR]  - Slack service issues');
        console.error('[ERROR]  - Rate limiting');
        console.error('[ERROR] Please check your SLACK_APP_TOKEN and network connection');
      }
    }
  ];
}

debug('App options:', { ...appOptions, token: '[REDACTED]', signingSecret: '[REDACTED]', appToken: appOptions.appToken ? '[REDACTED]' : undefined });

const app = createSlackApp(appOptions);

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const startWithRetry = async (maxRetries: number = 5): Promise<void> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (useSocketMode) {
        debug('Starting app in socket mode (no port binding)');
        await app.start();
        console.log('⚡️ Slack bot is running in socket mode');
      } else {
        const port = Number(process.env.SLACK_PORT) || 3000;
        debug(`Starting app on port: ${port} (attempt ${attempt}/${maxRetries})`);
        await app.start({ port, host: '0.0.0.0' });
        console.log(`⚡️ Slack bot is running on port ${port}`);
      }
      debug('App started successfully');
      return; // Success, exit the retry loop
    } catch (error) {
      console.error(`Failed to start Slack bot (attempt ${attempt}/${maxRetries}):`, {
        message: (error as Error).message,
        code: (error as any).code,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      });

      if (attempt === maxRetries) {
        console.error('Max retries reached. Giving up.');
        process.exit(1);
      }

      // Exponential backoff: wait 2^attempt seconds (2, 4, 8, 16, 32 seconds)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${waitTime/1000} seconds...`);
      await sleep(waitTime);
    }
  }
};

const start = async (): Promise<void> => {
  await startWithRetry();
};

start();

