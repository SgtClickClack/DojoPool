from typing import Dict, List, Optional
import logging
from datetime import datetime, timedelta
from collections import deque
import numpy as np

class AutoScalingService:
    def __init__(self,
                 metrics_buffer_size: int = 100,
                 scale_up_threshold: float = 75.0,
                 scale_down_threshold: float = 25.0,
                 cooldown_period: int = 300):  # 5 minutes in seconds
        self.metrics_buffer = deque(maxlen=metrics_buffer_size)
        self.scale_up_threshold = scale_up_threshold
        self.scale_down_threshold = scale_down_threshold
        self.cooldown_period = cooldown_period
        self.last_scale_time = datetime.now() - timedelta(seconds=cooldown_period)
        self.logger = logging.getLogger(__name__)
        
    def evaluate_scaling_needs(self, current_metrics: Dict) -> Dict:
        """Evaluate if scaling is needed based on current metrics."""
        self.metrics_buffer.append(current_metrics)
        
        if not self._can_scale():
            return {
                'action': 'none',
                'reason': 'In cooldown period'
            }
            
        cpu_decision = self._evaluate_cpu_scaling()
        memory_decision = self._evaluate_memory_scaling()
        
        # Combine decisions with priority to CPU
        if cpu_decision['action'] != 'none':
            decision = cpu_decision
        elif memory_decision['action'] != 'none':
            decision = memory_decision
        else:
            decision = {
                'action': 'none',
                'reason': 'Current resource utilization within acceptable range'
            }
            
        if decision['action'] != 'none':
            self.last_scale_time = datetime.now()
            
        return decision
        
    def get_scaling_recommendations(self) -> List[Dict]:
        """Get detailed scaling recommendations."""
        if not self.metrics_buffer:
            return []
            
        recent_metrics = list(self.metrics_buffer)
        cpu_usage = [m['cpu']['percent'] for m in recent_metrics]
        memory_usage = [m['memory']['percent'] for m in recent_metrics]
        
        recommendations = []
        
        # CPU recommendations
        cpu_trend = self._calculate_trend(cpu_usage)
        if cpu_trend == 'increasing' and np.mean(cpu_usage) > self.scale_up_threshold:
            recommendations.append({
                'resource': 'cpu',
                'action': 'scale_up',
                'priority': 'high',
                'reason': 'High CPU usage trend detected',
                'suggestions': [
                    'Increase CPU allocation',
                    'Add more worker nodes',
                    'Optimize CPU-intensive operations'
                ]
            })
        elif cpu_trend == 'decreasing' and np.mean(cpu_usage) < self.scale_down_threshold:
            recommendations.append({
                'resource': 'cpu',
                'action': 'scale_down',
                'priority': 'medium',
                'reason': 'Low CPU usage trend detected',
                'suggestions': [
                    'Decrease CPU allocation',
                    'Remove underutilized nodes',
                    'Consolidate workloads'
                ]
            })
            
        # Memory recommendations
        memory_trend = self._calculate_trend(memory_usage)
        if memory_trend == 'increasing' and np.mean(memory_usage) > self.scale_up_threshold:
            recommendations.append({
                'resource': 'memory',
                'action': 'scale_up',
                'priority': 'high',
                'reason': 'High memory usage trend detected',
                'suggestions': [
                    'Increase memory allocation',
                    'Add more nodes',
                    'Optimize memory usage'
                ]
            })
        elif memory_trend == 'decreasing' and np.mean(memory_usage) < self.scale_down_threshold:
            recommendations.append({
                'resource': 'memory',
                'action': 'scale_down',
                'priority': 'medium',
                'reason': 'Low memory usage trend detected',
                'suggestions': [
                    'Decrease memory allocation',
                    'Remove underutilized nodes',
                    'Consolidate workloads'
                ]
            })
            
        return recommendations
        
    def _can_scale(self) -> bool:
        """Check if enough time has passed since last scaling action."""
        time_since_last_scale = (datetime.now() - self.last_scale_time).total_seconds()
        return time_since_last_scale >= self.cooldown_period
        
    def _evaluate_cpu_scaling(self) -> Dict:
        """Evaluate if CPU scaling is needed."""
        if not self.metrics_buffer:
            return {'action': 'none', 'reason': 'No metrics available'}
            
        recent_metrics = list(self.metrics_buffer)
        cpu_usage = [m['cpu']['percent'] for m in recent_metrics]
        avg_cpu = np.mean(cpu_usage)
        
        if avg_cpu > self.scale_up_threshold:
            return {
                'action': 'scale_up',
                'reason': f'High CPU usage: {avg_cpu:.1f}%',
                'resource': 'cpu',
                'current_usage': avg_cpu
            }
        elif avg_cpu < self.scale_down_threshold:
            return {
                'action': 'scale_down',
                'reason': f'Low CPU usage: {avg_cpu:.1f}%',
                'resource': 'cpu',
                'current_usage': avg_cpu
            }
            
        return {'action': 'none', 'reason': 'CPU usage within acceptable range'}
        
    def _evaluate_memory_scaling(self) -> Dict:
        """Evaluate if memory scaling is needed."""
        if not self.metrics_buffer:
            return {'action': 'none', 'reason': 'No metrics available'}
            
        recent_metrics = list(self.metrics_buffer)
        memory_usage = [m['memory']['percent'] for m in recent_metrics]
        avg_memory = np.mean(memory_usage)
        
        if avg_memory > self.scale_up_threshold:
            return {
                'action': 'scale_up',
                'reason': f'High memory usage: {avg_memory:.1f}%',
                'resource': 'memory',
                'current_usage': avg_memory
            }
        elif avg_memory < self.scale_down_threshold:
            return {
                'action': 'scale_down',
                'reason': f'Low memory usage: {avg_memory:.1f}%',
                'resource': 'memory',
                'current_usage': avg_memory
            }
            
        return {'action': 'none', 'reason': 'Memory usage within acceptable range'}
        
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction for a metric."""
        if len(values) < 2:
            return 'stable'
            
        slope = np.polyfit(range(len(values)), values, 1)[0]
        if slope > 0.1:
            return 'increasing'
        elif slope < -0.1:
            return 'decreasing'
        return 'stable'
        
    def get_scaling_history(self) -> List[Dict]:
        """Get history of scaling decisions."""
        if not self.metrics_buffer:
            return []
            
        history = []
        metrics_list = list(self.metrics_buffer)
        
        for i in range(len(metrics_list)):
            metrics = metrics_list[i]
            cpu_usage = metrics['cpu']['percent']
            memory_usage = metrics['memory']['percent']
            
            history.append({
                'timestamp': metrics['timestamp'],
                'cpu_usage': cpu_usage,
                'memory_usage': memory_usage,
                'cpu_status': self._get_resource_status(cpu_usage),
                'memory_status': self._get_resource_status(memory_usage)
            })
            
        return history
        
    def _get_resource_status(self, usage: float) -> str:
        """Get status of a resource based on its usage."""
        if usage > self.scale_up_threshold:
            return 'high'
        elif usage < self.scale_down_threshold:
            return 'low'
        return 'normal' 