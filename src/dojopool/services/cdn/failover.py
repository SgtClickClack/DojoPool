"""
CDN Failover Service Module

This module provides services for CDN failover and high availability.
"""

from typing import Dict, Any, List, Optional
import os
import logging
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
from ..cache.decorators import cached
from .image_cdn import ImageCDNService

logger = logging.getLogger(__name__)

class CDNFailoverService:
    """Service for CDN failover and high availability."""

    def __init__(self):
        """Initialize CDN failover service with multiple CDN providers."""
        self.primary_cdn = ImageCDNService()
        self.backup_cdns = [
            ImageCDNService(),  # Backup CDN 1
            ImageCDNService()   # Backup CDN 2
        ]
        self.health_check_interval = int(os.getenv('CDN_HEALTH_CHECK_INTERVAL', '300'))  # 5 minutes
        self.failover_threshold = int(os.getenv('CDN_FAILOVER_THRESHOLD', '3'))  # 3 failures
        self.recovery_threshold = int(os.getenv('CDN_RECOVERY_THRESHOLD', '5'))  # 5 successes

    def upload_with_failover(
        self,
        image_path: str,
        cdn_path: str,
        content_type: str,
        cache_control: str = None
    ) -> Dict[str, Any]:
        """Upload image with failover support.
        
        Args:
            image_path: Local path to the image file
            cdn_path: Path in CDN where image will be stored
            content_type: MIME type of the image
            cache_control: Cache control header value
            
        Returns:
            Dictionary containing upload result
        """
        try:
            # Try primary CDN first
            result = self.primary_cdn.upload_to_cdn(
                image_path,
                cdn_path,
                content_type,
                cache_control
            )

            if result.get('error'):
                # If primary fails, try backup CDNs
                for backup_cdn in self.backup_cdns:
                    backup_result = backup_cdn.upload_to_cdn(
                        image_path,
                        cdn_path,
                        content_type,
                        cache_control
                    )
                    if not backup_result.get('error'):
                        return backup_result

            return result
        except Exception as e:
            logger.error(f"Error in upload with failover: {str(e)}")
            return {'error': str(e)}

    def upload_responsive_with_failover(
        self,
        image_path: str,
        base_cdn_path: str,
        sizes: List[tuple] = [(640, 480), (1024, 768), (1920, 1080)]
    ) -> Dict[str, Any]:
        """Upload responsive images with failover support.
        
        Args:
            image_path: Local path to the image file
            base_cdn_path: Base path in CDN for responsive images
            sizes: List of (width, height) tuples for different sizes
            
        Returns:
            Dictionary containing upload results
        """
        try:
            # Try primary CDN first
            result = self.primary_cdn.upload_responsive_images(
                image_path,
                base_cdn_path,
                sizes
            )

            if result.get('error'):
                # If primary fails, try backup CDNs
                for backup_cdn in self.backup_cdns:
                    backup_result = backup_cdn.upload_responsive_images(
                        image_path,
                        base_cdn_path,
                        sizes
                    )
                    if not backup_result.get('error'):
                        return backup_result

            return result
        except Exception as e:
            logger.error(f"Error in responsive upload with failover: {str(e)}")
            return {'error': str(e)}

    def get_url_with_failover(self, cdn_path: str) -> str:
        """Get CDN URL with failover support.
        
        Args:
            cdn_path: Path in CDN
            
        Returns:
            Full CDN URL
        """
        try:
            # Check primary CDN health
            if self._check_cdn_health(self.primary_cdn):
                return self.primary_cdn.get_cdn_url(cdn_path)

            # If primary is unhealthy, try backup CDNs
            for backup_cdn in self.backup_cdns:
                if self._check_cdn_health(backup_cdn):
                    return backup_cdn.get_cdn_url(cdn_path)

            # If all CDNs are unhealthy, return primary URL as fallback
            return self.primary_cdn.get_cdn_url(cdn_path)
        except Exception as e:
            logger.error(f"Error in URL retrieval with failover: {str(e)}")
            return self.primary_cdn.get_cdn_url(cdn_path)

    def delete_with_failover(self, cdn_path: str) -> Dict[str, Any]:
        """Delete image with failover support.
        
        Args:
            cdn_path: Path in CDN
            
        Returns:
            Dictionary containing deletion result
        """
        try:
            # Try primary CDN first
            result = self.primary_cdn.delete_from_cdn(cdn_path)

            if result.get('error'):
                # If primary fails, try backup CDNs
                for backup_cdn in self.backup_cdns:
                    backup_result = backup_cdn.delete_from_cdn(cdn_path)
                    if not backup_result.get('error'):
                        return backup_result

            return result
        except Exception as e:
            logger.error(f"Error in deletion with failover: {str(e)}")
            return {'error': str(e)}

    def _check_cdn_health(self, cdn: ImageCDNService) -> bool:
        """Check CDN health status.
        
        Args:
            cdn: CDN service instance
            
        Returns:
            Boolean indicating CDN health
        """
        try:
            metrics = cdn.get_cdn_metrics()
            return (
                metrics.get('cache_hit_rate', 0) > 0.8 and
                metrics.get('average_latency', float('inf')) < 200
            )
        except Exception as e:
            logger.error(f"Error checking CDN health: {str(e)}")
            return False

    @staticmethod
    @cached("cdn_failover_metrics", expire=timedelta(minutes=5))
    def get_failover_metrics() -> Dict[str, Any]:
        """Get CDN failover metrics.
        
        Returns:
            Dictionary containing failover metrics
        """
        return {
            'failover_count': 0,
            'recovery_count': 0,
            'current_active_cdn': 'primary',
            'last_failover_time': None,
            'last_recovery_time': None
        } 