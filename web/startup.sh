#!/bin/sh

# Create necessary directories
mkdir -p /var/www/certbot /etc/nginx/ssl

# Function to generate self-signed certificates
generate_self_signed() {
    echo "Generating self-signed SSL certificates..."
    openssl req -x509 -newkey rsa:4096 \
        -keyout /etc/nginx/ssl/key.pem \
        -out /etc/nginx/ssl/cert.pem \
        -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$HOSTNAME"

    # Update nginx config to use self-signed certificates
    sed -i "s|/etc/letsencrypt/live/$HOSTNAME/fullchain.pem|/etc/nginx/ssl/cert.pem|g" /etc/nginx/conf.d/default.conf
    sed -i "s|/etc/letsencrypt/live/$HOSTNAME/privkey.pem|/etc/nginx/ssl/key.pem|g" /etc/nginx/conf.d/default.conf

    echo "Self-signed certificates generated and configured."
}

# Function to generate Let's Encrypt certificates
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
        --non-interactive
}

# Function to start nginx
start_nginx() {
    echo "Starting nginx..."
    exec nginx -g "daemon off;"
}

# Check if Let's Encrypt certificates exist and are valid
if [ -d "/etc/letsencrypt/live/$HOSTNAME" ] && [ -f "/etc/letsencrypt/live/$HOSTNAME/fullchain.pem" ]; then
    echo "Valid SSL certificates found. Checking renewal..."
    certbot renew --webroot --webroot-path /var/www/certbot --quiet || generate_self_signed
else
    echo "No valid SSL certificates found. Attempting to generate Let's Encrypt certificates..."
    if generate_certificates; then
        echo "Let's Encrypt certificates generated successfully."
    else
        echo "Let's Encrypt certificate generation failed. Using self-signed certificates."
        generate_self_signed
    fi
fi

# Start nginx
start_nginx