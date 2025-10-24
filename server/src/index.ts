import 'dotenv/config';
import { createApp } from './app.js';
import { config } from './env.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Storage server listening on port ${config.port}`);
});
