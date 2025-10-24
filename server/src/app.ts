import express from 'express';
import cors from 'cors';
import type { ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { storageRouter } from './routes/storage.js';
import { usersRouter } from './routes/users.js';
import { config } from './env.js';
import { ZodError } from 'zod';

function parseCorsOrigins(originConfig?: string) {
  if (!originConfig) {
    return undefined;
  }

  const origins = originConfig
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : undefined;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Invalid request', details: err.flatten() });
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err && typeof err.message === 'string') {
    if (err.message === 'Bucket not registered') {
      return res.status(404).json({ error: 'Bucket not registered' });
    }

    if (err.message.includes('Failed to load agent credentials')) {
      return res.status(502).json({ error: 'Unable to load bucket configuration' });
    }
  }

  console.error('Unhandled error', err);
  return res.status(500).json({ error: 'Internal server error' });
};

export function createApp() {
  const app = express();
  const origins = parseCorsOrigins(config.corsOrigin);

  app.use(
    cors(
      origins
        ? { origin: origins, credentials: true }
        : { origin: true, credentials: true }
    )
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/storage', storageRouter);
  app.use('/users', usersRouter);

  app.use(errorHandler);

  return app;
}
