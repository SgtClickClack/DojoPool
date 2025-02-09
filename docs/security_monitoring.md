# DojoPool Security Monitoring System

## Overview
The DojoPool Security Monitoring System provides comprehensive security monitoring and alerting capabilities. It integrates with Prometheus, Grafana, and AlertManager to deliver real-time security insights and notifications.

## Components

### 1. Security Metrics Dashboard
Located at: `monitoring/grafana/dashboards/security_metrics.json`

Key Metrics:
- Total Active Vulnerabilities
- Security Scan Rate
- Vulnerabilities by Severity
- Security Compliance Score
- Security Issues by Type
- Latest Security Findings

### 2. Alert Rules
Located at: `monitoring/prometheus/rules/security_alerts.yml`

Critical Alerts:
- High Severity Vulnerabilities
- Critical Security Compliance Score
- Security Scan Failures
- Security Scan Delays
- Vulnerability Trend Increases

### 3. Notification System
Located at: `config/alertmanager/security_alerts.yml`

Notification Channels:
1. **Slack** (`#dojopool-security`)
   - High and Critical severity alerts
   - Real-time notifications with detailed context
   - Resolution status updates

2. **Email**
   - Warning and Medium severity alerts
   - Detailed HTML-formatted reports
   - Includes all relevant metrics and context

3. **PagerDuty**
   - Critical severity alerts only
   - Immediate incident creation
   - Automatic escalation paths

## Alert Severity Levels

1. **Critical**
   - Immediate action required
   - PagerDuty notification
   - SLA: 15 minutes

2. **High**
   - Urgent action required
   - Slack notification
   - SLA: 1 hour

3. **Warning**
   - Investigation required
   - Email notification
   - SLA: 24 hours

## Configuration

### Environment Variables
Required environment variables for notification setup:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_FROM=security@dojopool.com
SMTP_USER=security-alerts
SMTP_PASSWORD=secure-password
SECURITY_EMAIL_TO=security-team@dojopool.com
PAGERDUTY_SECURITY_KEY=your-pagerduty-key
```

### Alert Grouping
- Alerts are grouped by: alertname, severity, and security_check_type
- Group wait: 30s
- Group interval: 5m
- Repeat interval: 4h

### Inhibition Rules
- Critical severity alerts inhibit related warning alerts
- Prevents alert noise during major incidents

## Maintenance

### Daily Tasks
1. Monitor security dashboard
2. Review unresolved alerts
3. Verify notification channel health

### Weekly Tasks
1. Review alert patterns
2. Update thresholds if needed
3. Test notification channels

### Monthly Tasks
1. Review and update alert rules
2. Analyze long-term security trends
3. Update documentation as needed

## Troubleshooting

### Common Issues

1. Missing Alerts
   - Check Prometheus targets
   - Verify alert rules syntax
   - Check AlertManager status

2. Failed Notifications
   - Verify environment variables
   - Check notification channel credentials
   - Review AlertManager logs

3. Dashboard Issues
   - Check Grafana data source
   - Verify metrics collection
   - Review dashboard permissions

## Best Practices

1. Alert Response
   - Acknowledge alerts promptly
   - Document incident responses
   - Update runbooks as needed

2. Configuration Management
   - Version control all changes
   - Test changes in staging
   - Document configuration updates

3. Continuous Improvement
   - Regular review of alert thresholds
   - Update notification rules based on patterns
   - Maintain updated contact information 