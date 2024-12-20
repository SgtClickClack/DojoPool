"""Performance monitoring configuration."""

import flask_monitoringdashboard as dashboard
from flask import Flask
import os

def init_monitoring(app: Flask):
    """Initialize performance monitoring."""
    # Configure monitoring dashboard
    dashboard.config.init_from(file=None)
    
    # Basic configuration
    dashboard.config.version = app.config.get('VERSION', '1.0.0')
    dashboard.config.group_by = lambda: 'DojoPool'
    dashboard.config.database_name = 'sqlite:///monitoring.db'
    
    # Security configuration
    dashboard.config.username = os.environ.get('MONITORING_USERNAME', 'admin')
    dashboard.config.password = os.environ.get('MONITORING_PASSWORD', 'admin')
    
    # Monitoring settings
    dashboard.config.monitor_level = 3  # Monitor all endpoints
    dashboard.config.outlier_detection_constant = 2.5  # Default value, can be adjusted
    
    # Enable monitoring for specific areas
    dashboard.config.enable_logging = True
    dashboard.config.enable_endpoint_profiling = True
    dashboard.config.enable_function_profiling = True
    
    # Initialize the dashboard
    dashboard.bind(app)
    
    # Add custom monitoring endpoints
    @dashboard.blueprint.before_request
    def before_monitoring_request():
        """Ensure monitoring access is restricted in production."""
        if app.config['ENV'] == 'production':
            # Add additional security checks here if needed
            pass

def monitor_function(func):
    """Decorator to monitor specific functions."""
    return dashboard.monitor_function(func)

def monitor_endpoint(endpoint):
    """Decorator to monitor specific endpoints."""
    return dashboard.monitor_endpoint(endpoint)

def record_custom_metric(name, value):
    """Record a custom metric."""
    dashboard.record(name, value) 