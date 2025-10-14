#!/bin/bash

# Test installation script for @ichat-ocean/cli
# This simulates what happens when someone runs `npm install -g @ichat-ocean/cli`

set -e

echo "🧪 Testing npm package installation..."
echo

# Create a temporary directory for testing
TEST_DIR=$(mktemp -d)
echo "📁 Created test directory: $TEST_DIR"

# Copy package files to test directory
echo "📦 Copying package files..."
cp -r . "$TEST_DIR/"

cd "$TEST_DIR"

# Remove node_modules to simulate fresh install
rm -rf node_modules package-lock.json

echo "🔧 Installing package (with postinstall build)..."
SKIP_CLI_BINARY_BUILD= npm install

echo "✅ Verifying packaged binary..."
if [ ! -f "bin/ichat-cli" ] && [ ! -f "bin/ichat-cli.exe" ]; then
  echo "❌ Binary not found after install"
  exit 1
fi

EXECUTABLE="bin/ichat-cli"
if [ "$(uname -s)" = "MINGW" ] || [[ "$(uname -s)" == CYGWIN* ]]; then
  EXECUTABLE="bin/ichat-cli.exe"
fi

echo "🧪 Running --version test..."
"./$EXECUTABLE" --version

echo "🧪 Running --help test..."
"./$EXECUTABLE" --help

echo
echo "✅ All tests passed! The package is ready for npm install."
echo "📦 To publish: npm publish"
echo "🌐 To install globally: npm install -g @ichat-ocean/cli"
echo

# Cleanup
cd /
rm -rf "$TEST_DIR"
echo "🧹 Cleaned up test directory"