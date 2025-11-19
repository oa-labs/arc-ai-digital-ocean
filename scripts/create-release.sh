#!/bin/bash
set -e

# Ensure we are in the project root
cd "$(dirname "$0")/.."

# 1. Get version and hash
VERSION=$(node -p "require('./package.json').version")
SHORT_HASH=$(git rev-parse --short HEAD)
TAG="v$VERSION"

echo "Preparing release $TAG (Hash: $SHORT_HASH)..."

# 2. Build and Push
echo "Building containers..."
pnpm build:containers
pnpm --filter @arc-ai/bots/outline run build:container

echo "Pushing containers..."
pnpm push:containers
pnpm --filter @arc-ai/bots/outline run push:container

# 3. Create Release Notes
NOTES="## Docker Images

- **Server**: \`ghcr.io/oa-labs/arcai-web-backend:$VERSION-$SHORT_HASH\`
- **Web UI**: \`ghcr.io/oa-labs/arcai-web-frontend:$VERSION-$SHORT_HASH\`
- **Slack Bot**: \`ghcr.io/oa-labs/arcai-slack-bot:$VERSION-$SHORT_HASH\`
- **Outline Bot**: \`ghcr.io/oa-labs/arcai-outline-bot:$VERSION-$SHORT_HASH\`

## Changes
$(git log --pretty=format:"- %s" $(git describe --tags --abbrev=0 2>/dev/null)..HEAD 2>/dev/null || echo "Initial release")
"

echo "Creating GitHub Release..."

# Check if the release already exists
if gh release view "$TAG" >/dev/null 2>&1; then
  echo "Release $TAG already exists. Skipping creation."
else
  # Create release (this will create the tag if it doesn't exist)
  # We use --target to ensure it points to the current commit
  gh release create "$TAG" --title "Release $TAG" --notes "$NOTES" --target "$(git rev-parse HEAD)"
  echo "Release $TAG created successfully!"
fi
