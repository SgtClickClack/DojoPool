"""
Bundle Optimization Service Module

This module provides services for optimizing frontend bundle size and loading performance.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import os
import json
import logging
from pathlib import Path
from ..cache.decorators import cached

logger = logging.getLogger(__name__)

class BundleOptimizationService:
    """Service for optimizing frontend bundle size and loading performance."""

    # Store bundle metrics for analysis
    bundle_metrics: List[Dict[str, Any]] = []
    chunk_stats: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def analyze_bundle_size(bundle_path: str) -> Dict[str, Any]:
        """Analyze bundle size and composition.
        
        Args:
            bundle_path: Path to the bundle file
            
        Returns:
            Dictionary containing bundle analysis
        """
        try:
            bundle_size = os.path.getsize(bundle_path)
            analysis = {
                'total_size': bundle_size,
                'size_mb': bundle_size / (1024 * 1024),
                'chunks': [],
                'dependencies': {}
            }

            # Analyze bundle composition
            with open(bundle_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Count dependencies
                import_lines = [line for line in content.split('\n') if 'import' in line]
                for line in import_lines:
                    if 'from' in line:
                        dep = line.split('from')[1].split()[0]
                    else:
                        dep = line.split('import')[1].split()[0]
                    analysis['dependencies'][dep] = analysis['dependencies'].get(dep, 0) + 1

            return analysis
        except Exception as e:
            logger.error(f"Error analyzing bundle: {str(e)}")
            return {'error': str(e)}

    @staticmethod
    def optimize_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Optimize chunk sizes and loading.
        
        Args:
            chunks: List of chunk information
            
        Returns:
            List of optimized chunks
        """
        optimized_chunks = []
        for chunk in chunks:
            optimized = {
                'name': chunk['name'],
                'size': chunk['size'],
                'dependencies': chunk.get('dependencies', []),
                'suggestions': []
            }

            # Generate optimization suggestions
            if chunk['size'] > 100 * 1024:  # Larger than 100KB
                optimized['suggestions'].append('Consider code splitting')
            if len(chunk.get('dependencies', [])) > 10:
                optimized['suggestions'].append('Too many dependencies, consider lazy loading')
            if 'node_modules' in chunk['name']:
                optimized['suggestions'].append('Consider tree shaking')

            optimized_chunks.append(optimized)

        return optimized_chunks

    @staticmethod
    @cached("bundle_analysis", expire=timedelta(minutes=5))
    def get_bundle_analysis() -> Dict[str, Any]:
        """Get analysis of bundle performance.
        
        Returns:
            Dictionary containing bundle analysis
        """
        analysis = {
            'total_size': 0,
            'chunks': [],
            'dependencies': {},
            'optimization_suggestions': []
        }

        if BundleOptimizationService.bundle_metrics:
            total_size = sum(m['size'] for m in BundleOptimizationService.bundle_metrics)
            analysis['total_size'] = total_size

            # Analyze chunks
            for metric in BundleOptimizationService.bundle_metrics:
                chunk = {
                    'name': metric['name'],
                    'size': metric['size'],
                    'dependencies': metric.get('dependencies', [])
                }
                analysis['chunks'].append(chunk)

            # Generate optimization suggestions
            if total_size > 5 * 1024 * 1024:  # Larger than 5MB
                analysis['optimization_suggestions'].append('Bundle size exceeds 5MB, consider code splitting')
            if len(analysis['chunks']) > 10:
                analysis['optimization_suggestions'].append('Too many chunks, consider combining related chunks')

        return analysis

    @staticmethod
    def track_bundle_metrics(chunk_name: str, size: int, dependencies: List[str] = None) -> None:
        """Track bundle metrics for analysis.
        
        Args:
            chunk_name: Name of the chunk
            size: Size in bytes
            dependencies: List of dependencies
        """
        metric = {
            'timestamp': datetime.utcnow(),
            'name': chunk_name,
            'size': size,
            'dependencies': dependencies or []
        }
        BundleOptimizationService.bundle_metrics.append(metric)

        # Keep only last 100 metrics
        if len(BundleOptimizationService.bundle_metrics) > 100:
            BundleOptimizationService.bundle_metrics = BundleOptimizationService.bundle_metrics[-100:]

    @staticmethod
    def get_large_chunks(threshold: int = 100 * 1024) -> List[Dict[str, Any]]:
        """Get list of large chunks that need optimization.
        
        Args:
            threshold: Size threshold in bytes
            
        Returns:
            List of large chunks with metrics
        """
        large_chunks = []
        for metric in BundleOptimizationService.bundle_metrics:
            if metric['size'] > threshold:
                large_chunks.append({
                    'name': metric['name'],
                    'size': metric['size'],
                    'dependencies': metric.get('dependencies', [])
                })
        return sorted(large_chunks, key=lambda x: x['size'], reverse=True)

    @staticmethod
    def generate_optimization_report() -> Dict[str, Any]:
        """Generate a comprehensive optimization report.
        
        Returns:
            Dictionary containing optimization report
        """
        report = {
            'timestamp': datetime.utcnow(),
            'total_size': 0,
            'chunk_count': 0,
            'large_chunks': [],
            'optimization_suggestions': [],
            'dependency_analysis': {}
        }

        if BundleOptimizationService.bundle_metrics:
            report['total_size'] = sum(m['size'] for m in BundleOptimizationService.bundle_metrics)
            report['chunk_count'] = len(BundleOptimizationService.bundle_metrics)

            # Analyze large chunks
            report['large_chunks'] = BundleOptimizationService.get_large_chunks()

            # Analyze dependencies
            for metric in BundleOptimizationService.bundle_metrics:
                for dep in metric.get('dependencies', []):
                    if dep not in report['dependency_analysis']:
                        report['dependency_analysis'][dep] = {
                            'count': 0,
                            'total_size': 0
                        }
                    report['dependency_analysis'][dep]['count'] += 1
                    report['dependency_analysis'][dep]['total_size'] += metric['size']

            # Generate suggestions
            if report['total_size'] > 5 * 1024 * 1024:
                report['optimization_suggestions'].append('Implement code splitting')
            if report['chunk_count'] > 10:
                report['optimization_suggestions'].append('Combine related chunks')
            if any(chunk['size'] > 500 * 1024 for chunk in report['large_chunks']):
                report['optimization_suggestions'].append('Optimize large chunks')

        return report 