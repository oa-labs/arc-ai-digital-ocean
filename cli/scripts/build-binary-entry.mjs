#!/usr/bin/env node
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.SKIP_CLI_BINARY_BUILD === '1') {
  console.warn('[ichat-cli] Skipping bundle build because SKIP_CLI_BINARY_BUILD=1');
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'pkg');

await build({
  entryPoints: [path.join(projectRoot, 'dist', 'index.js')],
  outfile: path.join(outDir, 'index.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: ['node18'],
  sourcemap: false,
  external: [],
  logLevel: 'info',
  legalComments: 'none'
});
