#!/usr/bin/env node
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { exec as pkgExec } from 'pkg';

const SKIP_FLAG = process.env.SKIP_CLI_BINARY_BUILD === '1';

if (SKIP_FLAG) {
  console.warn('[ichat-cli] Skipping binary build because SKIP_CLI_BINARY_BUILD=1');
  process.exit(0);
}

const targets = {
  darwin: 'node18-macos-x64',
  linux: 'node18-linux-x64',
  win32: 'node18-win-x64'
};

const target = targets[process.platform];

if (!target) {
  console.warn(`[ichat-cli] Unsupported platform for binary build: ${process.platform}`);
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const binDir = path.join(projectRoot, 'bin');
const bundledEntry = path.join(projectRoot, 'pkg', 'index.js');
const bundledEntryRelative = './pkg/index.js';

if (!existsSync(bundledEntry)) {
  console.error('[ichat-cli] Bundled entry not found. Please run "node ./scripts/build-binary-entry.mjs" before building the binary.');
  process.exit(1);
}

mkdirSync(binDir, { recursive: true });

const cliName = 'ichat-cli';
const executableName = process.platform === 'win32' ? `${cliName}.exe` : cliName;
const executablePath = path.join(binDir, executableName);

(async () => {
  if (existsSync(executablePath)) {
    rmSync(executablePath);
  }

  process.chdir(projectRoot);

  await pkgExec([
    bundledEntryRelative,
    '--target',
    target,
    '--output',
    executablePath
  ]);

  if (process.platform === 'win32') {
    const shimPath = path.join(binDir, cliName);
    writeFileSync(shimPath, '@ECHO OFF\r\n"%~dp0\\ichat-cli.exe" %*\r\n');
  } else {
    chmodSync(executablePath, 0o755);
  }

  console.log(`[ichat-cli] Built ${cliName} binary for target ${target}`);
})().catch(error => {
  console.error(`[ichat-cli] Failed to build binary: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
