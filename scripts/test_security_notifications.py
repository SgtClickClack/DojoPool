#!/usr/bin/env python3
"""Test script for security notification channels."""

import os
import sys
import json
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def test_slack_notification():
    """Test Slack notification channel."""
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    if not webhook_url:
        print("❌ SLACK_WEBHOOK_URL not set")
        return False

    payload = {
        "attachments": [{
            "color": "#36a64f",
            "title": "[TEST] Security Notification System",
            "text": "This is a test notification from the DojoPool security monitoring system.",
            "fields": [
                {
                    "title": "Environment",
                    "value": "Testing",
                    "short": True
                },
                {
                    "title": "Status",
                    "value": "Operational",
                    "short": True
                }
            ],
            "footer": f"Test performed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }]
    }

    try:
        response = requests.post(webhook_url, json=payload)
        response.raise_for_status()
        print("✅ Slack notification sent successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to send Slack notification: {str(e)}")
        return False

def test_email_notification():
    """Test email notification channel."""
    required_vars = [
        'SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM', 
        'SMTP_USER', 'SMTP_PASSWORD', 'SECURITY_EMAIL_TO'
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False

    msg = MIMEMultipart()
    msg['Subject'] = '[TEST] DojoPool Security Notification'
    msg['From'] = os.getenv('SMTP_FROM')
    msg['To'] = os.getenv('SECURITY_EMAIL_TO')

    html = """
    <h2>Security Notification System Test</h2>
    <p>This is a test email from the DojoPool security monitoring system.</p>
    <ul>
        <li><strong>Environment:</strong> Testing</li>
        <li><strong>Status:</strong> Operational</li>
        <li><strong>Time:</strong> {time}</li>
    </ul>
    """.format(time=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP(os.getenv('SMTP_HOST'), int(os.getenv('SMTP_PORT'))) as server:
            server.starttls()
            server.login(os.getenv('SMTP_USER'), os.getenv('SMTP_PASSWORD'))
            server.send_message(msg)
        print("✅ Email notification sent successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to send email notification: {str(e)}")
        return False

def test_pagerduty_notification():
    """Test PagerDuty notification channel."""
    routing_key = os.getenv('PAGERDUTY_SECURITY_KEY')
    if not routing_key:
        print("❌ PAGERDUTY_SECURITY_KEY not set")
        return False

    payload = {
        "routing_key": routing_key,
        "event_action": "trigger",
        "payload": {
            "summary": "[TEST] Security Notification System Test",
            "severity": "info",
            "source": "Security Monitoring System",
            "component": "Notification Test",
            "custom_details": {
                "environment": "Testing",
                "status": "Operational",
                "time": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        }
    }

    try:
        response = requests.post(
            'https://events.pagerduty.com/v2/enqueue',
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        print("✅ PagerDuty notification sent successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to send PagerDuty notification: {str(e)}")
        return False

def main():
    """Main function to test all notification channels."""
    print("🔔 Testing Security Notification Channels")
    print("-" * 50)

    results = {
        "Slack": test_slack_notification(),
        "Email": test_email_notification(),
        "PagerDuty": test_pagerduty_notification()
    }

    print("\n📊 Test Results Summary")
    print("-" * 50)
    for channel, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{channel}: {status}")

    if not all(results.values()):
        sys.exit(1)

if __name__ == "__main__":
    main() 