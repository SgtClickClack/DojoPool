import time
import psutil
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import numpy as np
from fastapi import HTTPException
from redis import Redis
from sqlalchemy.orm import Session

class PerformanceMonitor:
    def __init__(self, redis_client: Redis, db: Session):
        self.redis = redis_client
        self.db = db
        self.metrics_buffer = defaultdict(list)
        self.alert_thresholds = {
            'cpu_usage': 80.0,  # Percentage
            'memory_usage': 85.0,  # Percentage
            'response_time': 1000,  # Milliseconds
            'error_rate': 5.0,  # Percentage
            'request_rate': 1000  # Requests per minute
        }
        
    async def start_monitoring(self):
        """Start the performance monitoring tasks."""
        asyncio.create_task(self._collect_system_metrics())
        asyncio.create_task(self._analyze_performance())
        
    async def _collect_system_metrics(self, interval: int = 60):
        """Collect system metrics at regular intervals."""
        while True:
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'cpu_usage': psutil.cpu_percent(interval=1),
                'memory_usage': psutil.virtual_memory().percent,
                'disk_usage': psutil.disk_usage('/').percent,
                'network_io': self._get_network_io(),
                'process_metrics': self._get_process_metrics()
            }
            
            # Store metrics in Redis with TTL
            self.redis.setex(
                f"system_metrics:{metrics['timestamp']}",
                3600,  # 1 hour TTL
                str(metrics)
            )
            
            # Buffer metrics for analysis
            for key, value in metrics.items():
                if key != 'timestamp':
                    self.metrics_buffer[key].append(value)
            
            # Keep buffer size manageable
            for key in self.metrics_buffer:
                if len(self.metrics_buffer[key]) > 1000:
                    self.metrics_buffer[key] = self.metrics_buffer[key][-1000:]
            
            await asyncio.sleep(interval)
            
    async def _analyze_performance(self, interval: int = 300):
        """Analyze performance metrics and trigger optimizations."""
        while True:
            try:
                # Analyze system metrics
                analysis = self._analyze_metrics()
                
                # Check for performance issues
                issues = self._detect_performance_issues(analysis)
                
                if issues:
                    # Apply automatic optimizations
                    await self._apply_optimizations(issues)
                    
                    # Store analysis results
                    self.redis.setex(
                        f"performance_analysis:{datetime.now().isoformat()}",
                        3600,
                        str({'analysis': analysis, 'issues': issues})
                    )
                
            except Exception as e:
                print(f"Error in performance analysis: {str(e)}")
                
            await asyncio.sleep(interval)
            
    def _get_network_io(self) -> Dict:
        """Get network I/O statistics."""
        net_io = psutil.net_io_counters()
        return {
            'bytes_sent': net_io.bytes_sent,
            'bytes_recv': net_io.bytes_recv,
            'packets_sent': net_io.packets_sent,
            'packets_recv': net_io.packets_recv
        }
        
    def _get_process_metrics(self) -> Dict:
        """Get process-specific metrics."""
        process = psutil.Process()
        return {
            'cpu_percent': process.cpu_percent(),
            'memory_percent': process.memory_percent(),
            'threads': process.num_threads(),
            'open_files': len(process.open_files()),
            'connections': len(process.connections())
        }
        
    def _analyze_metrics(self) -> Dict:
        """Analyze collected metrics for patterns and trends."""
        analysis = {}
        
        for metric, values in self.metrics_buffer.items():
            if len(values) > 0:
                analysis[metric] = {
                    'current': values[-1],
                    'mean': np.mean(values),
                    'std': np.std(values),
                    'min': np.min(values),
                    'max': np.max(values),
                    'trend': self._calculate_trend(values)
                }
                
        return analysis
        
    def _calculate_trend(self, values: List[float], window: int = 10) -> str:
        """Calculate trend direction for a metric."""
        if len(values) < window:
            return 'stable'
            
        recent = values[-window:]
        slope = np.polyfit(range(len(recent)), recent, 1)[0]
        
        if slope > 0.1:
            return 'increasing'
        elif slope < -0.1:
            return 'decreasing'
        else:
            return 'stable'
            
    def _detect_performance_issues(self, analysis: Dict) -> List[Dict]:
        """Detect performance issues based on analysis."""
        issues = []
        
        # Check CPU usage
        if analysis.get('cpu_usage', {}).get('current', 0) > self.alert_thresholds['cpu_usage']:
            issues.append({
                'type': 'high_cpu_usage',
                'severity': 'high',
                'value': analysis['cpu_usage']['current']
            })
            
        # Check memory usage
        if analysis.get('memory_usage', {}).get('current', 0) > self.alert_thresholds['memory_usage']:
            issues.append({
                'type': 'high_memory_usage',
                'severity': 'high',
                'value': analysis['memory_usage']['current']
            })
            
        # Check for increasing trends
        for metric, data in analysis.items():
            if data.get('trend') == 'increasing':
                issues.append({
                    'type': f'increasing_{metric}',
                    'severity': 'medium',
                    'value': data['current']
                })
                
        return issues
        
    async def _apply_optimizations(self, issues: List[Dict]):
        """Apply automatic optimizations based on detected issues."""
        for issue in issues:
            if issue['type'] == 'high_cpu_usage':
                await self._optimize_cpu_usage()
            elif issue['type'] == 'high_memory_usage':
                await self._optimize_memory_usage()
            elif issue['type'].startswith('increasing_'):
                await self._optimize_resource_usage(issue['type'].split('_')[1])
                
    async def _optimize_cpu_usage(self):
        """Optimize CPU usage."""
        # Implement CPU optimization strategies
        # - Adjust worker processes
        # - Optimize database queries
        # - Enable caching
        pass
        
    async def _optimize_memory_usage(self):
        """Optimize memory usage."""
        # Implement memory optimization strategies
        # - Clear caches
        # - Garbage collection
        # - Optimize data structures
        pass
        
    async def _optimize_resource_usage(self, resource: str):
        """Optimize specific resource usage."""
        # Implement resource-specific optimization strategies
        pass
        
    def get_performance_metrics(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict:
        """Get performance metrics for a time range."""
        if not start_time:
            start_time = datetime.now() - timedelta(hours=1)
        if not end_time:
            end_time = datetime.now()
            
        metrics = []
        for key in self.redis.scan_iter("system_metrics:*"):
            timestamp = key.decode().split(':')[1]
            if start_time <= datetime.fromisoformat(timestamp) <= end_time:
                metrics.append(eval(self.redis.get(key).decode()))
                
        return {
            'metrics': metrics,
            'analysis': self._analyze_metrics(),
            'issues': self._detect_performance_issues(self._analyze_metrics())
        }
        
    def get_optimization_recommendations(self) -> List[Dict]:
        """Get optimization recommendations based on performance analysis."""
        analysis = self._analyze_metrics()
        issues = self._detect_performance_issues(analysis)
        
        recommendations = []
        for issue in issues:
            if issue['type'] == 'high_cpu_usage':
                recommendations.append({
                    'type': 'cpu_optimization',
                    'priority': 'high',
                    'suggestions': [
                        'Scale horizontally by adding more workers',
                        'Optimize database queries',
                        'Implement request caching',
                        'Review and optimize CPU-intensive operations'
                    ]
                })
            elif issue['type'] == 'high_memory_usage':
                recommendations.append({
                    'type': 'memory_optimization',
                    'priority': 'high',
                    'suggestions': [
                        'Implement memory caching',
                        'Optimize data structures',
                        'Review memory leaks',
                        'Configure garbage collection'
                    ]
                })
                
        return recommendations 