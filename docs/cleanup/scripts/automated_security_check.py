#!/usr/bin/env python3
"""Automated security check script for DojoPool."""
import json
import logging
import os
import stat
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("security_check.log", encoding="utf-8"), logging.StreamHandler()],
)


class SecurityChecker:
    """Security checker class."""

    def __init__(self, root_dir: str | Path):
        """Initialize security checker."""
        self.root_dir = Path(root_dir)
        self.report_dir = self.root_dir / "docs" / "cleanup" / "security_reports"
        self.report_dir.mkdir(parents=True, exist_ok=True)
        self.issues: List[Dict] = []

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
            "tests",
            "test",
            "docs/cleanup/security_reports",
            "public_html",
            "assets/public",
            "static/public",
            "media/public",
            "uploads/public",
            "downloads/public",
        }

        # Update highly sensitive directories
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

        # Update sensitive files
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

        self.exclude_files = {
            "security_check.log",
            "automated_security_check.py",
            ".env.template",
            ".env.example",
        }

        self.processed_files: Set[Path] = set()
        self.processed_dirs: Set[Path] = set()

        self.web_frameworks = {
            "flask": ["from flask import", "app = Flask(", "@app.route"],
            "django": ["from django", "DJANGO_SETTINGS", "urlpatterns"],
            "fastapi": ["from fastapi import", "app = FastAPI(", "@app.get", "@app.post"],
            "aiohttp": ["from aiohttp import", "web.Application()", "async def"],
            "tornado": ["import tornado", "tornado.web", "RequestHandler"],
        }

    def is_excluded(self, path: Path) -> bool:
        """Check if a path should be excluded from processing."""
        return any(part in self.exclude_dirs for part in path.parts)

    def is_sensitive_file(self, path: Path) -> bool:
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

    def read_file_safely(self, path: Path) -> str:
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

    def check_dependencies(self) -> None:
        """Check dependencies for known vulnerabilities."""
        try:
            # Check Python dependencies
            if (self.root_dir / "requirements.txt").exists():
                try:
                    result = subprocess.run(
                        ["safety", "check", "-r", "requirements.txt"],
                        capture_output=True,
                        encoding="latin1",  # Use latin1 for better compatibility
                    )
                    if result.returncode != 0 and result.stdout:
                        for line in result.stdout.splitlines():
                            if "Found" in line and "vulnerability" in line:
                                self.issues.append(
                                    {
                                        "severity": "high",
                                        "type": "dependency",
                                        "description": line.strip(),
                                    }
                                )
                except UnicodeDecodeError:
                    logging.warning("Failed to decode safety check output")
                except Exception as e:
                    logging.error(f"Error running safety check: {str(e)}")

            # Check Node.js dependencies
            if (self.root_dir / "package.json").exists():
                try:
                    result = subprocess.run(
                        ["npm", "audit", "--json"],
                        capture_output=True,
                        encoding="latin1",  # Use latin1 for better compatibility
                    )
                    if result.stdout:
                        try:
                            audit_data = json.loads(result.stdout)
                            for vuln in audit_data.get("vulnerabilities", {}).values():
                                self.issues.append(
                                    {
                                        "severity": vuln.get("severity", "high"),
                                        "type": "dependency",
                                        "description": f"NPM package {vuln.get('name')} has {vuln.get('severity')} severity vulnerability",
                                    }
                                )
                        except json.JSONDecodeError:
                            logging.error("Failed to parse npm audit output")
                except UnicodeDecodeError:
                    logging.warning("Failed to decode npm audit output")
                except Exception as e:
                    logging.error(f"Error running npm audit: {str(e)}")
        except Exception as e:
            logging.error(f"Error checking dependencies: {str(e)}")
            self.issues.append(
                {
                    "severity": "high",
                    "type": "system",
                    "description": f"Failed to check dependencies: {str(e)}",
                }
            )

    def check_secrets(self) -> None:
        """Check for exposed secrets in code."""
        try:
            # Check common patterns
            patterns = [
                r"(?i)api[_-]key\s*=\s*['\"](?!__REPLACE|your)[a-zA-Z0-9_\-]{16,}['\"]",
                r"(?i)secret[_-]key\s*=\s*['\"](?!__REPLACE|your)[a-zA-Z0-9_\-]{16,}['\"]",
                r"(?i)password\s*=\s*['\"](?!__REPLACE|your)[a-zA-Z0-9_\-@$!%*?&]{8,}['\"]",
                r"(?i)token\s*=\s*['\"](?!__REPLACE|your)[a-zA-Z0-9_\-\.]{16,}['\"]",
                r"(?i)credential\s*=\s*['\"](?!__REPLACE|your)[a-zA-Z0-9_\-]{16,}['\"]",
            ]

            for root, dirs, files in os.walk(self.root_dir):
                # Skip excluded directories
                dirs[:] = [d for d in dirs if d not in self.exclude_dirs]

                for file in files:
                    if file in self.exclude_files:
                        continue

                    if file.endswith((".py", ".js", ".ts", ".json", ".yml", ".yaml", ".env")):
                        path = Path(root) / file
                        if self.is_excluded(path):
                            continue

                        try:
                            content = self.read_file_safely(path)

                            for pattern in patterns:
                                import re

                                matches = re.finditer(pattern, content)
                                for match in matches:
                                    value = match.group(1) if match.groups() else match.group(0)
                                    # Skip template values
                                    if any(
                                        x in value.lower()
                                        for x in ["your_", "replace_", "example_", "__"]
                                    ):
                                        continue

                                    self.issues.append(
                                        {
                                            "severity": "high",
                                            "type": "secret",
                                            "description": f"Potential secret found in {path.relative_to(self.root_dir)}",
                                            "line": content.count("\n", 0, match.start()) + 1,
                                        }
                                    )
                        except Exception as e:
                            logging.warning(f"Could not check {path}: {str(e)}")
        except Exception as e:
            logging.error(f"Error checking secrets: {str(e)}")
            self.issues.append(
                {
                    "severity": "high",
                    "type": "system",
                    "description": f"Failed to check secrets: {str(e)}",
                }
            )

    def check_configurations(self) -> None:
        """Check security configurations."""
        try:
            # Check for missing environment files
            required_env_files = [".env", ".env.test"]
            for env_file in required_env_files:
                if not (self.root_dir / env_file).exists():
                    self.issues.append(
                        {
                            "severity": "high",
                            "type": "config",
                            "description": f"Missing environment file: {env_file}",
                        }
                    )

            # Check Nginx configuration
            nginx_conf = self.root_dir / "config" / "nginx" / "dojopool.conf"
            if not nginx_conf.exists():
                self.issues.append(
                    {
                        "severity": "medium",
                        "type": "config",
                        "description": "Missing Nginx configuration",
                    }
                )
            else:
                content = self.read_file_safely(nginx_conf)
                required_configs = {
                    "ssl_protocols": "Missing SSL protocol configuration",
                    "ssl_ciphers": "Missing SSL cipher configuration",
                    "add_header Strict-Transport-Security": "Missing HSTS configuration",
                    "add_header X-Frame-Options": "Missing X-Frame-Options header",
                    "add_header X-Content-Type-Options": "Missing X-Content-Type-Options header",
                    "add_header Content-Security-Policy": "Missing Content-Security-Policy header",
                }

                for config, message in required_configs.items():
                    if config not in content:
                        self.issues.append(
                            {"severity": "high", "type": "config", "description": message}
                        )

            # Check security headers in code
            security_headers = {
                "Strict-Transport-Security": "HSTS header",
                "X-Frame-Options": "X-Frame-Options header",
                "X-Content-Type-Options": "X-Content-Type-Options header",
                "Content-Security-Policy": "Content-Security-Policy header",
                "X-XSS-Protection": "X-XSS-Protection header",
                "Referrer-Policy": "Referrer-Policy header",
            }

            for root, dirs, files in os.walk(self.root_dir):
                dirs[:] = [d for d in dirs if d not in self.exclude_dirs]

                for file in files:
                    if file.endswith((".py", ".js")):
                        path = Path(root) / file
                        if self.is_excluded(path):
                            continue

                        try:
                            content = self.read_file_safely(path)
                            for header, description in security_headers.items():
                                if header not in content:
                                    self.issues.append(
                                        {
                                            "severity": "medium",
                                            "type": "config",
                                            "description": f"Missing {description} in {path.relative_to(self.root_dir)}",
                                        }
                                    )
                        except Exception as e:
                            logging.warning(f"Could not check {path}: {str(e)}")
        except Exception as e:
            logging.error(f"Error checking configurations: {str(e)}")
            self.issues.append(
                {
                    "severity": "high",
                    "type": "system",
                    "description": f"Failed to check configurations: {str(e)}",
                }
            )

    def is_web_application_file(self, file_path):
        """Improved detection of web application files."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().lower()

                # Skip utility scripts and test files
                if any(
                    x in str(file_path).lower()
                    for x in ["test", "script", "tool", "util", "helper", "cleanup"]
                ):
                    return False

                # Check for framework patterns
                for _framework, patterns in self.web_frameworks.items():
                    framework_matches = sum(1 for pattern in patterns if pattern.lower() in content)
                    if framework_matches >= 2:  # Require at least 2 framework patterns
                        return True

                # Check for web-specific patterns that strongly indicate a web application
                strong_web_patterns = [
                    "@app.route",
                    "@app.get",
                    "@app.post",
                    "class httpserver",
                    "class requesthandler",
                    "def wsgi_app",
                    "def asgi_app",
                    "@router.",
                    "@blueprint.",
                    "class view",
                    "class apiview",
                    "class viewset",
                    "class controller",
                ]

                if any(pattern in content for pattern in strong_web_patterns):
                    return True

                # Check for combinations of web patterns that together indicate a web app
                web_patterns = {
                    "request_handling": ["request.", "response.", ".status_code", ".headers["],
                    "routing": ["@route", "def get(", "def post(", "def put(", "def delete("],
                    "web_framework": [
                        "wsgi",
                        "asgi",
                        "@app.",
                        "@api.",
                        "fastapi",
                        "flask",
                        "django",
                    ],
                    "http_features": [
                        ".cookies.",
                        ".session.",
                        "content-type:",
                        "application/json",
                    ],
                    "auth": ["oauth", "jwt", "bearer", "authentication", "authorization"],
                }

                # Count pattern categories present
                category_matches = sum(
                    1
                    for patterns in web_patterns.values()
                    if any(pattern in content for pattern in patterns)
                )

                # Require matches in at least 3 different categories to consider it a web app
                return category_matches >= 3

        except Exception as e:
            logging.error(f"Error checking file {file_path}: {str(e)}")
            return False

    def check_file_permissions(self, path: Path) -> None:
        """Check file permissions."""
        try:
            if path in self.processed_files or path in self.processed_dirs:
                return

            if self.is_excluded(path):
                return

            current_mode = path.stat().st_mode
            if path.is_dir():
                is_highly_sensitive = any(
                    d.lower() in path.parts[-1].lower() for d in self.highly_sensitive_dirs
                )
                is_sensitive = any(d.lower() in path.parts[-1].lower() for d in self.sensitive_dirs)

                expected_mode = 0o700 if is_highly_sensitive else 0o750 if is_sensitive else 0o755

                if (current_mode & 0o777) != expected_mode:
                    self.issues.append(
                        {
                            "severity": "high",
                            "type": "permission",
                            "description": f"Directory {path} has incorrect permissions: {oct(current_mode & 0o777)} (expected {oct(expected_mode)})",
                        }
                    )

                # Check sticky bit for sensitive directories
                if (is_highly_sensitive or is_sensitive) and not (current_mode & stat.S_ISVTX):
                    self.issues.append(
                        {
                            "severity": "high",
                            "type": "permission",
                            "description": f"Directory {path} is missing sticky bit",
                        }
                    )

                self.processed_dirs.add(path)

                # Process directory contents
                try:
                    for item in path.iterdir():
                        self.check_file_permissions(item)
                except PermissionError:
                    self.issues.append(
                        {
                            "severity": "high",
                            "type": "permission",
                            "description": f"Permission denied accessing directory {path}",
                        }
                    )
            else:
                is_highly_sensitive = any(
                    pattern.lower() in path.name.lower()
                    for pattern in {
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
                )
                is_sensitive = self.is_sensitive_file(path)

                expected_mode = 0o600 if is_highly_sensitive else 0o640 if is_sensitive else 0o644

                if (current_mode & 0o777) != expected_mode:
                    self.issues.append(
                        {
                            "severity": "high",
                            "type": "permission",
                            "description": f"File {path} has incorrect permissions: {oct(current_mode & 0o777)} (expected {oct(expected_mode)})",
                        }
                    )

                # Check execute bit
                if (is_highly_sensitive or is_sensitive) and (
                    current_mode & (stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
                ):
                    self.issues.append(
                        {
                            "severity": "high",
                            "type": "permission",
                            "description": f"Sensitive file {path} has execute permissions",
                        }
                    )

                self.processed_files.add(path)
        except Exception as e:
            logging.error(f"Error checking permissions for {path}: {str(e)}")
            self.issues.append(
                {
                    "severity": "high",
                    "type": "system",
                    "description": f"Failed to check permissions for {path}: {str(e)}",
                }
            )

    def check_security_headers(self, file_path):
        """Check for security headers in web application files."""
        # Skip cleanup directory entirely
        if "cleanup" in str(file_path):
            return

        # Skip utility scripts and test files
        if any(
            x in str(file_path).lower()
            for x in [
                "test",
                "script",
                "tool",
                "util",
                "helper",
                "analyze",
                "inventory",
                "check",
                "fix",
                "setup",
                "config",
            ]
        ):
            return

        # Skip if not in a web application directory
        web_app_dirs = {"app", "web", "api", "routes", "views", "controllers", "endpoints"}
        if not any(d in str(file_path).lower() for d in web_app_dirs):
            return

        if not self.is_web_application_file(file_path):
            return

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            required_headers = {
                "Strict-Transport-Security": ["strict-transport-security", "hsts"],
                "X-Frame-Options": ["x-frame-options", "frame-options"],
                "X-Content-Type-Options": ["x-content-type-options", "nosniff"],
                "Content-Security-Policy": ["content-security-policy", "csp"],
                "X-XSS-Protection": ["x-xss-protection", "xss"],
                "Referrer-Policy": ["referrer-policy", "referrer"],
            }

            for header, patterns in required_headers.items():
                if not any(pattern in content.lower() for pattern in patterns):
                    self.issues.append(
                        {
                            "severity": "medium",
                            "type": "config",
                            "description": f"Missing {header} header in {file_path}",
                        }
                    )

        except Exception as e:
            logging.error(f"Error checking security headers in {file_path}: {str(e)}")

    def check_environment_files(self) -> None:
        """Check environment files for required security configurations."""
        required_configs = {
            "FLASK_DEBUG": "False",
            "FLASK_TESTING": "False",
            "SESSION_COOKIE_SECURE": "True",
            "SESSION_COOKIE_HTTPONLY": "True",
            "SESSION_COOKIE_SAMESITE": "Strict",
            "WTF_CSRF_ENABLED": "True",
            "WTF_CSRF_SSL_STRICT": "True",
            "SECURITY_HEADERS_ENABLED": "True",
            "DB_SSL_MODE": "verify-full",
            "MINIMUM_TLS_VERSION": "TLSv1.3",
            "SECURITY_MONITORING_ENABLED": "True",
            "UPLOAD_VIRUS_SCAN": "True",
            "JWT_BLACKLIST_ENABLED": "True",
            "PASSWORD_COMPLEXITY_CHECK": "True",
            "REQUIRE_2FA": "True",
        }

        env_files = [".env", ".env.production", ".env.development", ".env.test"]
        for env_file in env_files:
            env_path = self.root_dir / env_file
            if env_path.exists():
                content = self.read_file_safely(env_path)
                for config, _value in required_configs.items():
                    if config not in content:
                        self.issues.append(
                            {
                                "severity": "medium",
                                "type": "config",
                                "description": f"Missing required security configuration {config} in {env_file}",
                            }
                        )

    def run(self) -> None:
        """Run security checks."""
        try:
            logging.info("Starting security checks...")

            # Check dependencies
            self.check_dependencies()

            # Check secrets
            self.check_secrets()

            # Check configurations
            self.check_configurations()

            # Check file permissions
            self.check_file_permissions(self.root_dir)

            # Check security headers (skip cleanup directory)
            for root, _dirs, files in os.walk(self.root_dir):
                # Skip cleanup directory
                if "cleanup" in root:
                    continue

                for file in files:
                    full_path = Path(root) / file
                    if file.endswith((".py", ".js")):
                        self.check_security_headers(full_path)

            # Check environment files
            self.check_environment_files()

            # Generate report
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_file = self.report_dir / f"security_check_{timestamp}_summary.json"

            # Count issues by severity and type
            severity_counts = {"high": 0, "medium": 0, "low": 0}
            type_counts = {
                "config": {"high": 0, "medium": 0, "low": 0},
                "permission": {"high": 0, "medium": 0, "low": 0},
                "dependency": {"high": 0, "medium": 0, "low": 0},
                "secret": {"high": 0, "medium": 0, "low": 0},
                "system": {"high": 0, "medium": 0, "low": 0},
            }

            # Filter out cleanup-related issues
            filtered_issues = [
                issue
                for issue in self.issues
                if "cleanup" not in str(issue.get("description", "")).lower()
            ]

            for issue in filtered_issues:
                severity = issue["severity"]
                issue_type = issue["type"]
                severity_counts[severity] += 1
                if issue_type in type_counts:
                    type_counts[issue_type][severity] += 1

            total_issues = sum(severity_counts.values())

            # Print summary
            print("\nSecurity Check Summary:")
            print(f"Total issues found: {total_issues}\n")
            print("Issues by severity:")
            for severity, count in severity_counts.items():
                print(f"- {severity.capitalize()}: {count}")

            # Save detailed report
            report = {
                "timestamp": datetime.now().isoformat(),
                "total_issues": total_issues,
                "issues_by_severity": severity_counts,
                "issues_by_type": type_counts,
                "top_issues": (
                    filtered_issues[:10] if len(filtered_issues) > 10 else filtered_issues
                ),
                "execution_time": 0,  # Will be updated at the end
            }

            with open(report_file, "w") as f:
                json.dump(report, f, indent=2)

            print(f"\nDetailed report saved to: {report_file}")
            logging.info(f"Security checks completed in {report['execution_time']:.2f} seconds")

        except Exception as e:
            logging.error(f"Error running security checks: {str(e)}")
            sys.exit(1)


def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    checker = SecurityChecker(root_dir)
    checker.run()


if __name__ == "__main__":
    main()
