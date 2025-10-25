#!/bin/bash

cd /workspaces/arc-ai

# Bump patch version
current_version=$(node -p "require('./package.json').version")

# Split version
IFS='.' read -ra VERSION_PARTS <<< "$current_version"
major=${VERSION_PARTS[0]}
minor=${VERSION_PARTS[1]}
patch=${VERSION_PARTS[2]}
new_patch=$((patch + 1))
new_version="$major.$minor.$new_patch"

# Update package.json
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8')); pkg.version = '$new_version'; fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');"

# Then run the commands
pnpm build:containers && pnpm push:containers