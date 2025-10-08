#!/bin/sh

# Function to start nginx
start_nginx() {
    echo "Starting nginx on port 3000..."
    exec nginx -g "daemon off;"
}

# Start nginx
start_nginx