"""Security notification service for handling critical security alerts."""

import logging
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List, Optional, Union

from jinja2 import Environment, FileSystemLoader, select_autoescape


class SecurityNotificationService:
    """Service for handling security notifications."""

    def __init__(self):
        """Initialize the notification service."""
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.sender_email = os.getenv("SECURITY_EMAIL_FROM", "security@dojopool.com")
        self.recipient_emails = os.getenv("SECURITY_EMAIL_TO", "").split(",")

        # Configure Jinja2 for email templates
        self.template_env = Environment(
            loader=FileSystemLoader("src/dojopool/templates/email"),
            autoescape=select_autoescape(["html", "xml"]),
        )

        # Configure logging
        self.logger = logging.getLogger(__name__)

    def send_critical_alert(
        self,
        title: str,
        description: str,
        severity: str,
        details: Optional[Dict] = None,
    ) -> bool:
        """Send a critical security alert.

        Args:
            title: Alert title
            description: Alert description
            severity: Alert severity level
            details: Optional additional details

        Returns:
            bool: True if sent successfully
        """
        template = self.template_env.get_template("security_alert.html")

        # Prepare email content
        html_content = template.render(
            title=title,
            description=description,
            severity=severity,
            details=details or {},
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            environment=os.getenv("FLASK_ENV", "production"),
        )

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[SECURITY ALERT] {severity.upper()}: {title}"
        msg["From"] = self.sender_email
        msg["To"] = ", ".join(self.recipient_emails)

        # Attach HTML content
        msg.attach(MIMEText(html_content, "html"))

        try:
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            self.logger.info(f"Security alert sent: {title}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send security alert: {str(e)}")
            return False

    def send_vulnerability_report(
        self, vulnerabilities: List[Dict], scan_summary: Dict
    ) -> bool:
        """Send a vulnerability scan report.

        Args:
            vulnerabilities: List of found vulnerabilities
            scan_summary: Summary of the scan results

        Returns:
            bool: True if sent successfully
        """
        template = self.template_env.get_template("vulnerability_report.html")

        # Prepare email content
        html_content = template.render(
            vulnerabilities=vulnerabilities,
            summary=scan_summary,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            environment=os.getenv("FLASK_ENV", "production"),
        )

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = (
            f'Security Vulnerability Report - {scan_summary.get("total_issues", 0)} Issues Found'
        )
        msg["From"] = self.sender_email
        msg["To"] = ", ".join(self.recipient_emails)

        # Attach HTML content
        msg.attach(MIMEText(html_content, "html"))

        try:
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            self.logger.info("Vulnerability report sent successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send vulnerability report: {str(e)}")
            return False

    def send_compliance_alert(
        self, score: float, failed_checks: List[Dict], summary: Dict
    ) -> bool:
        """Send a compliance score alert.

        Args:
            score: Current compliance score
            failed_checks: List of failed compliance checks
            summary: Compliance check summary

        Returns:
            bool: True if sent successfully
        """
        template = self.template_env.get_template("compliance_alert.html")

        # Prepare email content
        html_content = template.render(
            score=score,
            failed_checks=failed_checks,
            summary=summary,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            environment=os.getenv("FLASK_ENV", "production"),
        )

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Security Compliance Alert - Score: {score:.1f}%"
        msg["From"] = self.sender_email
        msg["To"] = ", ".join(self.recipient_emails)

        # Attach HTML content
        msg.attach(MIMEText(html_content, "html"))

        try:
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            self.logger.info(f"Compliance alert sent - Score: {score:.1f}%")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send compliance alert: {str(e)}")
            return False

    def send_security_digest(
        self,
        period: str,
        metrics: Dict,
        incidents: List[Dict],
        recommendations: List[str],
    ) -> bool:
        """Send a security digest email.

        Args:
            period: Time period covered (e.g., 'daily', 'weekly')
            metrics: Security metrics for the period
            incidents: Security incidents during the period
            recommendations: Security recommendations

        Returns:
            bool: True if sent successfully
        """
        template = self.template_env.get_template("security_digest.html")

        # Prepare email content
        html_content = template.render(
            period=period,
            metrics=metrics,
            incidents=incidents,
            recommendations=recommendations,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            environment=os.getenv("FLASK_ENV", "production"),
        )

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Security Digest - {period.title()} Report"
        msg["From"] = self.sender_email
        msg["To"] = ", ".join(self.recipient_emails)

        # Attach HTML content
        msg.attach(MIMEText(html_content, "html"))

        try:
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            self.logger.info(f"Security digest sent for period: {period}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send security digest: {str(e)}")
            return False
