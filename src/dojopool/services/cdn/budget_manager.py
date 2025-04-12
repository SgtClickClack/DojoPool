"""
CDN Budget Manager Module

This module provides services for managing CDN budgets and cost thresholds.
"""

from typing import Dict, Any, List, Optional
import os
import logging
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
from prometheus_client import Gauge, Counter

logger = logging.getLogger(__name__)

# Prometheus metrics
CDN_BUDGET = Gauge('cdn_budget_total', 'Total CDN budget in USD')
CDN_BUDGET_USAGE = Gauge('cdn_budget_usage', 'Current CDN budget usage in USD')
CDN_BUDGET_ALERTS = Counter('cdn_budget_alerts_total', 'Total number of budget alerts')

class CDNBudgetManager:
    """Service for managing CDN budgets and cost thresholds."""

    def __init__(self):
        """Initialize CDN budget manager with budget parameters."""
        self.budget_threshold = float(os.getenv('CDN_BUDGET_THRESHOLD', '1000'))  # $1000
        self.alert_threshold = float(os.getenv('CDN_ALERT_THRESHOLD', '0.8'))  # 80% of budget
        self.notification_channels = os.getenv('CDN_NOTIFICATION_CHANNELS', 'email,slack').split(',')
        self.alert_cooldown = int(os.getenv('CDN_ALERT_COOLDOWN', '3600'))  # 1 hour
        self.last_alert_time = None

    def set_budget(self, budget: float) -> None:
        """Set new budget threshold.
        
        Args:
            budget: New budget amount in USD
        """
        try:
            self.budget_threshold = budget
            CDN_BUDGET.set(budget)
            logger.info(f"CDN budget set to ${budget}")
        except Exception as e:
            logger.error(f"Error setting CDN budget: {str(e)}")

    def check_budget(self, costs: Dict[str, float]) -> Dict[str, Any]:
        """Check if costs are within budget.
        
        Args:
            costs: Current CDN costs
            
        Returns:
            Dictionary containing budget status and alerts
        """
        try:
            total_cost = costs.get('total_cost', 0)
            budget_usage = total_cost / self.budget_threshold
            
            # Update Prometheus metrics
            CDN_BUDGET_USAGE.set(total_cost)
            
            # Check if budget threshold is exceeded
            if budget_usage > 1.0:
                alert = self._trigger_alert('budget_exceeded', {
                    'current_cost': total_cost,
                    'budget': self.budget_threshold,
                    'usage_percentage': budget_usage * 100
                })
                return {
                    'status': 'exceeded',
                    'usage': budget_usage,
                    'alert': alert
                }
            
            # Check if alert threshold is reached
            if budget_usage >= self.alert_threshold:
                alert = self._trigger_alert('budget_warning', {
                    'current_cost': total_cost,
                    'budget': self.budget_threshold,
                    'usage_percentage': budget_usage * 100
                })
                return {
                    'status': 'warning',
                    'usage': budget_usage,
                    'alert': alert
                }
            
            return {
                'status': 'within_budget',
                'usage': budget_usage
            }
            
        except Exception as e:
            logger.error(f"Error checking CDN budget: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }

    def get_budget_history(self, days: int = 30) -> Dict[str, Any]:
        """Get budget usage history.
        
        Args:
            days: Number of days of history to retrieve
            
        Returns:
            Dictionary containing budget history
        """
        try:
            # Initialize AWS Cost Explorer client
            ce = boto3.client('ce')
            
            # Get costs for the specified period
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            response = ce.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date.strftime('%Y-%m-%d'),
                    'End': end_date.strftime('%Y-%m-%d')
                },
                Granularity='DAILY',
                Metrics=['UnblendedCost'],
                GroupBy=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}]
            )
            
            # Process cost data
            history = {
                'daily_costs': {},
                'total_cost': 0.0,
                'average_daily_cost': 0.0
            }
            
            daily_costs = []
            for result in response.get('ResultsByTime', []):
                date = result['TimePeriod']['Start']
                cost = float(result['Total']['UnblendedCost']['Amount'])
                history['daily_costs'][date] = cost
                daily_costs.append(cost)
            
            if daily_costs:
                history['total_cost'] = sum(daily_costs)
                history['average_daily_cost'] = sum(daily_costs) / len(daily_costs)
            
            return history
            
        except Exception as e:
            logger.error(f"Error getting budget history: {str(e)}")
            return {
                'error': str(e)
            }

    def _trigger_alert(self, alert_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger budget alert.
        
        Args:
            alert_type: Type of alert
            data: Alert data
            
        Returns:
            Dictionary containing alert details
        """
        try:
            # Check cooldown period
            current_time = datetime.utcnow()
            if (self.last_alert_time and 
                (current_time - self.last_alert_time).total_seconds() < self.alert_cooldown):
                return {
                    'status': 'cooldown',
                    'message': 'Alert cooldown period active'
                }
            
            # Increment alert counter
            CDN_BUDGET_ALERTS.inc()
            
            # Send notifications
            self._send_notifications(alert_type, data)
            
            # Update last alert time
            self.last_alert_time = current_time
            
            return {
                'status': 'sent',
                'type': alert_type,
                'data': data,
                'timestamp': current_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error triggering budget alert: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }

    def _send_notifications(self, alert_type: str, data: Dict[str, Any]) -> None:
        """Send notifications through configured channels.
        
        Args:
            alert_type: Type of alert
            data: Alert data
        """
        try:
            # Format alert message
            message = self._format_alert_message(alert_type, data)
            
            # Send through each configured channel
            for channel in self.notification_channels:
                if channel == 'email':
                    self._send_email_alert(message)
                elif channel == 'slack':
                    self._send_slack_alert(message)
                elif channel == 'sns':
                    self._send_sns_alert(message)
                    
        except Exception as e:
            logger.error(f"Error sending notifications: {str(e)}")

    def _format_alert_message(self, alert_type: str, data: Dict[str, Any]) -> str:
        """Format alert message.
        
        Args:
            alert_type: Type of alert
            data: Alert data
            
        Returns:
            Formatted alert message
        """
        if alert_type == 'budget_exceeded':
            return (
                f"CDN Budget Exceeded!\n"
                f"Current Cost: ${data['current_cost']:.2f}\n"
                f"Budget: ${data['budget']:.2f}\n"
                f"Usage: {data['usage_percentage']:.1f}%"
            )
        elif alert_type == 'budget_warning':
            return (
                f"CDN Budget Warning\n"
                f"Current Cost: ${data['current_cost']:.2f}\n"
                f"Budget: ${data['budget']:.2f}\n"
                f"Usage: {data['usage_percentage']:.1f}%"
            )
        return "Unknown alert type"

    def _send_email_alert(self, message: str) -> None:
        """Send email alert.
        
        Args:
            message: Alert message
        """
        try:
            # Implement email sending logic
            # This would typically use AWS SES or similar service
            logger.info(f"Sending email alert: {message}")
        except Exception as e:
            logger.error(f"Error sending email alert: {str(e)}")

    def _send_slack_alert(self, message: str) -> None:
        """Send Slack alert.
        
        Args:
            message: Alert message
        """
        try:
            # Implement Slack sending logic
            # This would typically use Slack API
            logger.info(f"Sending Slack alert: {message}")
        except Exception as e:
            logger.error(f"Error sending Slack alert: {str(e)}")

    def _send_sns_alert(self, message: str) -> None:
        """Send SNS alert.
        
        Args:
            message: Alert message
        """
        try:
            # Implement SNS sending logic
            # This would typically use AWS SNS
            logger.info(f"Sending SNS alert: {message}")
        except Exception as e:
            logger.error(f"Error sending SNS alert: {str(e)}") 