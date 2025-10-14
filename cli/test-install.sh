#!/bin/bash

# Test installation script for @ichat-ocean/cli
# This simulates what happens when someone runs `npm install -g @ichat-ocean/cli`

set -e

echo "🧪 Testing npm package installation..."
echo

# Create a temporary directory for testing
TEST_DIR=$(mktemp -d)
echo "📁 Created test directory: $TEST_DIR"

# Create a package and install it
echo "📦 Creating package..."
PACKAGE_FILE=$(npm pack)

echo "📁 Moving to test directory..."
mv "$PACKAGE_FILE" "$TEST_DIR/"
cd "$TEST_DIR"

echo "🔧 Installing package..."
npm install "$PACKAGE_FILE"

echo "✅ Verifying Node.js executable..."
if [ ! -f "node_modules/@ichat-ocean/cli/bin/ichat-cli.js" ]; then
  echo "❌ Node.js executable not found after install"
  exit 1
fi

echo "🧪 Running --version test..."
npx ichat-cli --version

echo "🧪 Running --help test..."
npx ichat-cli --help

echo
echo "✅ All tests passed! The package is ready for npm install."
echo "📦 To publish: npm publish"
echo "🌐 To install globally: npm install -g @ichat-ocean/cli"
echo

# Cleanup
cd /
rm -rf "$TEST_DIR"
echo "🧹 Cleaned up test directory"