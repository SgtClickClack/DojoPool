"""
CDN Cache Optimization Service Module

This module provides services for optimizing CDN caching strategies.
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
CACHE_HIT_RATE = Gauge('cdn_cache_hit_rate', 'CDN cache hit rate')
CACHE_MISS_RATE = Gauge('cdn_cache_miss_rate', 'CDN cache miss rate')
CACHE_INVALIDATION_TIME = Histogram('cdn_cache_invalidation_seconds', 'Cache invalidation time in seconds')
CACHE_OPTIMIZATION_TIME = Histogram('cdn_cache_optimization_seconds', 'Cache optimization time in seconds')

class CDNCacheOptimizer:
    """Service for optimizing CDN caching strategies."""

    def __init__(self):
        """Initialize CDN cache optimizer with optimization parameters."""
        self.health_monitor = CDNHealthMonitor()
        self.cache_ttl = int(os.getenv('CDN_CACHE_TTL', '86400'))  # 24 hours
        self.min_hit_rate = float(os.getenv('CDN_MIN_HIT_RATE', '0.95'))  # 95%
        self.max_miss_rate = float(os.getenv('CDN_MAX_MISS_RATE', '0.05'))  # 5%
        self.optimization_interval = int(os.getenv('CDN_OPTIMIZATION_INTERVAL', '3600'))  # 1 hour

    def optimize_cache_strategy(self, cdn: ImageCDNService) -> Dict[str, Any]:
        """Optimize cache strategy based on performance metrics.
        
        Args:
            cdn: CDN service instance to optimize
            
        Returns:
            Dictionary containing optimization results
        """
        try:
            start_time = datetime.utcnow()
            metrics = cdn.get_cdn_metrics()
            
            # Calculate current cache performance
            hit_rate = metrics.get('cache_hit_rate', 0)
            miss_rate = metrics.get('cache_miss_rate', 1)
            
            # Update Prometheus metrics
            CACHE_HIT_RATE.set(hit_rate)
            CACHE_MISS_RATE.set(miss_rate)
            
            # Determine if optimization is needed
            needs_optimization = (
                hit_rate < self.min_hit_rate or
                miss_rate > self.max_miss_rate
            )
            
            if needs_optimization:
                # Adjust cache TTL based on content type
                self._optimize_cache_ttl(cdn)
                
                # Update cache headers
                self._update_cache_headers(cdn)
                
                # Optimize cache keys
                self._optimize_cache_keys(cdn)
                
                # Invalidate stale cache entries
                self._invalidate_stale_cache(cdn)
            
            optimization_time = (datetime.utcnow() - start_time).total_seconds()
            CACHE_OPTIMIZATION_TIME.observe(optimization_time)
            
            return {
                'optimized': needs_optimization,
                'hit_rate': hit_rate,
                'miss_rate': miss_rate,
                'optimization_time': optimization_time,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error optimizing cache strategy: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

    def _optimize_cache_ttl(self, cdn: ImageCDNService) -> None:
        """Optimize cache TTL based on content type and access patterns."""
        try:
            # Get content type distribution
            content_types = cdn.get_content_type_distribution()
            
            # Adjust TTL for each content type
            for content_type, count in content_types.items():
                if content_type.startswith('image/'):
                    # Longer TTL for images
                    cdn.set_cache_ttl(content_type, self.cache_ttl * 2)
                elif content_type.startswith('video/'):
                    # Medium TTL for videos
                    cdn.set_cache_ttl(content_type, self.cache_ttl)
                else:
                    # Shorter TTL for other content
                    cdn.set_cache_ttl(content_type, self.cache_ttl // 2)
        except Exception as e:
            logger.error(f"Error optimizing cache TTL: {str(e)}")

    def _update_cache_headers(self, cdn: ImageCDNService) -> None:
        """Update cache headers for better caching behavior."""
        try:
            # Set cache control headers
            cdn.set_cache_control('public, max-age=86400, stale-while-revalidate=3600')
            
            # Set vary headers for responsive images
            cdn.set_vary_header('Accept, Accept-Encoding')
        except Exception as e:
            logger.error(f"Error updating cache headers: {str(e)}")

    def _optimize_cache_keys(self, cdn: ImageCDNService) -> None:
        """Optimize cache keys for better cache utilization."""
        try:
            # Get cache key patterns
            key_patterns = cdn.get_cache_key_patterns()
            
            # Optimize each pattern
            for pattern in key_patterns:
                if pattern.startswith('image/'):
                    # Include image dimensions in cache key
                    cdn.update_cache_key_pattern(pattern, include_dimensions=True)
                elif pattern.startswith('video/'):
                    # Include video quality in cache key
                    cdn.update_cache_key_pattern(pattern, include_quality=True)
        except Exception as e:
            logger.error(f"Error optimizing cache keys: {str(e)}")

    def _invalidate_stale_cache(self, cdn: ImageCDNService) -> None:
        """Invalidate stale cache entries."""
        try:
            start_time = datetime.utcnow()
            
            # Get stale objects
            stale_objects = cdn.get_stale_objects()
            
            # Invalidate stale objects
            for obj in stale_objects:
                cdn.invalidate_cache(obj['key'])
            
            invalidation_time = (datetime.utcnow() - start_time).total_seconds()
            CACHE_INVALIDATION_TIME.observe(invalidation_time)
        except Exception as e:
            logger.error(f"Error invalidating stale cache: {str(e)}")

    def generate_optimization_report(self) -> Dict[str, Any]:
        """Generate comprehensive cache optimization report.
        
        Returns:
            Dictionary containing optimization report
        """
        try:
            cdn = self.health_monitor.failover_service.primary_cdn
            optimization_results = self.optimize_cache_strategy(cdn)
            
            return {
                'optimization_results': optimization_results,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error generating optimization report: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            } 