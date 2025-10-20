#!/bin/bash

# Production build script for the web application
# This script builds the Docker image with production environment variables

# Exit on error
set -e

# Load environment variables from .env.production if it exists
if [ -f .env.production ]; then
    echo "Loading environment variables from .env.production..."
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "Warning: .env.production file not found. Using environment variables from shell."
fi

# Check required environment variables
required_vars=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_S3_REGION"
    "VITE_S3_ENDPOINT"
    "VITE_S3_BUCKET"
    "VITE_S3_ACCESS_KEY_ID"
    "VITE_S3_SECRET_ACCESS_KEY"
    "VITE_APP_URL"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "Error: Missing required environment variables:"
    printf '  - %s\n' "${missing_vars[@]}"
    echo ""
    echo "Please set these variables in .env.production or export them in your shell."
    exit 1
fi

# Build the Docker image
echo "Building Docker image with production configuration..."
docker build \
    --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
    --build-arg VITE_S3_REGION="$VITE_S3_REGION" \
    --build-arg VITE_S3_ENDPOINT="$VITE_S3_ENDPOINT" \
    --build-arg VITE_S3_BUCKET="$VITE_S3_BUCKET" \
    --build-arg VITE_S3_ACCESS_KEY_ID="$VITE_S3_ACCESS_KEY_ID" \
    --build-arg VITE_S3_SECRET_ACCESS_KEY="$VITE_S3_SECRET_ACCESS_KEY" \
    --build-arg VITE_APP_URL="$VITE_APP_URL" \
    -f Dockerfile \
    -t arc-ai-web:latest \
    ..

echo ""
echo "✅ Build complete! Image tagged as arc-ai-web:latest"
echo ""
echo "To run the container:"
echo "  docker run -p 3000:3000 arc-ai-web:latest"
echo ""
echo "OAuth redirect URL configured for: $VITE_APP_URL"

