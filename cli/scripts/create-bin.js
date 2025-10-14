#!/usr/bin/env node
import { writeFileSync, mkdirSync, existsSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const binDir = path.join(projectRoot, 'bin');

// Create bin directory if it doesn't exist
if (!existsSync(binDir)) {
  mkdirSync(binDir, { recursive: true });
}

// Create the executable script
const executableContent = `#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runCli } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run the CLI
runCli().catch(error => {
  console.error('[ERROR]', error?.message || error);
  process.exit(1);
});
`;

const executablePath = path.join(binDir, 'ichat-cli.js');
writeFileSync(executablePath, executableContent);

// Make it executable on Unix-like systems
if (process.platform !== 'win32') {
  chmodSync(executablePath, 0o755);
}

console.log('[ichat-cli] Created Node.js executable at bin/ichat-cli.js');
