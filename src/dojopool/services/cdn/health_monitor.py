"""
CDN Health Monitoring Service Module

This module provides services for monitoring CDN health and performance.
"""

from typing import Dict, Any, List, Optional
import os
import logging
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
from prometheus_client import Counter, Gauge, Histogram
from ..cache.decorators import cached
from .image_cdn import ImageCDNService
from .failover import CDNFailoverService

logger = logging.getLogger(__name__)

# Prometheus metrics
CDN_LATENCY = Histogram('cdn_latency_seconds', 'CDN request latency in seconds')
CDN_ERRORS = Counter('cdn_errors_total', 'Total number of CDN errors')
CDN_CACHE_HITS = Counter('cdn_cache_hits_total', 'Total number of CDN cache hits')
CDN_CACHE_MISSES = Counter('cdn_cache_misses_total', 'Total number of CDN cache misses')
CDN_BANDWIDTH = Gauge('cdn_bandwidth_bytes', 'Current CDN bandwidth usage in bytes')
CDN_HEALTH = Gauge('cdn_health_status', 'CDN health status (1=healthy, 0=unhealthy)')

class CDNHealthMonitor:
    """Service for monitoring CDN health and performance."""

    def __init__(self):
        """Initialize CDN health monitor with monitoring thresholds."""
        self.failover_service = CDNFailoverService()
        self.health_check_interval = int(os.getenv('CDN_HEALTH_CHECK_INTERVAL', '300'))  # 5 minutes
        self.latency_threshold = float(os.getenv('CDN_LATENCY_THRESHOLD', '0.2'))  # 200ms
        self.error_rate_threshold = float(os.getenv('CDN_ERROR_RATE_THRESHOLD', '0.05'))  # 5%
        self.cache_hit_threshold = float(os.getenv('CDN_CACHE_HIT_THRESHOLD', '0.95'))  # 95%

    def check_cdn_health(self, cdn: ImageCDNService) -> Dict[str, Any]:
        """Check CDN health status and performance metrics.
        
        Args:
            cdn: CDN service instance to check
            
        Returns:
            Dictionary containing health check results
        """
        try:
            metrics = cdn.get_cdn_metrics()
            
            # Update Prometheus metrics
            CDN_LATENCY.observe(metrics.get('average_latency', 0) / 1000)
            CDN_ERRORS.inc(metrics.get('error_count', 0))
            CDN_CACHE_HITS.inc(metrics.get('cache_hits', 0))
            CDN_CACHE_MISSES.inc(metrics.get('cache_misses', 0))
            CDN_BANDWIDTH.set(metrics.get('bandwidth_usage', 0))
            
            # Calculate health status
            is_healthy = (
                metrics.get('average_latency', float('inf')) < self.latency_threshold * 1000 and
                metrics.get('error_rate', 1) < self.error_rate_threshold and
                metrics.get('cache_hit_rate', 0) > self.cache_hit_threshold
            )
            
            CDN_HEALTH.set(1 if is_healthy else 0)
            
            return {
                'healthy': is_healthy,
                'metrics': metrics,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error checking CDN health: {str(e)}")
            CDN_HEALTH.set(0)
            return {
                'healthy': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

    def monitor_all_cdns(self) -> Dict[str, Any]:
        """Monitor health of all CDNs (primary and backup).
        
        Returns:
            Dictionary containing monitoring results for all CDNs
        """
        results = {
            'primary': self.check_cdn_health(self.failover_service.primary_cdn),
            'backups': []
        }
        
        for backup_cdn in self.failover_service.backup_cdns:
            results['backups'].append(self.check_cdn_health(backup_cdn))
            
        return results

    @staticmethod
    @cached("cdn_health_metrics", expire=timedelta(minutes=5))
    def get_health_metrics() -> Dict[str, Any]:
        """Get CDN health metrics.
        
        Returns:
            Dictionary containing health metrics
        """
        return {
            'total_checks': 0,
            'failed_checks': 0,
            'last_check_time': None,
            'average_latency': 0,
            'error_rate': 0,
            'cache_hit_rate': 0
        }

    def generate_health_report(self) -> Dict[str, Any]:
        """Generate comprehensive CDN health report.
        
        Returns:
            Dictionary containing health report
        """
        monitoring_results = self.monitor_all_cdns()
        health_metrics = self.get_health_metrics()
        
        return {
            'monitoring_results': monitoring_results,
            'health_metrics': health_metrics,
            'timestamp': datetime.utcnow().isoformat()
        } 