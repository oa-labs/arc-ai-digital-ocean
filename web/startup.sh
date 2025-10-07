#!/bin/sh

# Create certbot webroot directory
mkdir -p /var/www/certbot

# Function to generate certificates
generate_certificates() {
    echo "Generating SSL certificates with certbot..."
    certbot certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        --email admin@$HOSTNAME \
        --domain $HOSTNAME \
        --agree-tos \
        --no-eff-email \
        --keep-until-expiring \
        --non-interactive || echo "Certificate generation failed, continuing with self-signed certificates..."
}

# Function to start nginx
start_nginx() {
    echo "Starting nginx..."
    exec nginx -g "daemon off;"
}

# Check if certificates exist
if [ ! -d "/etc/letsencrypt/live/$HOSTNAME" ]; then
    echo "No SSL certificates found. Attempting to generate certificates..."
    generate_certificates
else
    echo "SSL certificates found. Checking renewal..."
    certbot renew --webroot --webroot-path /var/www/certbot --quiet
fi

# Start nginx
start_nginx