# Workspace Setup - Code Sharing Best Practices

## Overview

This monorepo now uses **pnpm workspaces** to properly share code between projects without copying files. All projects import from the `@ichat-ocean/shared` package using standard Node.js module resolution.

## Architecture

```
ichat-ocean/
├── lib/                    # @ichat-ocean/shared package
├── cli/                    # CLI tool (depends on shared)
├── bots/slack/            # Slack bot (depends on shared)
├── web/                   # Web app (depends on shared)
└── pnpm-workspace.yaml    # Workspace configuration
```

## Key Changes

### ✅ What We Fixed

1. **Removed code copying** - CLI no longer copies lib files via `sync-lib.js`
2. **Proper package dependencies** - All projects depend on `@ichat-ocean/shared` via `workspace:*`
3. **Removed path aliases** - No more fragile `@lib/*` TypeScript paths
4. **Standard imports** - All code uses `import { ... } from '@ichat-ocean/shared'`
5. **Topological builds** - `pnpm -r build` builds in correct dependency order

### ❌ What We Removed

- `cli/scripts/sync-lib.js` - No longer needed (not deleted, just not used)
- TypeScript path aliases (`@lib/*`) in all tsconfig files
- Vite alias for `@lib` in web project
- CLI's "files: lib/" in package.json
- CLI's build step that ran sync-lib.js

## How It Works

### Package Management

Each project declares `@ichat-ocean/shared` as a dependency:

```json
{
  "dependencies": {
    "@ichat-ocean/shared": "workspace:*"
  }
}
```

pnpm creates symlinks in `node_modules/@ichat-ocean/shared` pointing to the lib package.

### Import Pattern

All projects now import the same way:

```typescript
// Before (fragile path aliases)
import { createAgentService } from '@lib/index.js';

// After (standard package imports)
import { createAgentService } from '@ichat-ocean/shared';
```

### Build Process

```bash
# Build all packages in dependency order
pnpm build

# This runs: pnpm -r build
# Which builds: lib → cli + slack + web (in parallel)
```

The build order is automatic because pnpm understands workspace dependencies.

## Development Workflow

### Initial Setup

```bash
# Install all dependencies and link workspaces
pnpm install
```

### Building

```bash
# Build everything
pnpm build

# Build only the shared library
pnpm --filter @ichat-ocean/shared build

# Build a specific project
pnpm --filter @ichat-ocean/cli build
```

### Development Mode

```bash
# Watch mode for shared library (run in separate terminal)
pnpm dev

# Then run individual projects in dev mode
cd cli && pnpm dev
cd bots/slack && pnpm dev
cd web && pnpm dev
```

### Type Checking

```bash
# Check types in all projects
cd cli && pnpm type-check
cd bots/slack && pnpm type-check
cd lib && pnpm type-check
```

## Benefits

1. **No code duplication** - Single source of truth in lib package
2. **Correct build order** - pnpm handles dependencies automatically
3. **Standard tooling** - Works with any Node.js tool expecting packages
4. **Type safety** - TypeScript resolves types correctly through workspace symlinks
5. **Maintainability** - Changes to lib immediately available to all projects
6. **Publishing ready** - CLI can be published without bundling lib (users get it as a dep)

## Troubleshooting

### If imports don't resolve

```bash
# Re-install to recreate symlinks
pnpm install
```

### If builds fail

```bash
# Clean and rebuild
pnpm clean
pnpm build
```

### If Vite can't find the shared package

Add to `vite.config.ts`:

```typescript
optimizeDeps: {
  include: ['@ichat-ocean/shared']
}
```

(Not needed currently, but good to know)

## Files Changed

- Created: `pnpm-workspace.yaml`
- Modified: `package.json` (root, lib, cli, bots/slack, web)
- Modified: `tsconfig.json` (cli, bots/slack, web)
- Modified: `vite.config.ts`
- Modified: All import statements (5 files)
