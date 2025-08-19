"""
Image Optimization Service Module

This module provides services for optimizing images and improving frontend performance.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import os
import logging
from pathlib import Path
from PIL import Image
import io
from ..cache.decorators import cached

logger = logging.getLogger(__name__)

class ImageOptimizationService:
    """Service for optimizing images and improving frontend performance."""

    # Store image metrics for analysis
    image_metrics: List[Dict[str, Any]] = []
    supported_formats = ['JPEG', 'PNG', 'WebP', 'AVIF']
    quality_settings = {
        'JPEG': 85,
        'PNG': 85,
        'WebP': 85,
        'AVIF': 60
    }

    @staticmethod
    def analyze_image(image_path: str) -> Dict[str, Any]:
        """Analyze image size and format.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing image analysis
        """
        try:
            with Image.open(image_path) as img:
                analysis = {
                    'original_size': os.path.getsize(image_path),
                    'dimensions': img.size,
                    'format': img.format,
                    'mode': img.mode,
                    'aspect_ratio': img.size[0] / img.size[1],
                    'optimization_suggestions': []
                }

                # Generate optimization suggestions
                if analysis['original_size'] > 500 * 1024:  # Larger than 500KB
                    analysis['optimization_suggestions'].append('Image size exceeds 500KB, consider compression')
                if img.format not in ImageOptimizationService.supported_formats:
                    analysis['optimization_suggestions'].append(f'Convert to {", ".join(ImageOptimizationService.supported_formats)}')
                if img.size[0] > 1920 or img.size[1] > 1080:
                    analysis['optimization_suggestions'].append('Image dimensions exceed 1920x1080, consider resizing')

                return analysis
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            return {'error': str(e)}

    @staticmethod
    def optimize_image(
        image_path: str,
        target_format: str = None,
        max_width: int = None,
        max_height: int = None,
        quality: int = None
    ) -> Tuple[bytes, Dict[str, Any]]:
        """Optimize image size and format.
        
        Args:
            image_path: Path to the image file
            target_format: Target format for conversion
            max_width: Maximum width for resizing
            max_height: Maximum height for resizing
            quality: Quality setting for compression
            
        Returns:
            Tuple of (optimized image bytes, optimization metrics)
        """
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1])
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')

                # Resize if dimensions exceed limits
                if max_width and max_height:
                    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

                # Set format and quality
                format = target_format or img.format
                quality = quality or ImageOptimizationService.quality_settings.get(format, 85)

                # Save optimized image
                output = io.BytesIO()
                img.save(output, format=format, quality=quality, optimize=True)
                optimized_bytes = output.getvalue()

                # Calculate metrics
                original_size = os.path.getsize(image_path)
                optimized_size = len(optimized_bytes)
                metrics = {
                    'original_size': original_size,
                    'optimized_size': optimized_size,
                    'reduction_percentage': ((original_size - optimized_size) / original_size) * 100,
                    'format': format,
                    'dimensions': img.size,
                    'quality': quality
                }

                return optimized_bytes, metrics
        except Exception as e:
            logger.error(f"Error optimizing image: {str(e)}")
            return None, {'error': str(e)}

    @staticmethod
    def generate_responsive_images(
        image_path: str,
        sizes: List[Tuple[int, int]] = [(640, 480), (1024, 768), (1920, 1080)]
    ) -> Dict[str, Any]:
        """Generate responsive image variants.
        
        Args:
            image_path: Path to the image file
            sizes: List of (width, height) tuples for different sizes
            
        Returns:
            Dictionary containing responsive image data
        """
        try:
            responsive_images = {}
            with Image.open(image_path) as img:
                for width, height in sizes:
                    # Create resized variant
                    variant = img.copy()
                    variant.thumbnail((width, height), Image.Resampling.LANCZOS)
                    
                    # Save variant
                    output = io.BytesIO()
                    variant.save(output, format=img.format, optimize=True)
                    responsive_images[f"{width}x{height}"] = {
                        'bytes': output.getvalue(),
                        'size': len(output.getvalue()),
                        'dimensions': variant.size
                    }

            return responsive_images
        except Exception as e:
            logger.error(f"Error generating responsive images: {str(e)}")
            return {'error': str(e)}

    @staticmethod
    @cached("image_analysis", expire=timedelta(minutes=5))
    def get_image_analysis() -> Dict[str, Any]:
        """Get analysis of image optimization performance.
        
        Returns:
            Dictionary containing image analysis
        """
        analysis = {
            'total_images': len(ImageOptimizationService.image_metrics),
            'total_size': 0,
            'average_size': 0,
            'format_distribution': {},
            'optimization_suggestions': []
        }

        if ImageOptimizationService.image_metrics:
            total_size = sum(m['size'] for m in ImageOptimizationService.image_metrics)
            analysis['total_size'] = total_size
            analysis['average_size'] = total_size / len(ImageOptimizationService.image_metrics)

            # Analyze format distribution
            for metric in ImageOptimizationService.image_metrics:
                format = metric.get('format')
                if format:
                    analysis['format_distribution'][format] = analysis['format_distribution'].get(format, 0) + 1

            # Generate suggestions
            if analysis['average_size'] > 500 * 1024:
                analysis['optimization_suggestions'].append('Average image size exceeds 500KB, consider batch optimization')
            if any(format not in ImageOptimizationService.supported_formats 
                  for format in analysis['format_distribution'].keys()):
                analysis['optimization_suggestions'].append('Some images use unsupported formats, consider conversion')

        return analysis

    @staticmethod
    def track_image_metrics(
        image_path: str,
        size: int,
        format: str,
        dimensions: Tuple[int, int]
    ) -> None:
        """Track image metrics for analysis.
        
        Args:
            image_path: Path to the image file
            size: Size in bytes
            format: Image format
            dimensions: Image dimensions (width, height)
        """
        metric = {
            'timestamp': datetime.utcnow(),
            'path': image_path,
            'size': size,
            'format': format,
            'dimensions': dimensions
        }
        ImageOptimizationService.image_metrics.append(metric)

        # Keep only last 100 metrics
        if len(ImageOptimizationService.image_metrics) > 100:
            ImageOptimizationService.image_metrics = ImageOptimizationService.image_metrics[-100:] 