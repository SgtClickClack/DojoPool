#!/usr/bin/env python3

import os
import secrets
import string
import re
import argparse
from typing import Dict, List
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EnvSetup:
    def __init__(self, env_file: str):
        self.env_file = env_file
        self.required_vars = [
            'SECRET_KEY',
            'JWT_SECRET',
            'API_KEY',
            'POSTGRES_PASSWORD',
            'REDIS_PASSWORD',
            'ML_SERVICE_API_KEY',
            'AI_SERVICE_API_KEY',
            'BACKUP_ENCRYPTION_KEY',
            'STRIPE_SECRET_KEY',
            'STRIPE_WEBHOOK_SECRET',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'SMTP_PASSWORD'
        ]
        self.url_vars = [
            'PROD_DATABASE_URL',
            'PROD_REDIS_URL',
            'ML_SERVICE_URL',
            'AI_SERVICE_URL',
            'SLACK_WEBHOOK_URL'
        ]
        self.email_vars = [
            'ALERT_EMAIL',
            'EMAIL_FROM',
            'SMTP_USER'
        ]
        
    def generate_secret(self, length: int = 50) -> str:
        """Generate a secure random string."""
        alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
        return ''.join(secrets.choice(alphabet) for _ in range(length))
        
    def validate_url(self, url: str) -> bool:
        """Validate URL format."""
        url_pattern = re.compile(
            r'^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$'
        )
        return bool(url_pattern.match(url))
        
    def validate_email(self, email: str) -> bool:
        """Validate email format."""
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        return bool(email_pattern.match(email))
        
    def read_env_file(self) -> Dict[str, str]:
        """Read existing environment variables."""
        if not os.path.exists(self.env_file):
            return {}
            
        env_vars = {}
        with open(self.env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
        return env_vars
        
    def write_env_file(self, env_vars: Dict[str, str]):
        """Write environment variables to file."""
        # Create backup of existing file
        if os.path.exists(self.env_file):
            backup_file = f"{self.env_file}.bak.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            os.rename(self.env_file, backup_file)
            logger.info(f"Created backup of existing env file: {backup_file}")
            
        # Write new file
        with open(self.env_file, 'w') as f:
            f.write("# Production Environment Variables\n")
            f.write(f"# Generated on {datetime.now().isoformat()}\n\n")
            
            # Write variables by section
            sections = {
                'Application Settings': ['ENVIRONMENT', 'DEBUG', 'LOG_LEVEL', 'PORT', 'HOST', 'NODE_ENV'],
                'Security': ['SECRET_KEY', 'JWT_SECRET', 'API_KEY', 'ALLOWED_ORIGINS'],
                'Database': ['PROD_DATABASE_URL', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 
                           'DB_CONNECTION_POOL', 'DB_MAX_CONNECTIONS', 'DB_SSL_MODE'],
                'Redis': ['PROD_REDIS_URL', 'REDIS_PASSWORD', 'REDIS_MAX_MEMORY', 'REDIS_MAX_MEMORY_POLICY'],
                'SSL/TLS': ['SSL_CERT_PATH', 'SSL_KEY_PATH'],
                'Services': ['ML_SERVICE_URL', 'AI_SERVICE_URL', 'ML_SERVICE_API_KEY', 'AI_SERVICE_API_KEY'],
                'Monitoring & Logging': ['LOG_DIR', 'METRICS_RETENTION_DAYS', 'ALERT_EMAIL', 'SLACK_WEBHOOK_URL'],
                'Performance': ['MAX_WORKERS', 'WORKER_THREADS', 'WORKER_TIMEOUT', 'MAX_REQUESTS', 'MAX_REQUESTS_JITTER'],
                'Rate Limiting': ['DEFAULT_RATE_LIMIT', 'AUTH_RATE_LIMIT', 'API_RATE_LIMIT'],
                'Auto Scaling': ['MIN_INSTANCES', 'MAX_INSTANCES', 'SCALE_UP_THRESHOLD', 'SCALE_DOWN_THRESHOLD', 'COOLDOWN_PERIOD'],
                'Backup': ['BACKUP_ENABLED', 'BACKUP_FREQUENCY', 'BACKUP_RETENTION_DAYS', 'BACKUP_ENCRYPTION_KEY'],
                'External Services': ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'AWS_ACCESS_KEY_ID', 
                                    'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET'],
                'Email': ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM'],
                'Feature Flags': ['ENABLE_ML_FEATURES', 'ENABLE_AI_FEATURES', 'ENABLE_ANALYTICS', 
                                'ENABLE_WEBSOCKETS', 'ENABLE_CACHING'],
                'Cache Settings': ['CACHE_TTL', 'CACHE_MAX_ITEMS', 'CACHE_PREFIX'],
                'Websocket': ['WS_HEARTBEAT_INTERVAL', 'WS_TIMEOUT'],
                'System Paths': ['STATIC_ROOT', 'MEDIA_ROOT', 'TEMP_DIR'],
                'Monitoring Thresholds': ['CPU_THRESHOLD', 'MEMORY_THRESHOLD', 'DISK_THRESHOLD', 'RESPONSE_TIME_THRESHOLD']
            }
            
            for section, vars in sections.items():
                f.write(f"\n# {section}\n")
                for var in vars:
                    if var in env_vars:
                        f.write(f"{var}={env_vars[var]}\n")
                        
    def validate_and_update(self):
        """Validate and update environment variables."""
        env_vars = self.read_env_file()
        updated = False
        
        # Check required variables
        for var in self.required_vars:
            if var not in env_vars or env_vars[var].startswith('__CHANGE_THIS'):
                env_vars[var] = self.generate_secret()
                updated = True
                logger.info(f"Generated new secure value for {var}")
                
        # Validate URLs
        for var in self.url_vars:
            if var in env_vars and not self.validate_url(env_vars[var]):
                logger.warning(f"Invalid URL format for {var}: {env_vars[var]}")
                
        # Validate emails
        for var in self.email_vars:
            if var in env_vars and not self.validate_email(env_vars[var]):
                logger.warning(f"Invalid email format for {var}: {env_vars[var]}")
                
        if updated:
            self.write_env_file(env_vars)
            logger.info("Updated environment variables file with secure values")
        else:
            logger.info("No updates needed for environment variables")
            
def main():
    parser = argparse.ArgumentParser(description='Setup and validate environment variables')
    parser.add_argument('--env-file', default='.env.production',
                       help='Path to environment file (default: .env.production)')
    args = parser.parse_args()
    
    try:
        setup = EnvSetup(args.env_file)
        setup.validate_and_update()
    except Exception as e:
        logger.error(f"Error setting up environment variables: {str(e)}")
        sys.exit(1)
        
if __name__ == '__main__':
    main() 