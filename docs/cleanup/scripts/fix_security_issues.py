#!/usr/bin/env python3
"""Security fix script for DojoPool project.
Handles file permissions, security headers, and configuration issues.
"""

import logging
import os
import stat
import sys
from pathlib import Path
from typing import Set

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


class SecurityFixer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        # Add more highly sensitive directories
        self.highly_sensitive_dirs = {
            "secrets",
            "keys",
            "certs",
            "ssl",
            "private",
            "auth",
            "credentials",
            "secure",
            "protected",
            "restricted",
            "confidential",
            "internal",
            "private-keys",
            "master-keys",
            "root-certs",
            "tokens",
            "certificates",
            ".ssh",
            "pki",
            "wallet",
            "crypto",
            "passwords",
            "oauth",
            "jwt",
        }
        # Update sensitive directories
        self.sensitive_dirs = {
            ".env",
            ".env.production",
            ".env.development",
            ".env.test",
            "config",
            "api",
            "backend",
            "frontend",
            "web",
            "app",
            "database",
            "storage",
            "media",
            "uploads",
            "logs",
            "backups",
            "scripts",
            "tools",
            "utils",
            "lib",
            "tests",
            "docs",
            "migrations",
            "templates",
            "bin",
            "conf",
            "etc",
            "include",
            "local",
            "opt",
            "run",
            "sbin",
            "share",
            "tmp",
            "var",
            "cache",
            "data",
            "log",
            "spool",
            "www",
            "html",
            "public",
            "static",
            "assets",
            "images",
            "videos",
            "downloads",
            "temp",
        }
        # Add more sensitive file patterns
        self.sensitive_files = {
            ".env",
            "config.py",
            "secrets.json",
            "credentials.json",
            "firebase-credentials.json",
            ".env.local",
            ".env.production",
            ".env.development",
            ".env.test",
            "private.key",
            "*.pem",
            "*.key",
            "*.crt",
            "*.cer",
            "*.p12",
            "*.pfx",
            "id_rsa",
            "id_dsa",
            "id_ecdsa",
            "id_ed25519",
            "config.json",
            "settings.json",
            "database.sqlite",
            "*.db",
            "*.sqlite3",
            "auth.json",
            "token.json",
            "oauth*.json",
            "service-account*.json",
            "*.ini",
            "*.cfg",
            "*.conf",
            "*.yaml",
            "*.yml",
            "*.properties",
            "*.xml",
            "*.toml",
            "*.env.*",
            "*.htaccess",
            "*.htpasswd",
            "*.passwd",
            "*.shadow",
            "*.keystore",
            "*.truststore",
            "*.jks",
            "*.kdb",
            "*.pwd",
            "*.secret",
            "*.private",
            "*.protected",
            "wp-config.php",
            "config.inc.php",
            "settings.php",
            "connection.php",
            "database.php",
            "db.php",
            "*password*",
            "*secret*",
            "*key*",
            "*token*",
            "*auth*",
            "*credential*",
            "*cert*",
            "*ssl*",
            "*secure*",
            "*private*",
            "*confidential*",
            "*restricted*",
            "*sensitive*",
            "*protected*",
            "*master*",
            "*root*",
            "*admin*",
            "*superuser*",
            "*sudo*",
            # Add more sensitive file patterns
            "*.pkcs12",
            "*.p7b",
            "*.spc",
            "*.der",
            "*.csr",
            "*.pqc",
            "*.srl",
            "*.crl",
            "*.ocsp",
            "*.tls",
            "*.ssh",
            "*.gpg",
            "*.pgp",
            "*.asc",
            "*.kbx",
            "*.keyring",
            "*.ring",
            "*.sec",
            "*.key3.db",
            "*.keytab",
            "*.vault",
            "*.netrc",
            "*.gnupg",
            "*wallet*",
            "*crypto*",
            "*cipher*",
            "*encrypt*",
            "*decrypt*",
            "*hash*",
            "*salt*",
            "*sign*",
            "*verify*",
        }
        # Update excluded directories
        self.exclude_dirs = {
            "node_modules",
            ".git",
            "__pycache__",
            ".pytest_cache",
            "venv",
            ".venv",
            "env",
            ".env",
            "build",
            "dist",
            "coverage",
            ".coverage",
            ".nyc_output",
            ".idea",
            ".vscode",
            ".vs",
            "tmp",
            "temp",
            "logs/archive",
            "public_html",
            "assets/public",
            "static/public",
            "media/public",
            "uploads/public",
            "downloads/public",
        }
        self.nginx_config_dir = self.root_dir / "config" / "nginx"
        self.nginx_config_file = self.nginx_config_dir / "dojopool.conf"
        self.processed_files: Set[Path] = set()
        self.processed_dirs: Set[Path] = set()
        self.web_frameworks = {
            "flask": ["from flask import", "app = Flask("],
            "django": ["from django", "DJANGO_SETTINGS"],
            "fastapi": ["from fastapi import", "app = FastAPI("],
            "aiohttp": ["from aiohttp import", "web.Application()"],
            "tornado": ["import tornado", "tornado.web"],
        }

    def is_excluded(self, path: Path) -> bool:
        """Check if a path should be excluded from processing."""
        return any(part in self.exclude_dirs for part in path.parts)

    def is_sensitive_file(self, path: Path) :
        """Check if a file is considered sensitive."""
        if self.is_excluded(path):
            return False

        name = path.name.lower()

        # Check file patterns
        for pattern in self.sensitive_files:
            if pattern.startswith("*."):
                if name.endswith(pattern[2:]):
                    return True
            elif pattern.lower() == name:
                return True

        # Check if in sensitive directory
        for part in path.parts:
            if part.lower() in self.sensitive_dirs:
                return True

        return False

    def read_file_safely(self, path: Path) :
        """Read file with proper encoding handling."""
        encodings = ["utf-8", "latin1", "cp1252", "ascii"]
        content = ""

        for encoding in encodings:
            try:
                with open(path, "r", encoding=encoding) as f:
                    content = f.read()
                break
            except UnicodeDecodeError:
                continue
            except Exception as e:
                logging.warning(f"Could not read {path} with {encoding}: {str(e)}")

        return content

    def fix_file_permissions(self, path: Path) -> None:
        """Fix file permissions with enhanced security."""
        try:
            if path in self.processed_files or path in self.processed_dirs:
                return

            if self.is_excluded(path):
                return

            current_mode = path.stat().st_mode
            if path.is_dir():
                is_highly_sensitive = any(
                    d.lower() in str(path).lower() for d in self.highly_sensitive_dirs
                )
                is_sensitive = any(
                    d.lower() in str(path).lower() for d in self.sensitive_dirs
                )

                # Enhanced directory permissions
                if is_highly_sensitive:
                    target_mode = 0o700  # rwx------ (owner only)
                elif is_sensitive:
                    target_mode = 0o750  # rwxr-x--- (owner+group)
                else:
                    target_mode = 0o755  # rwxr-xr-x (world readable)

                if (current_mode & 0o777) != target_mode:
                    try:
                        path.chmod(target_mode)
                        logging.info(
                            f"Fixed directory permissions for {path}: {oct(current_mode & 0o777)} -> {oct(target_mode)}"
                        )
                    except PermissionError:
                        logging.error(
                            f"Permission denied setting mode {oct(target_mode)} on directory {path}"
                        )
                    except Exception as e:
                        logging.error(
                            f"Error setting mode {oct(target_mode)} on directory {path}: {str(e)}"
                        )

                # Set sticky bit for sensitive directories
                if (is_highly_sensitive or is_sensitive) and not (
                    current_mode & stat.S_ISVTX
                ):
                    try:
                        path.chmod(current_mode | stat.S_ISVTX)
                        logging.info(f"Added sticky bit to directory {path}")
                    except PermissionError:
                        logging.error(
                            f"Permission denied setting sticky bit on directory {path}"
                        )
                    except Exception as e:
                        logging.error(
                            f"Error setting sticky bit on directory {path}: {str(e)}"
                        )

                self.processed_dirs.add(path)

                # Process directory contents
                try:
                    for item in path.iterdir():
                        self.fix_file_permissions(item)
                except PermissionError:
                    logging.error(f"Permission denied accessing directory {path}")
                except Exception as e:
                    logging.error(f"Error processing directory {path}: {str(e)}")
            else:
                # Check file name and path for sensitivity
                name_patterns = {
                    "password",
                    "secret",
                    "key",
                    "token",
                    "auth",
                    "credential",
                    "cert",
                    "ssl",
                    "secure",
                    "private",
                    "confidential",
                    "restricted",
                    "sensitive",
                    "protected",
                    "master",
                    "root",
                    "admin",
                    "superuser",
                    "sudo",
                    "wallet",
                    "crypto",
                    "cipher",
                    "encrypt",
                    "decrypt",
                    "hash",
                    "salt",
                    "sign",
                    "verify",
                }

                is_highly_sensitive = (
                    any(
                        pattern.lower() in str(path).lower()
                        for pattern in name_patterns
                    )
                    or any(
                        pattern.lower() in path.suffix.lower()
                        for pattern in [".key", ".pem", ".crt", ".p12", ".pfx"]
                    )
                    or any(
                        pattern.lower() in path.name.lower()
                        for pattern in ["id_rsa", "id_dsa", "id_ecdsa", "id_ed25519"]
                    )
                )

                is_sensitive = (
                    self.is_sensitive_file(path)
                    or any(
                        pattern.lower() in path.suffix.lower()
                        for pattern in [
                            ".env",
                            ".cfg",
                            ".conf",
                            ".ini",
                            ".yml",
                            ".yaml",
                        ]
                    )
                    or any(
                        pattern.lower() in path.name.lower()
                        for pattern in ["config", "settings", "credentials"]
                    )
                )

                # Enhanced file permissions
                if is_highly_sensitive:
                    target_mode = 0o600  # rw------- (owner only)
                elif is_sensitive:
                    target_mode = 0o640  # rw-r----- (owner+group)
                else:
                    target_mode = 0o644  # rw-r--r-- (world readable)

                if (current_mode & 0o777) != target_mode:
                    try:
                        path.chmod(target_mode)
                        logging.info(
                            f"Fixed file permissions for {path}: {oct(current_mode & 0o777)} -> {oct(target_mode)}"
                        )
                    except PermissionError:
                        logging.error(
                            f"Permission denied setting mode {oct(target_mode)} on file {path}"
                        )
                    except Exception as e:
                        logging.error(
                            f"Error setting mode {oct(target_mode)} on file {path}: {str(e)}"
                        )

                # Remove execute bit from sensitive files
                if (is_highly_sensitive or is_sensitive) and (
                    current_mode & (stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
                ):
                    try:
                        path.chmod(
                            current_mode & ~(stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
                        )
                        logging.info(
                            f"Removed execute permissions from sensitive file {path}"
                        )
                    except PermissionError:
                        logging.error(
                            f"Permission denied removing execute permissions from file {path}"
                        )
                    except Exception as e:
                        logging.error(
                            f"Error removing execute permissions from file {path}: {str(e)}"
                        )

                self.processed_files.add(path)
        except Exception as e:
            logging.error(f"Error fixing permissions for {path}: {str(e)}")

    def is_web_application_file(self, file_path):
        """Enhanced detection of web application files."""
        web_app_indicators = {
            "routes": ["route", "endpoint", "api", "controller"],
            "frameworks": ["flask", "django", "fastapi", "express", "app"],
            "web_files": ["view", "template", "component", "page"],
            "security": ["middleware", "auth", "security"],
        }

        file_path_lower = str(file_path).lower()
        matches_by_category = {category: 0 for category in web_app_indicators}

        for category, indicators in web_app_indicators.items():
            for indicator in indicators:
                if indicator in file_path_lower:
                    matches_by_category[category] += 1

        # Require matches in at least 2 different categories to consider it a web app file
        categories_with_matches = sum(
            1 for count in matches_by_category.values() if count > 0
        )
        return categories_with_matches >= 2

    def fix_security_headers(self, file_path):
        """Enhanced security header implementation."""
        if not self.is_web_application_file(file_path):
            return

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Define comprehensive security headers for different frameworks
            security_headers = {
                "flask": """
@app.after_request
def add_security_headers(response):
    # HSTS with preload and includeSubDomains
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Comprehensive CSP policy
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; block-all-mixed-content; upgrade-insecure-requests;"
    # XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Control referrer information
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Permissions policy
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=(), payment=()'
    return response
""",
                "django": """
# Security Headers
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Content Security Policy
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_FONT_SRC = ("'self'", "data:")
CSP_CONNECT_SRC = ("'self'", "https:")
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_FORM_ACTION = ("'self'",)
CSP_BASE_URI = ("'self'",)
CSP_BLOCK_ALL_MIXED_CONTENT = True
CSP_UPGRADE_INSECURE_REQUESTS = True

# Permissions Policy
PERMISSIONS_POLICY = {
    'geolocation': [],
    'microphone': [],
    'camera': [],
    'payment': []
}
""",
                "fastapi": """
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; block-all-mixed-content; upgrade-insecure-requests;"
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=(), payment=()'
    return response
""",
            }

            # Detect framework and insert appropriate headers
            framework = self.detect_framework(content)
            if framework in security_headers:
                if framework not in content:
                    with open(file_path, "a", encoding="utf-8") as f:
                        f.write("\n" + security_headers[framework])
                    logging.info(f"Added security headers to {file_path}")

        except Exception as e:
            logging.error(f"Error fixing security headers in {file_path}: {str(e)}")

    def detect_framework(self, content):
        """Detect the web framework used in the file."""
        framework_indicators = {
            "flask": ["flask", "@app", "Flask(__name__"],
            "django": ["django", "MIDDLEWARE", "INSTALLED_APPS"],
            "fastapi": ["fastapi", "FastAPI()", "@app.get"],
        }

        content_lower = content.lower()
        for framework, indicators in framework_indicators.items():
            if any(indicator.lower() in content_lower for indicator in indicators):
                return framework

        # Default to Flask if no framework is detected
        return "flask"

    def fix_environment_files(self) -> None:
        """Fix environment files with secure configurations."""
        env_files = [".env", ".env.production", ".env.test"]
        secure_configs = {
            "FLASK_ENV": "production",
            "DEBUG": "False",
            "FLASK_DEBUG": "0",
            "SESSION_COOKIE_SECURE": "True",
            "SESSION_COOKIE_HTTPONLY": "True",
            "SESSION_COOKIE_SAMESITE": "Strict",
            "PERMANENT_SESSION_LIFETIME": "3600",
            "CSRF_ENABLED": "True",
            "WTF_CSRF_TIME_LIMIT": "3600",
            "REMEMBER_COOKIE_SECURE": "True",
            "REMEMBER_COOKIE_HTTPONLY": "True",
            "REMEMBER_COOKIE_DURATION": "3600",
            "DATABASE_CONNECTION_TIMEOUT": "5",
            "DATABASE_POOL_RECYCLE": "3600",
            "SSL_REDIRECT": "True",
            "PREFERRED_URL_SCHEME": "https",
            "CORS_SUPPORTS_CREDENTIALS": "True",
            "JWT_ACCESS_TOKEN_EXPIRES": "3600",
            "JWT_REFRESH_TOKEN_EXPIRES": "604800",
            "RATE_LIMIT_ENABLED": "True",
            "RATE_LIMIT_STORAGE_URL": "memory://",
            "RATE_LIMIT_STRATEGY": "fixed-window",
            "RATE_LIMIT_DEFAULT": "100/hour",
            "LOG_LEVEL": "INFO",
            "PROPAGATE_EXCEPTIONS": "False",
            "TRAP_HTTP_EXCEPTIONS": "True",
            "JSONIFY_PRETTYPRINT_REGULAR": "False",
            "TEMPLATES_AUTO_RELOAD": "False",
            "EXPLAIN_TEMPLATE_LOADING": "False",
            "MAX_CONTENT_LENGTH": "16777216",
        }

        for env_file in env_files:
            try:
                if os.path.exists(env_file):
                    current_configs = {}

                    # Read current configurations
                    try:
                        with open(env_file, "r", encoding="utf-8") as f:
                            for line in f:
                                if "=" in line and not line.startswith("#"):
                                    key, value = line.strip().split("=", 1)
                                    current_configs[key.strip()] = value.strip()
                    except Exception:
                        current_configs = {}

                    # Update missing configurations
                    updated_configs = {**current_configs, **secure_configs}

                    # Write back all configurations
                    with open(env_file, "w", encoding="utf-8") as f:
                        for key, value in updated_configs.items():
                            f.write(f"{key}={value}\n")

                    logging.info(
                        f"Updated environment file {env_file} with secure configurations"
                    )
            except Exception as e:
                logging.error(f"Error updating environment file {env_file}: {str(e)}")

    def run(self) -> None:
        """Run security fixes."""
        try:
            logging.info("Starting security fixes...")

            # Fix file permissions
            self.fix_file_permissions(self.root_dir)

            # Fix security headers
            for root, _dirs, files in os.walk(self.root_dir):
                for f in files:
                    full_path = Path(root) / f
                    self.fix_security_headers(full_path)

            # Fix environment files
            self.fix_environment_files()

            logging.info("Security fixes completed successfully")

        except Exception as e:
            logging.error(f"Error running security fixes: {str(e)}")
            sys.exit(1)


def main():
    root_dir = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    fixer = SecurityFixer(root_dir)
    fixer.run()


if __name__ == "__main__":
    main()
