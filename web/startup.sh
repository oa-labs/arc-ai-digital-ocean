#!/bin/sh

# Create runtime config file with environment variables
create_runtime_config() {
    echo "Creating runtime configuration..."
    echo "  VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}"
    echo "  VITE_APP_URL: ${VITE_APP_URL}"
    echo "  VITE_API_BASE_URL: ${VITE_API_BASE_URL}"

    cat > /usr/share/nginx/html/config.js <<EOF
window.ENV = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_APP_URL: "${VITE_APP_URL}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}"
};
EOF
    echo "Runtime configuration created successfully."
}

# Function to start nginx
start_nginx() {
    echo "Starting nginx on port 3000..."
    exec nginx -g "daemon off;"
}

# Create runtime config if environment variables are set
if [ -n "$VITE_SUPABASE_URL" ]; then
    create_runtime_config
else
    echo "WARNING: VITE_SUPABASE_URL not set. Runtime configuration will not be created."
    echo "The application will fall back to build-time environment variables (if any)."
fi

# Start nginx
start_nginx