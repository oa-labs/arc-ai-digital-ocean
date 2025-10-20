#!/bin/sh

# Create runtime config file with environment variables
create_runtime_config() {
    echo "Creating runtime configuration..."
    cat > /usr/share/nginx/html/config.js <<EOF
window.ENV = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_S3_REGION: "${VITE_S3_REGION}",
  VITE_S3_ENDPOINT: "${VITE_S3_ENDPOINT}",
  VITE_S3_BUCKET: "${VITE_S3_BUCKET}",
  VITE_S3_ACCESS_KEY_ID: "${VITE_S3_ACCESS_KEY_ID}",
  VITE_S3_SECRET_ACCESS_KEY: "${VITE_S3_SECRET_ACCESS_KEY}",
  VITE_APP_URL: "${VITE_APP_URL}"
};
EOF
}

# Function to start nginx
start_nginx() {
    echo "Starting nginx on port 3000..."
    exec nginx -g "daemon off;"
}

# Create runtime config if environment variables are set
if [ -n "$VITE_SUPABASE_URL" ]; then
    create_runtime_config
fi

# Start nginx
start_nginx