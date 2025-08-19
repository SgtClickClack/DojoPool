import logging
from collections import deque
from datetime import datetime
from typing import Dict, List

import numpy as np
import psutil


class SystemOptimizationService:
    def __init__(
        self,
        metrics_buffer_size: int = 100,
        cpu_threshold: float = 80.0,
        memory_threshold: float = 80.0,
        disk_threshold: float = 80.0,
    ):
        self.metrics_buffer = deque(maxlen=metrics_buffer_size)
        self.cpu_threshold = cpu_threshold
        self.memory_threshold = memory_threshold
        self.disk_threshold = disk_threshold
        self.logger = logging.getLogger(__name__)

    def collect_system_metrics(self) -> Dict:
        """Collect current system metrics."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")
            network = psutil.net_io_counters()

            metrics = {
                "timestamp": datetime.now().isoformat(),
                "cpu": {
                    "percent": cpu_percent,
                    "count": psutil.cpu_count(),
                    "frequency": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used,
                    "free": memory.free,
                },
                "disk": {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free,
                    "percent": disk.percent,
                },
                "network": {
                    "bytes_sent": network.bytes_sent,
                    "bytes_recv": network.bytes_recv,
                    "packets_sent": network.packets_sent,
                    "packets_recv": network.packets_recv,
                },
            }

            self.metrics_buffer.append(metrics)
            return metrics

        except Exception as e:
            self.logger.error(f"Error collecting system metrics: {str(e)}")
            return {}

    def analyze_performance(self) -> Dict:
        """Analyze system performance and identify issues."""
        if not self.metrics_buffer:
            return {"status": "error", "message": "No metrics available for analysis"}

        recent_metrics = list(self.metrics_buffer)
        cpu_usage = [m["cpu"]["percent"] for m in recent_metrics]
        memory_usage = [m["memory"]["percent"] for m in recent_metrics]
        disk_usage = [m["disk"]["percent"] for m in recent_metrics]

        analysis = {
            "status": "success",
            "cpu": {
                "current": cpu_usage[-1],
                "average": np.mean(cpu_usage),
                "peak": max(cpu_usage),
                "trend": self._calculate_trend(cpu_usage),
                "issues": self._detect_cpu_issues(cpu_usage),
            },
            "memory": {
                "current": memory_usage[-1],
                "average": np.mean(memory_usage),
                "peak": max(memory_usage),
                "trend": self._calculate_trend(memory_usage),
                "issues": self._detect_memory_issues(memory_usage),
            },
            "disk": {
                "current": disk_usage[-1],
                "average": np.mean(disk_usage),
                "peak": max(disk_usage),
                "trend": self._calculate_trend(disk_usage),
                "issues": self._detect_disk_issues(disk_usage),
            },
        }

        return analysis

    def get_optimization_recommendations(self) -> List[Dict]:
        """Generate optimization recommendations based on performance analysis."""
        analysis = self.analyze_performance()
        if analysis["status"] == "error":
            return []

        recommendations = []

        # CPU recommendations
        if analysis["cpu"]["issues"]:
            for issue in analysis["cpu"]["issues"]:
                recommendations.append(
                    {
                        "component": "cpu",
                        "issue": issue,
                        "priority": self._calculate_priority(analysis["cpu"]),
                        "suggestions": self._get_cpu_optimization_suggestions(issue),
                    }
                )

        # Memory recommendations
        if analysis["memory"]["issues"]:
            for issue in analysis["memory"]["issues"]:
                recommendations.append(
                    {
                        "component": "memory",
                        "issue": issue,
                        "priority": self._calculate_priority(analysis["memory"]),
                        "suggestions": self._get_memory_optimization_suggestions(issue),
                    }
                )

        # Disk recommendations
        if analysis["disk"]["issues"]:
            for issue in analysis["disk"]["issues"]:
                recommendations.append(
                    {
                        "component": "disk",
                        "issue": issue,
                        "priority": self._calculate_priority(analysis["disk"]),
                        "suggestions": self._get_disk_optimization_suggestions(issue),
                    }
                )

        return recommendations

    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction for a metric."""
        if len(values) < 2:
            return "stable"

        slope = np.polyfit(range(len(values)), values, 1)[0]
        if slope > 0.1:
            return "increasing"
        elif slope < -0.1:
            return "decreasing"
        return "stable"

    def _detect_cpu_issues(self, cpu_usage: List[float]) -> List[str]:
        """Detect CPU-related issues."""
        issues = []
        if np.mean(cpu_usage) > self.cpu_threshold:
            issues.append("high_average_usage")
        if max(cpu_usage) > 90:
            issues.append("peak_usage_critical")
        if self._calculate_trend(cpu_usage) == "increasing":
            issues.append("usage_trending_up")
        return issues

    def _detect_memory_issues(self, memory_usage: List[float]) -> List[str]:
        """Detect memory-related issues."""
        issues = []
        if np.mean(memory_usage) > self.memory_threshold:
            issues.append("high_average_usage")
        if max(memory_usage) > 90:
            issues.append("peak_usage_critical")
        if self._calculate_trend(memory_usage) == "increasing":
            issues.append("usage_trending_up")
        return issues

    def _detect_disk_issues(self, disk_usage: List[float]) -> List[str]:
        """Detect disk-related issues."""
        issues = []
        if np.mean(disk_usage) > self.disk_threshold:
            issues.append("high_average_usage")
        if max(disk_usage) > 90:
            issues.append("peak_usage_critical")
        if self._calculate_trend(disk_usage) == "increasing":
            issues.append("usage_trending_up")
        return issues

    def _calculate_priority(self, component_analysis: Dict) -> str:
        """Calculate priority level for an issue."""
        current = component_analysis["current"]
        trend = component_analysis["trend"]

        if current > 90 or "peak_usage_critical" in component_analysis["issues"]:
            return "critical"
        elif current > 80 or trend == "increasing":
            return "high"
        elif current > 70:
            return "medium"
        return "low"

    def _get_cpu_optimization_suggestions(self, issue: str) -> List[str]:
        """Get optimization suggestions for CPU issues."""
        suggestions = {
            "high_average_usage": [
                "Consider scaling up CPU resources",
                "Optimize CPU-intensive operations",
                "Implement request throttling",
            ],
            "peak_usage_critical": [
                "Implement load balancing",
                "Add auto-scaling policies",
                "Optimize background tasks",
            ],
            "usage_trending_up": [
                "Monitor application performance",
                "Review recent code changes",
                "Consider capacity planning",
            ],
        }
        return suggestions.get(issue, [])

    def _get_memory_optimization_suggestions(self, issue: str) -> List[str]:
        """Get optimization suggestions for memory issues."""
        suggestions = {
            "high_average_usage": [
                "Implement memory caching",
                "Optimize memory-intensive operations",
                "Review memory leaks",
            ],
            "peak_usage_critical": [
                "Increase memory allocation",
                "Implement memory limits",
                "Optimize data structures",
            ],
            "usage_trending_up": [
                "Monitor memory allocation",
                "Review memory usage patterns",
                "Consider memory optimization",
            ],
        }
        return suggestions.get(issue, [])

    def _get_disk_optimization_suggestions(self, issue: str) -> List[str]:
        """Get optimization suggestions for disk issues."""
        suggestions = {
            "high_average_usage": [
                "Implement data cleanup policies",
                "Review data retention policies",
                "Consider storage optimization",
            ],
            "peak_usage_critical": [
                "Increase disk space",
                "Archive old data",
                "Implement storage quotas",
            ],
            "usage_trending_up": [
                "Monitor disk usage patterns",
                "Review data growth rate",
                "Plan storage capacity",
            ],
        }
        return suggestions.get(issue, [])
