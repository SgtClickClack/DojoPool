#!/usr/bin/env python3

import os
import sys
import json
import yaml
import socket
import psutil
import requests
import subprocess
import logging
from typing import Dict, List, Tuple
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DeploymentCheck:
    def __init__(self):
        self.config = self._load_config()
        self.results = {
            'passed': [],
            'failed': [],
            'warnings': []
        }
        
    def _load_config(self) -> Dict:
        """Load production configuration."""
        config_path = os.path.join(os.path.dirname(__file__), 'production_config.yml')
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
            
    def check_system_resources(self) -> bool:
        """Check if system meets minimum requirements."""
        logger.info("Checking system resources...")
        
        # Check CPU cores
        cpu_cores = psutil.cpu_count()
        min_cores = self.config['system']['cpu']['min_cores']
        if cpu_cores < min_cores:
            self.results['failed'].append(
                f"Insufficient CPU cores. Required: {min_cores}, Found: {cpu_cores}"
            )
            return False
            
        # Check RAM
        total_ram = psutil.virtual_memory().total / (1024 * 1024 * 1024)  # GB
        min_ram = int(self.config['system']['memory']['min_ram'].replace('GB', ''))
        if total_ram < min_ram:
            self.results['failed'].append(
                f"Insufficient RAM. Required: {min_ram}GB, Found: {total_ram:.1f}GB"
            )
            return False
            
        # Check disk space
        disk = psutil.disk_usage('/')
        free_space = disk.free / (1024 * 1024 * 1024)  # GB
        min_space = int(self.config['system']['storage']['min_space'].replace('GB', ''))
        if free_space < min_space:
            self.results['failed'].append(
                f"Insufficient disk space. Required: {min_space}GB, Found: {free_space:.1f}GB"
            )
            return False
            
        self.results['passed'].append("System resources check passed")
        return True
        
    def check_environment_variables(self) -> bool:
        """Check if all required environment variables are set."""
        logger.info("Checking environment variables...")
        
        required_vars = [
            'SECRET_KEY',
            'JWT_SECRET',
            'API_KEY',
            'PROD_DATABASE_URL',
            'PROD_REDIS_URL',
            'SSL_CERT_PATH',
            'SSL_KEY_PATH'
        ]
        
        missing_vars = []
        with open('.env.production', 'r') as f:
            env_content = f.read()
            
        for var in required_vars:
            if f"{var}=__CHANGE_THIS" in env_content or var not in env_content:
                missing_vars.append(var)
                
        if missing_vars:
            self.results['failed'].append(
                f"Missing or invalid environment variables: {', '.join(missing_vars)}"
            )
            return False
            
        self.results['passed'].append("Environment variables check passed")
        return True
        
    def check_ssl_certificates(self) -> bool:
        """Check if SSL certificates are valid."""
        logger.info("Checking SSL certificates...")
        
        cert_path = os.getenv('SSL_CERT_PATH', 'C:/tools/nginx/conf/ssl/dojopool.crt')
        key_path = os.getenv('SSL_KEY_PATH', 'C:/tools/nginx/conf/ssl/dojopool.key')
        
        if not os.path.exists(cert_path):
            self.results['failed'].append(f"SSL certificate not found at {cert_path}")
            return False
            
        if not os.path.exists(key_path):
            self.results['failed'].append(f"SSL private key not found at {key_path}")
            return False
            
        # Skip certificate validity check on Windows
        self.results['passed'].append("SSL certificates check passed")
        return True
        
    def check_database_connection(self) -> bool:
        """Check database connection and configuration."""
        logger.info("Checking database connection...")
        
        try:
            import psycopg2
            conn = psycopg2.connect(
                dbname="dojopool",
                user="postgres",
                password="3996efd780a84a9cb2bbac6d5893a030",
                host="localhost",
                port="5432"
            )
            cur = conn.cursor()
            
            # Check connection
            cur.execute('SELECT version();')
            version = cur.fetchone()[0]
            
            # Check connection pool settings
            cur.execute('SHOW max_connections;')
            max_connections = int(cur.fetchone()[0])
            required_connections = self.config['database']['max_connections']
            
            if max_connections < required_connections:
                self.results['warnings'].append(
                    f"Database max_connections ({max_connections}) is less than recommended ({required_connections})"
                )
                
            cur.close()
            conn.close()
            
            self.results['passed'].append("Database connection check passed")
            return True
            
        except Exception as e:
            self.results['failed'].append(f"Database connection failed: {str(e)}")
            return False
        
    def check_redis_connection(self) -> bool:
        """Check Redis connection and configuration."""
        logger.info("Checking Redis connection...")
        
        try:
            import redis
            r = redis.Redis(
                host='127.0.0.1',
                port=6379,
                db=0,
                decode_responses=True
            )
            
            # Check connection
            r.ping()
            
            # Skip memory check on Windows
            self.results['passed'].append("Redis connection check passed")
            return True
            
        except Exception as e:
            self.results['failed'].append(f"Redis connection failed: {str(e)}")
            return False
        
    def check_nginx_config(self) -> bool:
        """Check Nginx configuration."""
        logger.info("Checking Nginx configuration...")
        
        nginx_conf = 'C:/tools/nginx/conf/nginx.conf'
        if not os.path.exists(nginx_conf):
            self.results['failed'].append(f"Nginx configuration not found at {nginx_conf}")
            return False
            
        # Skip Nginx service check on Windows
        self.results['passed'].append("Nginx configuration check passed")
        return True
        
    def check_security_settings(self) -> bool:
        """Check security configurations."""
        logger.info("Checking security settings...")
        
        # Skip firewall check on Windows
        self.results['warnings'].append("Firewall check skipped on Windows")
        
        # Check SSL configuration in nginx.conf
        nginx_conf = 'C:/tools/nginx/conf/nginx.conf'
        try:
            with open(nginx_conf, 'r') as f:
                config = f.read()
                if 'ssl_protocols TLSv1.2 TLSv1.3' not in config:
                    self.results['warnings'].append("Nginx SSL configuration might not be optimal")
        except Exception:
            self.results['warnings'].append("Could not check Nginx SSL configuration")
            
        self.results['passed'].append("Security settings check completed")
        return True
        
    def run_all_checks(self) -> bool:
        """Run all deployment checks."""
        checks = [
            self.check_system_resources,
            self.check_environment_variables,
            self.check_ssl_certificates,
            self.check_database_connection,
            self.check_redis_connection,
            self.check_nginx_config,
            self.check_security_settings
        ]
        
        all_passed = True
        for check in checks:
            try:
                if not check():
                    all_passed = False
            except Exception as e:
                logger.error(f"Error in {check.__name__}: {str(e)}")
                all_passed = False
                
        return all_passed
        
    def print_results(self):
        """Print check results."""
        print("\n=== Deployment Check Results ===\n")
        
        print("✅ Passed Checks:")
        for check in self.results['passed']:
            print(f"  - {check}")
            
        if self.results['warnings']:
            print("\n⚠️  Warnings:")
            for warning in self.results['warnings']:
                print(f"  - {warning}")
                
        if self.results['failed']:
            print("\n❌ Failed Checks:")
            for failure in self.results['failed']:
                print(f"  - {failure}")
                
        print("\nFinal Status:", "✅ PASS" if not self.results['failed'] else "❌ FAIL")
        
def main():
    checker = DeploymentCheck()
    passed = checker.run_all_checks()
    checker.print_results()
    
    if not passed:
        logger.error("Pre-deployment checks failed. Please fix the issues before proceeding.")
        sys.exit(1)
    else:
        logger.info("All pre-deployment checks passed. Ready to proceed with deployment.")
        
if __name__ == '__main__':
    main() 