#!/usr/bin/env node
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'lib');
const targetDir = path.join(projectRoot, 'dist', 'lib');

const excluded = new Set([
  path.join(sourceDir, 'node_modules'),
  path.join(sourceDir, 'package-lock.json')
]);

if (!existsSync(sourceDir)) {
  console.warn('[ichat-cli] Shared lib directory not found, skipping copy.');
  process.exit(0);
}

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
}

cpSync(sourceDir, targetDir, {
  recursive: true,
  filter: (src) => {
    for (const item of excluded) {
      if (src === item || src.startsWith(`${item}${path.sep}`)) {
        return false;
      }
    }
    return true;
  }
});
