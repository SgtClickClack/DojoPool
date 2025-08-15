"""
CDN Analytics Service Module

This module provides services for tracking and analyzing CDN performance and usage patterns.
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
from .health_monitor import CDNHealthMonitor

logger = logging.getLogger(__name__)

# Prometheus metrics
CDN_REQUESTS = Counter('cdn_requests_total', 'Total number of CDN requests')
CDN_BANDWIDTH = Gauge('cdn_bandwidth_bytes', 'Current CDN bandwidth usage in bytes')
CDN_ERRORS = Counter('cdn_errors_total', 'Total number of CDN errors')
CDN_LATENCY = Histogram('cdn_latency_seconds', 'CDN request latency in seconds')
CDN_CACHE_HITS = Counter('cdn_cache_hits_total', 'Total number of CDN cache hits')
CDN_CACHE_MISSES = Counter('cdn_cache_misses_total', 'Total number of CDN cache misses')

class CDNAnalytics:
    """Service for tracking and analyzing CDN performance and usage patterns."""

    def __init__(self):
        """Initialize CDN analytics with tracking parameters."""
        self.health_monitor = CDNHealthMonitor()
        self.retention_period = int(os.getenv('CDN_ANALYTICS_RETENTION', '30'))  # 30 days
        self.aggregation_interval = int(os.getenv('CDN_ANALYTICS_INTERVAL', '3600'))  # 1 hour

    def track_request(self, request_data: Dict[str, Any]) -> None:
        """Track CDN request data.
        
        Args:
            request_data: Dictionary containing request information
        """
        try:
            # Update Prometheus metrics
            CDN_REQUESTS.inc()
            CDN_BANDWIDTH.set(request_data.get('bandwidth', 0))
            CDN_LATENCY.observe(request_data.get('latency', 0))
            
            if request_data.get('error'):
                CDN_ERRORS.inc()
            else:
                if request_data.get('cache_hit'):
                    CDN_CACHE_HITS.inc()
                else:
                    CDN_CACHE_MISSES.inc()
            
            # Store request data for analysis
            self._store_request_data(request_data)
        except Exception as e:
            logger.error(f"Error tracking CDN request: {str(e)}")

    def analyze_performance(self, time_range: Optional[timedelta] = None) -> Dict[str, Any]:
        """Analyze CDN performance metrics.
        
        Args:
            time_range: Optional time range for analysis
            
        Returns:
            Dictionary containing performance analysis
        """
        try:
            if time_range is None:
                time_range = timedelta(days=self.retention_period)
            
            # Get request data for time range
            request_data = self._get_request_data(time_range)
            
            # Calculate performance metrics
            metrics = {
                'total_requests': len(request_data),
                'error_rate': self._calculate_error_rate(request_data),
                'average_latency': self._calculate_average_latency(request_data),
                'cache_hit_rate': self._calculate_cache_hit_rate(request_data),
                'bandwidth_usage': self._calculate_bandwidth_usage(request_data),
                'content_type_distribution': self._analyze_content_types(request_data),
                'geographic_distribution': self._analyze_geographic_distribution(request_data),
                'hourly_distribution': self._analyze_hourly_distribution(request_data)
            }
            
            return {
                'metrics': metrics,
                'time_range': str(time_range),
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error analyzing CDN performance: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

    def generate_analytics_report(self) -> Dict[str, Any]:
        """Generate comprehensive CDN analytics report.
        
        Returns:
            Dictionary containing analytics report
        """
        try:
            # Get performance analysis
            performance = self.analyze_performance()
            
            # Get health status
            health = self.health_monitor.check_cdn_health(
                self.health_monitor.failover_service.primary_cdn
            )
            
            # Get cost analysis
            cost = self._analyze_costs()
            
            return {
                'performance': performance,
                'health': health,
                'cost': cost,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error generating analytics report: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

    def _store_request_data(self, request_data: Dict[str, Any]) -> None:
        """Store request data for analysis."""
        try:
            # Add timestamp if not present
            if 'timestamp' not in request_data:
                request_data['timestamp'] = datetime.utcnow().isoformat()
            
            # Store in database or cache
            # Implementation depends on storage backend
            pass
        except Exception as e:
            logger.error(f"Error storing request data: {str(e)}")

    def _get_request_data(self, time_range: timedelta) -> List[Dict[str, Any]]:
        """Get request data for specified time range."""
        try:
            # Retrieve from database or cache
            # Implementation depends on storage backend
            return []
        except Exception as e:
            logger.error(f"Error getting request data: {str(e)}")
            return []

    def _calculate_error_rate(self, request_data: List[Dict[str, Any]]) -> float:
        """Calculate error rate from request data."""
        try:
            if not request_data:
                return 0.0
            error_count = sum(1 for req in request_data if req.get('error'))
            return error_count / len(request_data)
        except Exception as e:
            logger.error(f"Error calculating error rate: {str(e)}")
            return 0.0

    def _calculate_average_latency(self, request_data: List[Dict[str, Any]]) -> float:
        """Calculate average latency from request data."""
        try:
            if not request_data:
                return 0.0
            latencies = [req.get('latency', 0) for req in request_data]
            return sum(latencies) / len(latencies)
        except Exception as e:
            logger.error(f"Error calculating average latency: {str(e)}")
            return 0.0

    def _calculate_cache_hit_rate(self, request_data: List[Dict[str, Any]]) -> float:
        """Calculate cache hit rate from request data."""
        try:
            if not request_data:
                return 0.0
            hit_count = sum(1 for req in request_data if req.get('cache_hit'))
            return hit_count / len(request_data)
        except Exception as e:
            logger.error(f"Error calculating cache hit rate: {str(e)}")
            return 0.0

    def _calculate_bandwidth_usage(self, request_data: List[Dict[str, Any]]) -> int:
        """Calculate total bandwidth usage from request data."""
        try:
            return sum(req.get('bandwidth', 0) for req in request_data)
        except Exception as e:
            logger.error(f"Error calculating bandwidth usage: {str(e)}")
            return 0

    def _analyze_content_types(self, request_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Analyze content type distribution."""
        try:
            content_types = {}
            for req in request_data:
                content_type = req.get('content_type', 'unknown')
                content_types[content_type] = content_types.get(content_type, 0) + 1
            return content_types
        except Exception as e:
            logger.error(f"Error analyzing content types: {str(e)}")
            return {}

    def _analyze_geographic_distribution(self, request_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Analyze geographic distribution of requests."""
        try:
            locations = {}
            for req in request_data:
                location = req.get('location', 'unknown')
                locations[location] = locations.get(location, 0) + 1
            return locations
        except Exception as e:
            logger.error(f"Error analyzing geographic distribution: {str(e)}")
            return {}

    def _analyze_hourly_distribution(self, request_data: List[Dict[str, Any]]) -> Dict[int, int]:
        """Analyze hourly distribution of requests."""
        try:
            hourly = {}
            for req in request_data:
                timestamp = datetime.fromisoformat(req.get('timestamp', datetime.utcnow().isoformat()))
                hour = timestamp.hour
                hourly[hour] = hourly.get(hour, 0) + 1
            return hourly
        except Exception as e:
            logger.error(f"Error analyzing hourly distribution: {str(e)}")
            return {}

    def _analyze_costs(self) -> Dict[str, Any]:
        """Analyze CDN costs."""
        try:
            # Implement cost analysis logic
            # This would typically integrate with AWS Cost Explorer or similar
            return {
                'total_cost': 0,
                'bandwidth_cost': 0,
                'request_cost': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error analyzing costs: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            } 