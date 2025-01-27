"""
Automated security check script for DojoPool project.
Runs regular security audits and certificate checks.
"""

import os
import sys
import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
import subprocess
import ssl
import OpenSSL.crypto
from cryptography import x509
from cryptography.hazmat.backends import default_backend

class SecurityChecker:
    def __init__(self, root_dir: str | Path):
        self.root_dir = Path(root_dir)
        self.setup_logging()
        
    def setup_logging(self):
        """Set up logging configuration."""
        log_dir = self.root_dir / "logs" / "security"
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / f"security_check_{datetime.now(timezone.utc).strftime('%Y%m%d')}.log"),
                logging.StreamHandler()
            ]
        )
        
    def check_certificate_expiry(self) -> List[Dict]:
        """Check SSL certificates for expiration."""
        issues = []
        cert_dir = self.root_dir / "certs" / "production"
        
        for cert_file in cert_dir.glob("*.crt"):
            try:
                with open(cert_file, "rb") as f:
                    cert_data = f.read()
                    cert = x509.load_pem_x509_certificate(cert_data, default_backend())
                    
                days_until_expiry = (cert.not_valid_after_utc - datetime.now(timezone.utc)).days
                
                if days_until_expiry < 30:
                    issues.append({
                        "type": "certificate_expiring",
                        "file": str(cert_file),
                        "days_remaining": days_until_expiry,
                        "severity": "HIGH" if days_until_expiry < 7 else "MEDIUM"
                    })
            except Exception as e:
                logging.error(f"Error checking certificate {cert_file}: {str(e)}")
                
        return issues
    
    def check_env_files(self) -> List[Dict]:
        """Verify environment files and their contents."""
        issues = []
        env_files = [".env", ".env.test"]
        
        for env_file in env_files:
            env_path = self.root_dir / env_file
            if not env_path.exists():
                issues.append({
                    "type": "missing_env_file",
                    "file": str(env_path),
                    "severity": "HIGH"
                })
                continue
                
            # Check required variables
            required_vars = [
                "GOOGLE_MAPS_API_KEY",
                "GOOGLE_CLIENT_ID",
                "GOOGLE_CLIENT_SECRET",
                "SECRET_KEY",
                "DATABASE_URL"
            ]
            
            with open(env_path) as f:
                env_contents = f.read()
                
            for var in required_vars:
                if var not in env_contents:
                    issues.append({
                        "type": "missing_env_var",
                        "file": str(env_path),
                        "variable": var,
                        "severity": "HIGH"
                    })
                    
        return issues
    
    def check_exposed_secrets(self) -> List[Dict]:
        """Check for exposed secrets in code."""
        issues = []
        
        # Patterns that might indicate exposed secrets
        secret_patterns = [
            re.compile(r"api[_-]?key.*['\"][a-zA-Z0-9_\-]{32,}['\"]"),
            re.compile(r"secret[_-]?key.*['\"][a-zA-Z0-9_\-]{32,}['\"]"),
            re.compile(r"password.*['\"][a-zA-Z0-9_\-]{8,}['\"]"),
            re.compile(r"token.*['\"][a-zA-Z0-9_\-]{32,}['\"]")
        ]
        
        exclude_dirs = {".git", "node_modules", "__pycache__", "venv", ".venv"}
        
        for root, dirs, files in os.walk(self.root_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file.endswith((".py", ".js", ".json", ".yaml", ".yml")):
                    try:
                        file_path = Path(root) / file
                        with open(file_path) as f:
                            content = f.read()
                            
                        for pattern in secret_patterns:
                            if pattern.search(content):
                                issues.append({
                                    "type": "exposed_secret",
                                    "file": str(file_path),
                                    "pattern": pattern.pattern,
                                    "severity": "HIGH"
                                })
                    except Exception as e:
                        logging.error(f"Error checking file {file_path}: {str(e)}")
                        
        return issues
    
    def check_security_headers(self) -> List[Dict]:
        """Check security headers in nginx configuration."""
        issues = []
        nginx_conf = self.root_dir / "deployment" / "nginx" / "nginx.conf"
        
        if not nginx_conf.exists():
            issues.append({
                "type": "missing_nginx_conf",
                "severity": "MEDIUM"
            })
            return issues
            
        required_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
        }
        
        with open(nginx_conf) as f:
            content = f.read()
            
        for header, value in required_headers.items():
            if header not in content:
                issues.append({
                    "type": "missing_security_header",
                    "header": header,
                    "severity": "MEDIUM"
                })
                
        return issues
    
    def run_checks(self) -> Dict:
        """Run all security checks and return results."""
        start_time = datetime.now(timezone.utc)
        
        results = {
            "timestamp": start_time.isoformat(),
            "issues": []
        }
        
        # Run all checks
        results["issues"].extend(self.check_certificate_expiry())
        results["issues"].extend(self.check_env_files())
        results["issues"].extend(self.check_exposed_secrets())
        results["issues"].extend(self.check_security_headers())
        
        # Generate summary
        results["summary"] = {
            "total_issues": len(results["issues"]),
            "high_severity": len([i for i in results["issues"] if i["severity"] == "HIGH"]),
            "medium_severity": len([i for i in results["issues"] if i["severity"] == "MEDIUM"]),
            "duration_seconds": (datetime.now(timezone.utc) - start_time).total_seconds()
        }
        
        # Save results
        report_dir = self.root_dir / "docs" / "cleanup" / "security_reports"
        report_dir.mkdir(parents=True, exist_ok=True)
        
        report_file = report_dir / f"security_check_{start_time.strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, "w") as f:
            json.dump(results, f, indent=2)
            
        # Log summary
        logging.info(f"Security check completed in {results['summary']['duration_seconds']:.2f} seconds")
        logging.info(f"Found {results['summary']['total_issues']} issues:")
        logging.info(f"  - {results['summary']['high_severity']} high severity")
        logging.info(f"  - {results['summary']['medium_severity']} medium severity")
        logging.info(f"Report saved to {report_file}")
        
        return results

def main():
    """Main entry point for security check script."""
    try:
        root_dir = Path(__file__).parent.parent.parent.parent
        checker = SecurityChecker(root_dir)
        checker.run_checks()
    except Exception as e:
        logging.error(f"Security check failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 