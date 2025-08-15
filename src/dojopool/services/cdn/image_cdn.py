"""
Image CDN Service Module

This module provides services for CDN integration and image delivery optimization.
"""

from typing import Dict, Any, Optional, List
import os
import logging
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
from ..cache.decorators import cached
from ..optimization.image import ImageOptimizationService

logger = logging.getLogger(__name__)

class ImageCDNService:
    """Service for CDN integration and image delivery optimization."""

    def __init__(self):
        """Initialize CDN service with AWS S3 and CloudFront configuration."""
        self.s3_client = boto3.client('s3')
        self.cloudfront_client = boto3.client('cloudfront')
        self.bucket_name = os.getenv('AWS_S3_BUCKET_NAME')
        self.cloudfront_distribution_id = os.getenv('AWS_CLOUDFRONT_DISTRIBUTION_ID')
        self.cdn_domain = os.getenv('CDN_DOMAIN')
        self.cache_ttl = int(os.getenv('CDN_CACHE_TTL', '86400'))  # Default 24 hours

    def upload_to_cdn(
        self,
        image_path: str,
        cdn_path: str,
        content_type: str,
        cache_control: str = None
    ) -> Dict[str, Any]:
        """Upload image to CDN with optimization.
        
        Args:
            image_path: Local path to the image file
            cdn_path: Path in CDN where image will be stored
            content_type: MIME type of the image
            cache_control: Cache control header value
            
        Returns:
            Dictionary containing upload result
        """
        try:
            # Optimize image before upload
            optimized_bytes, metrics = ImageOptimizationService.optimize_image(
                image_path,
                target_format=content_type.split('/')[-1].upper()
            )
            
            if not optimized_bytes:
                raise Exception('Failed to optimize image')

            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=cdn_path,
                Body=optimized_bytes,
                ContentType=content_type,
                CacheControl=cache_control or f'max-age={self.cache_ttl}'
            )

            # Invalidate CloudFront cache
            self._invalidate_cache(cdn_path)

            return {
                'success': True,
                'cdn_url': f'https://{self.cdn_domain}/{cdn_path}',
                'metrics': metrics
            }
        except Exception as e:
            logger.error(f"Error uploading to CDN: {str(e)}")
            return {'error': str(e)}

    def upload_responsive_images(
        self,
        image_path: str,
        base_cdn_path: str,
        sizes: List[tuple] = [(640, 480), (1024, 768), (1920, 1080)]
    ) -> Dict[str, Any]:
        """Upload responsive image variants to CDN.
        
        Args:
            image_path: Local path to the image file
            base_cdn_path: Base path in CDN for responsive images
            sizes: List of (width, height) tuples for different sizes
            
        Returns:
            Dictionary containing upload results
        """
        try:
            # Generate responsive images
            responsive_images = ImageOptimizationService.generate_responsive_images(
                image_path,
                sizes
            )

            # Upload each variant
            results = {}
            for size, image_data in responsive_images.items():
                cdn_path = f"{base_cdn_path}/{size}.{image_path.split('.')[-1]}"
                result = self.upload_to_cdn(
                    image_path,
                    cdn_path,
                    f"image/{image_path.split('.')[-1]}"
                )
                results[size] = result

            return results
        except Exception as e:
            logger.error(f"Error uploading responsive images: {str(e)}")
            return {'error': str(e)}

    def get_cdn_url(self, cdn_path: str) -> str:
        """Get CDN URL for an image.
        
        Args:
            cdn_path: Path in CDN
            
        Returns:
            Full CDN URL
        """
        return f'https://{self.cdn_domain}/{cdn_path}'

    def delete_from_cdn(self, cdn_path: str) -> Dict[str, Any]:
        """Delete image from CDN.
        
        Args:
            cdn_path: Path in CDN
            
        Returns:
            Dictionary containing deletion result
        """
        try:
            # Delete from S3
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=cdn_path
            )

            # Invalidate CloudFront cache
            self._invalidate_cache(cdn_path)

            return {'success': True}
        except Exception as e:
            logger.error(f"Error deleting from CDN: {str(e)}")
            return {'error': str(e)}

    def _invalidate_cache(self, path: str) -> None:
        """Invalidate CloudFront cache for a path.
        
        Args:
            path: Path to invalidate
        """
        try:
            self.cloudfront_client.create_invalidation(
                DistributionId=self.cloudfront_distribution_id,
                InvalidationBatch={
                    'CallerReference': str(datetime.utcnow().timestamp()),
                    'Paths': {
                        'Quantity': 1,
                        'Items': [f'/{path}']
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error invalidating cache: {str(e)}")

    @staticmethod
    @cached("cdn_metrics", expire=timedelta(minutes=5))
    def get_cdn_metrics() -> Dict[str, Any]:
        """Get CDN performance metrics.
        
        Returns:
            Dictionary containing CDN metrics
        """
        # This would typically fetch metrics from CloudWatch
        return {
            'cache_hit_rate': 0.95,
            'average_latency': 50,
            'bandwidth_usage': 0,
            'request_count': 0
        } 