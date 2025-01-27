"""
Certificate rotation script for DojoPool project.
Handles automatic rotation of SSL certificates.
"""

import os
import sys
import logging
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
import OpenSSL.crypto
from cryptography import x509
from cryptography.hazmat.backends import default_backend

class CertificateRotator:
    def __init__(self, root_dir: str | Path):
        self.root_dir = Path(root_dir)
        self.setup_logging()
        
    def setup_logging(self):
        """Set up logging configuration."""
        log_dir = self.root_dir / "logs" / "certificates"
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / f"cert_rotation_{datetime.now(timezone.utc).strftime('%Y%m%d')}.log"),
                logging.StreamHandler()
            ]
        )
        
    def check_certificate_expiry(self) -> List[Dict]:
        """Check SSL certificates for expiration."""
        expiring_certs = []
        cert_dir = self.root_dir / "certs" / "production"
        
        for cert_file in cert_dir.glob("*.crt"):
            try:
                with open(cert_file, "rb") as f:
                    cert_data = f.read()
                    cert = x509.load_pem_x509_certificate(cert_data, default_backend())
                    
                days_until_expiry = (cert.not_valid_after_utc - datetime.now(timezone.utc)).days
                
                if days_until_expiry < 30:
                    expiring_certs.append({
                        "file": cert_file,
                        "days_remaining": days_until_expiry
                    })
            except Exception as e:
                logging.error(f"Error checking certificate {cert_file}: {str(e)}")
                
        return expiring_certs
    
    def backup_certificate(self, cert_file: Path) -> Optional[Path]:
        """Create a backup of a certificate file."""
        try:
            backup_dir = self.root_dir / "certs" / "backup"
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            backup_file = backup_dir / f"{cert_file.stem}_{timestamp}{cert_file.suffix}"
            
            with open(cert_file, "rb") as src, open(backup_file, "wb") as dst:
                dst.write(src.read())
                
            logging.info(f"Created backup of {cert_file} at {backup_file}")
            return backup_file
            
        except Exception as e:
            logging.error(f"Error backing up certificate {cert_file}: {str(e)}")
            return None
    
    def generate_new_certificate(self, domain: str) -> Dict[str, Path]:
        """Generate a new SSL certificate using OpenSSL."""
        try:
            cert_dir = self.root_dir / "certs" / "production"
            cert_dir.mkdir(parents=True, exist_ok=True)
            
            key_file = cert_dir / f"{domain}.key"
            csr_file = cert_dir / f"{domain}.csr"
            cert_file = cert_dir / f"{domain}.crt"
            
            # Generate private key
            subprocess.run([
                "openssl", "genrsa",
                "-out", str(key_file),
                "2048"
            ], check=True)
            
            # Generate CSR
            subprocess.run([
                "openssl", "req",
                "-new",
                "-key", str(key_file),
                "-out", str(csr_file),
                "-subj", f"/CN={domain}"
            ], check=True)
            
            # For development/testing, self-sign the certificate
            # In production, you would submit the CSR to a CA
            subprocess.run([
                "openssl", "x509",
                "-req",
                "-days", "365",
                "-in", str(csr_file),
                "-signkey", str(key_file),
                "-out", str(cert_file)
            ], check=True)
            
            logging.info(f"Generated new certificate for {domain}")
            return {
                "key": key_file,
                "csr": csr_file,
                "cert": cert_file
            }
            
        except subprocess.CalledProcessError as e:
            logging.error(f"OpenSSL command failed: {str(e)}")
            raise
        except Exception as e:
            logging.error(f"Error generating certificate for {domain}: {str(e)}")
            raise
    
    def update_nginx_config(self, cert_files: Dict[str, Path]) -> bool:
        """Update Nginx configuration with new certificate paths."""
        try:
            nginx_conf = self.root_dir / "deployment" / "nginx" / "nginx.conf"
            
            if not nginx_conf.exists():
                logging.error("Nginx configuration file not found")
                return False
                
            with open(nginx_conf, "r") as f:
                content = f.read()
                
            # Update SSL certificate paths
            content = content.replace(
                "ssl_certificate ", 
                f"ssl_certificate {cert_files['cert']} "
            )
            content = content.replace(
                "ssl_certificate_key ",
                f"ssl_certificate_key {cert_files['key']} "
            )
            
            with open(nginx_conf, "w") as f:
                f.write(content)
                
            logging.info("Updated Nginx configuration with new certificate paths")
            return True
            
        except Exception as e:
            logging.error(f"Error updating Nginx configuration: {str(e)}")
            return False
    
    def reload_nginx(self) -> bool:
        """Reload Nginx to apply new certificate configuration."""
        try:
            subprocess.run(["nginx", "-s", "reload"], check=True)
            logging.info("Successfully reloaded Nginx")
            return True
        except subprocess.CalledProcessError as e:
            logging.error(f"Failed to reload Nginx: {str(e)}")
            return False
    
    def rotate_certificates(self) -> bool:
        """Main method to handle certificate rotation."""
        try:
            # Check for expiring certificates
            expiring_certs = self.check_certificate_expiry()
            
            if not expiring_certs:
                logging.info("No certificates need rotation at this time")
                return True
                
            success = True
            for cert_info in expiring_certs:
                cert_file = cert_info["file"]
                domain = cert_file.stem
                
                logging.info(f"Rotating certificate for {domain} (expires in {cert_info['days_remaining']} days)")
                
                # Backup existing certificate
                if not self.backup_certificate(cert_file):
                    logging.error(f"Failed to backup certificate for {domain}")
                    success = False
                    continue
                    
                # Generate new certificate
                try:
                    new_cert_files = self.generate_new_certificate(domain)
                except Exception as e:
                    logging.error(f"Failed to generate new certificate for {domain}")
                    success = False
                    continue
                    
                # Update Nginx configuration
                if not self.update_nginx_config(new_cert_files):
                    logging.error(f"Failed to update Nginx configuration for {domain}")
                    success = False
                    continue
                    
                # Reload Nginx
                if not self.reload_nginx():
                    logging.error(f"Failed to reload Nginx after rotating certificate for {domain}")
                    success = False
                    continue
                    
                logging.info(f"Successfully rotated certificate for {domain}")
                
            return success
            
        except Exception as e:
            logging.error(f"Certificate rotation failed: {str(e)}")
            return False

def main():
    """Main entry point for certificate rotation script."""
    try:
        root_dir = Path(__file__).parent.parent.parent.parent
        rotator = CertificateRotator(root_dir)
        success = rotator.rotate_certificates()
        sys.exit(0 if success else 1)
    except Exception as e:
        logging.error(f"Certificate rotation failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 