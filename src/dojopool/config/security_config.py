"""Security configuration for the application."""

import os
from datetime import timedelta
from typing import Dict, Optional

from pydantic import BaseModel, Field


class SecurityConfig(BaseModel):
    """Security configuration settings."""

    # Debug and Environment
    DEBUG: bool = Field(False, description="Debug mode flag")
    DEVELOPMENT: bool = Field(False, description="Development mode flag")
    
    # Secret Keys and Tokens
    SECRET_KEY: str = Field(
        ...,  # Required field
        description="Main application secret key - MUST be set in instance config"
    )
    TOKEN_KEYS_DIR: str = Field(
        "instance/keys",
        description="Directory to store token encryption keys"
    )
    TOKEN_KEY_ROTATION_INTERVAL: timedelta = Field(
        timedelta(days=1),
        description="How often to rotate token encryption keys"
    )
    
    # Token Expiration Times
    ACCESS_TOKEN_EXPIRY: timedelta = Field(
        timedelta(minutes=15),
        description="Access token expiration time"
    )
    REFRESH_TOKEN_EXPIRY: timedelta = Field(
        timedelta(days=7),
        description="Refresh token expiration time"
    )
    
    # Project Paths
    PROJECT_ROOT: str = Field(
        "src/dojopool",
        description="Root path of the project"
    )
    
    # Security Headers
    SECURE_HEADERS: Dict[str, str] = Field(
        {
            # Frame protection
            "X-Frame-Options": "DENY",
            
            # XSS protection
            "X-XSS-Protection": "1; mode=block",
            "X-Content-Type-Options": "nosniff",
            
            # HTTPS enforcement
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "img-src 'self' data: https: blob:; "
                "font-src 'self' https://fonts.gstatic.com; "
                "connect-src 'self' https: wss:; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-src 'self'; "
                "media-src 'self'; "
                "object-src 'none'; "
                "require-trusted-types-for 'script'; "
                "upgrade-insecure-requests;"
            ),
            
            # Referrer Policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Permissions Policy
            "Permissions-Policy": (
                "accelerometer=(), "
                "ambient-light-sensor=(), "
                "autoplay=(), "
                "battery=(), "
                "camera=(), "
                "clipboard-read=(), "
                "clipboard-write=(), "
                "cross-origin-isolated=(), "
                "display-capture=(), "
                "document-domain=(), "
                "encrypted-media=(), "
                "execution-while-not-rendered=(), "
                "execution-while-out-of-viewport=(), "
                "fullscreen=(), "
                "geolocation=(), "
                "gyroscope=(), "
                "keyboard-map=(), "
                "magnetometer=(), "
                "microphone=(), "
                "midi=(), "
                "navigation-override=(), "
                "payment=(), "
                "picture-in-picture=(), "
                "publickey-credentials-get=(), "
                "screen-wake-lock=(), "
                "sync-xhr=(), "
                "usb=(), "
                "web-share=(), "
                "xr-spatial-tracking=()"
            ),
            
            # Cross-Origin headers
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-origin",
            
            # Additional security headers
            "X-Permitted-Cross-Domain-Policies": "none",
            "X-Download-Options": "noopen",
            "X-DNS-Prefetch-Control": "off",
            "Server": "DojoPool",  # Hide server details
            "Access-Control-Allow-Credentials": "true"
        },
        description="Security headers for HTTP responses"
    )
    
    # CSRF Protection
    CSRF_ENABLED: bool = Field(True, description="Enable CSRF protection")
    CSRF_SECRET_KEY: Optional[str] = Field(
        None,
        description="Secret key for CSRF tokens - defaults to SECRET_KEY if not set"
    )
    
    # Session Security
    SESSION_COOKIE_SECURE: bool = Field(True, description="Secure session cookie")
    SESSION_COOKIE_HTTPONLY: bool = Field(True, description="HTTPOnly session cookie")
    SESSION_COOKIE_SAMESITE: str = Field("Lax", description="SameSite session cookie policy")
    PERMANENT_SESSION_LIFETIME: timedelta = Field(
        timedelta(days=1),
        description="Session lifetime"
    )
    
    # Vulnerability Scanning
    VULNERABILITY_SCAN_SCHEDULE: str = Field(
        "0 */6 * * *",  # Every 6 hours
        description="Cron schedule for vulnerability scans"
    )
    VULNERABILITY_SCAN_PATHS: list[str] = Field(
        ["src", "tests"],
        description="Paths to scan for vulnerabilities"
    )
    VULNERABILITY_SCAN_EXCLUDE: list[str] = Field(
        [
            "tests/fixtures",
            "node_modules",
            "**/*.pyc",
            "**/__pycache__",
            ".git",
            ".env",
            "*.log"
        ],
        description="Paths to exclude from vulnerability scans"
    )
    
    # Vulnerability Thresholds
    SEVERITY_THRESHOLDS: Dict[str, Dict[str, int]] = Field(
        {
            "dependency": {
                "critical": 0,  # Block on any critical
                "high": 0,      # Block on any high
                "moderate": 3,  # Allow up to 3 moderate
                "low": 5        # Allow up to 5 low
            },
            "code": {
                "critical": 0,
                "high": 0,
                "moderate": 2,
                "low": 3
            },
            "configuration": {
                "critical": 0,
                "high": 0,
                "moderate": 1,
                "low": 2
            }
        },
        description="Severity thresholds for different types of vulnerabilities"
    )
    
    # Notification Settings
    VULNERABILITY_NOTIFICATIONS: Dict[str, bool] = Field(
        {
            "email": True,
            "slack": True,
            "sms": True
        },
        description="Notification channels for vulnerability alerts"
    )
    
    # Rate Limiting
    MAX_SCANS_PER_HOUR: int = Field(
        4,
        description="Maximum number of vulnerability scans per hour"
    )
    SCAN_COOLDOWN_MINUTES: int = Field(
        15,
        description="Minutes to wait between vulnerability scans"
    )
    
    class Config:
        """Pydantic model configuration."""
        
        validate_assignment = True
        
    def __init__(self, **data):
        """Initialize security configuration."""
        super().__init__(**data)
        
        # Ensure CSRF secret key is set
        if not self.CSRF_SECRET_KEY:
            self.CSRF_SECRET_KEY = self.SECRET_KEY
            
        # Create token keys directory if it doesn't exist
        if not os.path.exists(self.TOKEN_KEYS_DIR):
            os.makedirs(self.TOKEN_KEYS_DIR, mode=0o700)
            
    def validate_configuration(self) -> bool:
        """Validate the security configuration.
        
        Returns:
            bool: True if configuration is valid
        """
        # Secret key must be set and sufficiently long
        if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
            return False
            
        # Ensure token expiration times are reasonable
        if self.ACCESS_TOKEN_EXPIRY > timedelta(hours=1):
            return False
        if self.REFRESH_TOKEN_EXPIRY > timedelta(days=30):
            return False
            
        # Validate security headers
        required_headers = {
            "X-Frame-Options",
            "X-XSS-Protection",
            "X-Content-Type-Options",
            "Strict-Transport-Security",
            "Content-Security-Policy"
        }
        if not all(header in self.SECURE_HEADERS for header in required_headers):
            return False
            
        return True
