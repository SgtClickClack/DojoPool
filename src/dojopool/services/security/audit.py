import os
import re
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from ..models import User, Session
from ..extensions import db

class SecurityAuditService:
    """Service for performing security audits."""

    @staticmethod
    def check_password_strength(password: str) -> Tuple[bool, List[str]]:
        """Check password strength against security requirements.
        
        Args:
            password: Password to check
            
        Returns:
            Tuple of (is_strong, issues)
        """
        issues = []
        
        # Length check
        if len(password) < 12:
            issues.append("Password must be at least 12 characters long")
            
        # Complexity checks
        if not re.search(r"[A-Z]", password):
            issues.append("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", password):
            issues.append("Password must contain at least one lowercase letter")
        if not re.search(r"\d", password):
            issues.append("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            issues.append("Password must contain at least one special character")
            
        # Common password check
        common_passwords = [
            "password123", "12345678", "qwerty123", "admin123",
            "letmein123", "welcome123", "monkey123", "football123"
        ]
        if password.lower() in common_passwords:
            issues.append("Password is too common")
            
        return len(issues) == 0, issues

    @staticmethod
    def check_session_security(user_id: int) -> Tuple[bool, List[str]]:
        """Check session security for a user.
        
        Args:
            user_id: User ID to check
            
        Returns:
            Tuple of (is_secure, issues)
        """
        issues = []
        
        # Get all active sessions
        sessions = Session.query.filter_by(
            user_id=user_id,
            is_active=True
        ).all()
        
        # Check number of active sessions
        if len(sessions) > 5:
            issues.append(f"User has {len(sessions)} active sessions (max 5)")
            
        # Check for suspicious IP changes
        ip_addresses = set(s.ip_address for s in sessions)
        if len(ip_addresses) > 3:
            issues.append("Multiple IP addresses detected")
            
        # Check for long-running sessions
        for session in sessions:
            if (datetime.utcnow() - session.created_at).days > 30:
                issues.append("Long-running session detected")
                
        return len(issues) == 0, issues

    @staticmethod
    def check_2fa_status(user_id: int) -> Tuple[bool, List[str]]:
        """Check 2FA status for a user.
        
        Args:
            user_id: User ID to check
            
        Returns:
            Tuple of (is_secure, issues)
        """
        issues = []
        
        user = User.query.get(user_id)
        if not user:
            return False, ["User not found"]
            
        if not user.two_factor_enabled:
            issues.append("Two-factor authentication not enabled")
            
        if not user.backup_codes:
            issues.append("No backup codes available")
            
        return len(issues) == 0, issues

    @staticmethod
    def check_email_verification(user_id: int) -> Tuple[bool, List[str]]:
        """Check email verification status for a user.
        
        Args:
            user_id: User ID to check
            
        Returns:
            Tuple of (is_secure, issues)
        """
        issues = []
        
        user = User.query.get(user_id)
        if not user:
            return False, ["User not found"]
            
        if not user.email_verified:
            issues.append("Email not verified")
            
        return len(issues) == 0, issues

    @staticmethod
    def check_account_security(user_id: int) -> Dict[str, Any]:
        """Perform comprehensive security check for a user account.
        
        Args:
            user_id: User ID to check
            
        Returns:
            Dictionary containing security check results
        """
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "checks": {},
            "overall_status": "secure",
            "issues": []
        }
        
        # Password strength check
        user = User.query.get(user_id)
        if user:
            is_strong, issues = SecurityAuditService.check_password_strength(user.password)
            results["checks"]["password_strength"] = {
                "status": "secure" if is_strong else "insecure",
                "issues": issues
            }
            results["issues"].extend(issues)
            
        # Session security check
        is_secure, issues = SecurityAuditService.check_session_security(user_id)
        results["checks"]["session_security"] = {
            "status": "secure" if is_secure else "insecure",
            "issues": issues
        }
        results["issues"].extend(issues)
        
        # 2FA check
        is_secure, issues = SecurityAuditService.check_2fa_status(user_id)
        results["checks"]["2fa_status"] = {
            "status": "secure" if is_secure else "insecure",
            "issues": issues
        }
        results["issues"].extend(issues)
        
        # Email verification check
        is_secure, issues = SecurityAuditService.check_email_verification(user_id)
        results["checks"]["email_verification"] = {
            "status": "secure" if is_secure else "insecure",
            "issues": issues
        }
        results["issues"].extend(issues)
        
        # Determine overall status
        if len(results["issues"]) > 0:
            results["overall_status"] = "insecure"
            
        return results

    @staticmethod
    def generate_security_report(user_id: int) -> str:
        """Generate a detailed security report for a user.
        
        Args:
            user_id: User ID to generate report for
            
        Returns:
            JSON string containing the security report
        """
        results = SecurityAuditService.check_account_security(user_id)
        return json.dumps(results, indent=2) 