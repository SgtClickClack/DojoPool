def add_security_headers(response):
    """Add security headers to response."""
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains; preload"
    )
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
    )
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
    return response


#!/usr/bin/env python3
"""Certificate rotation script for DojoPool."""
import logging
import os
import subprocess
import sys
from datetime import datetime
from typing import Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("certificate_rotation.log"), logging.StreamHandler()],
)


def check_certificate(domain: str) -> Tuple[bool, Optional[datetime]]:
    """Check SSL certificate expiration date."""
    try:
        # Use OpenSSL to check certificate
        cmd = [
            "openssl",
            "s_client",
            "-connect",
            f"{domain}:443",
            "-servername",
            domain,
            "-showcerts",
        ]
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, stdin=subprocess.PIPE
        )
        output, _ = process.communicate(input=b"")

        # Parse certificate info
        cert_info = subprocess.check_output(
            ["openssl", "x509", "-noout", "-enddate"], input=output
        ).decode()

        # Extract expiration date
        expiry_str = cert_info.split("=")[1].strip()
        expiry_date = datetime.strptime(expiry_str, "%b %d %H:%M:%S %Y %Z")

        # Check if certificate expires within 30 days
        days_until_expiry = (expiry_date - datetime.now()).days
        needs_renewal = days_until_expiry <= 30

        return needs_renewal, expiry_date
    except Exception as e:
        logging.error(f"Error checking certificate: {str(e)}")
        return True, None


def backup_certificate(domain: str) -> bool:
    """Backup existing SSL certificate."""
    try:
        cert_dir = f"/etc/letsencrypt/live/{domain}"
        backup_dir = f'/etc/letsencrypt/backup/{domain}_{datetime.now().strftime("%Y%m%d_%H%M%S")}'

        # Create backup directory
        os.makedirs(backup_dir, exist_ok=True)

        # Backup certificate files
        for file in ["cert.pem", "chain.pem", "fullchain.pem", "privkey.pem"]:
            src = os.path.join(cert_dir, file)
            dst = os.path.join(backup_dir, file)
            if os.path.exists(src):
                subprocess.run(["cp", src, dst], check=True)

        logging.info(f"Certificate backup created at {backup_dir}")
        return True
    except Exception as e:
        logging.error(f"Error backing up certificate: {str(e)}")
        return False


def renew_certificate(domain: str) :
    """Renew SSL certificate using Let's Encrypt."""
    try:
        # Stop Nginx
        subprocess.run(["systemctl", "stop", "nginx"], check=True)

        # Renew certificate
        cmd = [
            "certbot",
            "renew",
            "--cert-name",
            domain,
            "--preferred-challenges",
            "http",
            "--http-01-port",
            "80",
            "--force-renewal",
        ]
        subprocess.run(cmd, check=True)

        # Start Nginx
        subprocess.run(["systemctl", "start", "nginx"], check=True)

        logging.info(f"Certificate renewed for {domain}")
        return True
    except Exception as e:
        logging.error(f"Error renewing certificate: {str(e)}")
        # Try to restart Nginx in case of failure
        try:
            subprocess.run(["systemctl", "start", "nginx"])
        except:
            pass
        return False


def verify_certificate(domain: str) -> bool:
    """Verify the renewed certificate."""
    try:
        # Check HTTPS connection
        cmd = ["curl", "-sS", "--head", f"https://{domain}"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        # Verify response
        if "HTTP/2 200" in result.stdout or "HTTP/1.1 200" in result.stdout:
            logging.info(f"Certificate verification successful for {domain}")
            return True
        else:
            logging.error(f"Certificate verification failed for {domain}")
            return False
    except Exception as e:
        logging.error(f"Error verifying certificate: {str(e)}")
        return False


def notify_team(domain: str, expiry_date: Optional[datetime], success: bool) -> None:
    """Notify team about certificate rotation status."""
    try:
        message = f"""
Certificate Rotation Report
Domain: {domain}
Status: {"Success" if success else "Failed"}
"""
        if expiry_date:
            message += f"Expiry Date: {expiry_date.strftime('%Y-%m-%d %H:%M:%S')}\n"

        # Send email notification
        subprocess.run(
            [
                "mail",
                "-s",
                f"Certificate Rotation Report - {domain}",
                "security@dojopool.com.au",
            ],
            input=message.encode(),
        )

        logging.info("Team notification sent")
    except Exception as e:
        logging.error(f"Error sending notification: {str(e)}")


def main():
    """Main function."""
    if len(sys.argv) != 2:
        print("Usage: certificate_rotation.py <domain>")
        sys.exit(1)

    domain = sys.argv[1]
    logging.info(f"Starting certificate rotation for {domain}")

    # Check certificate
    needs_renewal, expiry_date = check_certificate(domain)
    if not needs_renewal:
        logging.info("Certificate is still valid")
        sys.exit(0)

    # Backup existing certificate
    if not backup_certificate(domain):
        logging.error("Certificate backup failed")
        notify_team(domain, expiry_date, False)
        sys.exit(1)

    # Renew certificate
    if not renew_certificate(domain):
        logging.error("Certificate renewal failed")
        notify_team(domain, expiry_date, False)
        sys.exit(1)

    # Verify new certificate
    if not verify_certificate(domain):
        logging.error("Certificate verification failed")
        notify_team(domain, expiry_date, False)
        sys.exit(1)

    # Notify team
    notify_team(domain, expiry_date, True)
    logging.info("Certificate rotation completed successfully")


if __name__ == "__main__":
    main()
