#!/bin/bash
set -e

# SSL Setup with Let's Encrypt / Certbot
# Usage: ./setup-ssl.sh your-domain.com your-email@example.com

DOMAIN=${1:-}
EMAIL=${2:-}

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./setup-ssl.sh <domain> <email>"
    echo "Example: ./setup-ssl.sh editor.example.com admin@example.com"
    exit 1
fi

echo "Setting up SSL for $DOMAIN..."

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Get certificate
echo "Obtaining certificate from Let's Encrypt..."
certbot certonly --standalone -d $DOMAIN --agree-tos -m $EMAIL --non-interactive

# Copy certificates to nginx ssl directory
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem

echo "✅ SSL certificates installed!"
echo "   Cert: nginx/ssl/cert.pem"
echo "   Key:  nginx/ssl/key.pem"
echo ""
echo "Next steps:"
echo "1. Update nginx/nginx.conf to uncomment the HTTPS server block"
echo "2. Uncomment the HTTP→HTTPS redirect"
echo "3. Set server_name to $DOMAIN"
echo "4. Run: docker compose -f docker-compose.prod.yml restart nginx"
