#!/usr/bin/env python3
"""Security update script for DojoPool."""
import os
import secrets
from datetime import datetime
from pathlib import Path


def generate_secure_key(length=50):
    """Generate a cryptographically secure key."""
    return secrets.token_urlsafe(length)


def update_env_file(env_path):
    """Update environment file with secure defaults."""
    if not os.path.exists(env_path):
        print(f"Environment file not found: {env_path}")
        return False

    with open(env_path, "r") as f:
        content = f.read()

    # Generate new secure keys
    replacements = {
        "__YOUR_SECRET_KEY__": generate_secure_key(),
        "__YOUR_SMTP_PASSWORD__": "__REPLACE_WITH_REAL_SMTP_PASSWORD__",
        "your_api_key_here": "__REPLACE_WITH_REAL_FIREBASE_API_KEY__",
        "your_google_client_secret_here": "__REPLACE_WITH_REAL_GOOGLE_CLIENT_SECRET__",
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    # Add security headers if not present
    security_headers = """
# Security Headers
SECURE_SSL_REDIRECT=true
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
CSRF_COOKIE_SECURE=true
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=true
SECURE_CONTENT_TYPE_NOSNIFF=true
X_FRAME_OPTIONS=DENY
"""

    if "SECURE_SSL_REDIRECT" not in content:
        content += security_headers

    # Backup existing file
    backup_path = env_path + f'.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    os.rename(env_path, backup_path)

    # Write updated content
    with open(env_path, "w") as f:
        f.write(content)

    return True


def update_nginx_config():
    """Update Nginx configuration with security headers."""
    nginx_config = """
server {
    listen 443 ssl http2;
    server_name your_domain.com;

    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'none'; object-src 'none'" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Other configurations...
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""

    nginx_path = Path("nginx/dojopool.conf.template")
    nginx_path.parent.mkdir(parents=True, exist_ok=True)

    with open(nginx_path, "w") as f:
        f.write(nginx_config)

    return True


def main():
    """Main function."""
    print("Starting security updates...")

    # Update environment files
    env_files = [".env", ".env.production", ".env.development"]
    for env_file in env_files:
        if update_env_file(env_file):
            print(f"Updated {env_file} with secure defaults")

    # Update Nginx configuration
    if update_nginx_config():
        print("Updated Nginx configuration with security headers")

    print("\nSecurity updates completed!")
    print("\nNext steps:")
    print("1. Replace placeholder values in environment files with real credentials")
    print("2. Update Nginx configuration with your domain name")
    print("3. Install SSL certificates using Let's Encrypt")
    print("4. Restart the application to apply changes")


if __name__ == "__main__":
    main()
