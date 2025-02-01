import asyncio
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import numpy as np
import psutil
from redis import Redis
from sqlalchemy.orm import Session

from .memory_profiler import MemoryProfile, MemoryProfiler

import time
import logging
from dataclasses import dataclass
from threading import Thread
import json
import os

@dataclass
class PerformanceMetric:
    name: str
    value: float
    timestamp: datetime
    category: str
    unit: str

class PerformanceMonitor:
    def __init__(
        self,
        redis_client: Redis,
        db: Session,
        metrics_dir: str = "metrics",
        notification_service: Optional[NotificationService] = None
    ):
        self.redis = redis_client
        self.db = db
        self.metrics_buffer = defaultdict(list)
        self.alert_thresholds = {
            "cpu_usage": 80.0,  # Percentage
            "memory_usage": 85.0,  # Percentage
            "response_time": 1000,  # Milliseconds
            "error_rate": 5.0,  # Percentage
            "request_rate": 1000,  # Requests per minute
        }

        # Initialize notification service
        self.notification_service = notification_service or NotificationService(
            email_config={
                'from_email': os.getenv('NOTIFICATION_EMAIL'),
                'to_email': os.getenv('ADMIN_EMAIL'),
                'smtp_host': os.getenv('SMTP_HOST', 'smtp.gmail.com'),
                'smtp_port': int(os.getenv('SMTP_PORT', '587')),
                'username': os.getenv('SMTP_USERNAME'),
                'password': os.getenv('SMTP_PASSWORD')
            },
            slack_config={
                'webhook_url': os.getenv('SLACK_WEBHOOK_URL')
            }
        )

        # Initialize memory profiler with default profile
        self.memory_profiler = MemoryProfiler(
            MemoryProfile(
                spike_threshold=20.0,  # 20MB threshold
                sampling_rate=1000,  # 1 second between samples
                retention_period=3600000,  # 1 hour retention
                mitigation_strategy="progressive",
            )
        )

        self.metrics_dir = metrics_dir
        self.metrics: List[PerformanceMetric] = []
        self.is_running = False
        self._monitor_thread: Optional[Thread] = None
        self._setup_logging()
        self._ensure_metrics_dir()

    def _setup_logging(self):
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        handler = logging.FileHandler("performance_monitor.log")
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(handler)

    def _ensure_metrics_dir(self):
        if not os.path.exists(self.metrics_dir):
            os.makedirs(self.metrics_dir)
            self.logger.info(f"Created metrics directory: {self.metrics_dir}")

    async def start_monitoring(self):
        """Start the performance monitoring tasks."""
        await self.memory_profiler.start_monitoring()
        asyncio.create_task(self._collect_system_metrics())
        asyncio.create_task(self._analyze_performance())
        self.start()

    async def stop_monitoring(self):
        """Stop all monitoring tasks."""
        await self.memory_profiler.stop_monitoring()
        self.stop()

    async def _collect_system_metrics(self, interval: int = 60):
        """Collect system metrics at regular intervals."""
        while True:
            # Get memory metrics from profiler
            memory_metrics = self.memory_profiler.get_metrics()

            metrics = {
                "timestamp": datetime.now().isoformat(),
                "cpu_usage": psutil.cpu_percent(interval=1),
                "memory_usage": memory_metrics.get("current_usage", 0),
                "memory_peak": memory_metrics.get("peak_usage", 0),
                "memory_spikes": memory_metrics.get("spike_count", 0),
                "disk_usage": psutil.disk_usage("/").percent,
                "network_io": self._get_network_io(),
                "process_metrics": self._get_process_metrics(),
            }

            # Store metrics in Redis with TTL
            self.redis.setex(
                f"system_metrics:{metrics['timestamp']}", 3600, str(metrics)  # 1 hour TTL
            )

            # Buffer metrics for analysis
            for key, value in metrics.items():
                if key != "timestamp":
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
                        str({"analysis": analysis, "issues": issues}),
                    )

            except Exception as e:
                print(f"Error in performance analysis: {str(e)}")

            await asyncio.sleep(interval)

    def _get_network_io(self) -> Dict:
        """Get network I/O statistics."""
        net_io = psutil.net_io_counters()
        return {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv,
        }

    def _get_process_metrics(self) -> Dict:
        """Get process-specific metrics."""
        process = psutil.Process()
        return {
            "cpu_percent": process.cpu_percent(),
            "memory_percent": process.memory_percent(),
            "threads": process.num_threads(),
            "open_files": len(process.open_files()),
            "connections": len(process.connections()),
        }

    def _analyze_metrics(self) -> Dict:
        """Analyze collected metrics for patterns and trends."""
        analysis = {}

        for metric, values in self.metrics_buffer.items():
            if len(values) > 0:
                analysis[metric] = {
                    "current": values[-1],
                    "mean": np.mean(values),
                    "std": np.std(values),
                    "min": np.min(values),
                    "max": np.max(values),
                    "trend": self._calculate_trend(values),
                }

        return analysis

    def _calculate_trend(self, values: List[float], window: int = 10) -> str:
        """Calculate trend direction for a metric."""
        if len(values) < window:
            return "stable"

        recent = values[-window:]
        slope = np.polyfit(range(len(recent)), recent, 1)[0]

        if slope > 0.1:
            return "increasing"
        elif slope < -0.1:
            return "decreasing"
        else:
            return "stable"

    def _detect_performance_issues(self, analysis: Dict) -> List[Dict]:
        """Detect performance issues based on analysis."""
        issues = []
        alerts = []

        # Check CPU usage
        if analysis.get("cpu_usage", {}).get("current", 0) > self.alert_thresholds["cpu_usage"]:
            issue = {
                "type": "high_cpu_usage",
                "severity": "high",
                "value": analysis["cpu_usage"]["current"],
            }
            issues.append(issue)
            alerts.append(Alert(
                title="High CPU Usage Detected",
                message=f"CPU usage has exceeded threshold: {analysis['cpu_usage']['current']}%",
                severity=AlertSeverity.CRITICAL,
                timestamp=datetime.now(),
                metric_name="CPU Usage",
                current_value=analysis["cpu_usage"]["current"],
                threshold_value=self.alert_thresholds["cpu_usage"],
                channel=[AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.IN_APP]
            ))

        # Check memory usage
        if analysis.get("memory_usage", {}).get("current", 0) > self.alert_thresholds["memory_usage"]:
            issue = {
                "type": "high_memory_usage",
                "severity": "high",
                "value": analysis["memory_usage"]["current"],
            }
            issues.append(issue)
            alerts.append(Alert(
                title="High Memory Usage Detected",
                message=f"Memory usage has exceeded threshold: {analysis['memory_usage']['current']}%",
                severity=AlertSeverity.CRITICAL,
                timestamp=datetime.now(),
                metric_name="Memory Usage",
                current_value=analysis["memory_usage"]["current"],
                threshold_value=self.alert_thresholds["memory_usage"],
                channel=[AlertChannel.EMAIL, AlertChannel.SLACK, AlertChannel.IN_APP]
            ))

        # Check for increasing trends
        for metric, data in analysis.items():
            if data.get("trend") == "increasing":
                issue = {
                    "type": f"increasing_{metric}",
                    "severity": "medium",
                    "value": data["current"]
                }
                issues.append(issue)
                alerts.append(Alert(
                    title=f"Increasing {metric.replace('_', ' ').title()} Trend",
                    message=f"{metric.replace('_', ' ').title()} shows an increasing trend: {data['current']}",
                    severity=AlertSeverity.WARNING,
                    timestamp=datetime.now(),
                    metric_name=metric,
                    current_value=data["current"],
                    threshold_value=data["mean"] * 1.2,  # 20% above mean as threshold
                    channel=[AlertChannel.SLACK, AlertChannel.IN_APP]
                ))

        # Send alerts if any were generated
        if alerts:
            asyncio.create_task(self._send_alerts(alerts))

        return issues

    async def _send_alerts(self, alerts: List[Alert]):
        """Send alerts through the notification service"""
        try:
            for alert in alerts:
                await self.notification_service.send_alert(alert)
        except Exception as e:
            self.logger.error(f"Failed to send alerts: {str(e)}")

    async def _apply_optimizations(self, issues: List[Dict]):
        """Apply automatic optimizations based on detected issues."""
        for issue in issues:
            if issue["type"] == "high_cpu_usage":
                await self._optimize_cpu_usage()
            elif issue["type"] == "high_memory_usage":
                await self._optimize_memory_usage()
            elif issue["type"].startswith("increasing_"):
                await self._optimize_resource_usage(issue["type"].split("_")[1])

    async def _optimize_cpu_usage(self):
        """Optimize CPU usage."""
        # Implement CPU optimization strategies
        # - Adjust worker processes
        # - Optimize database queries
        # - Enable caching
        pass

    async def _optimize_memory_usage(self):
        """Optimize memory usage."""
        # Get recommendations from memory profiler
        recommendations = self.memory_profiler.get_recommendations()

        for recommendation in recommendations:
            # Log recommendations
            print(f"Memory optimization recommendation: {recommendation}")

            # Apply automatic optimizations based on recommendations
            if "memory leak" in recommendation.lower():
                # Trigger garbage collection
                import gc

                gc.collect()
            elif "scaling horizontally" in recommendation.lower():
                # Log recommendation for manual intervention
                self.redis.lpush("scaling_recommendations", recommendation)
            elif "spike threshold" in recommendation.lower():
                # Adjust memory profile
                current_profile = self.memory_profiler.profile
                new_profile = MemoryProfile(
                    spike_threshold=current_profile.spike_threshold * 1.2,  # Increase by 20%
                    sampling_rate=current_profile.sampling_rate,
                    retention_period=current_profile.retention_period,
                    mitigation_strategy=current_profile.mitigation_strategy,
                )
                self.memory_profiler.profile = new_profile

    async def _optimize_resource_usage(self, resource: str):
        """Optimize specific resource usage."""
        # Implement resource-specific optimization strategies
        pass

    def get_performance_metrics(
        self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None
    ) -> Dict:
        """Get performance metrics for a time range."""
        if not start_time:
            start_time = datetime.now() - timedelta(hours=1)
        if not end_time:
            end_time = datetime.now()

        metrics = []
        for key in self.redis.scan_iter("system_metrics:*"):
            timestamp = key.decode().split(":")[1]
            if start_time <= datetime.fromisoformat(timestamp) <= end_time:
                metrics.append(eval(self.redis.get(key).decode()))

        return {
            "metrics": metrics,
            "analysis": self._analyze_metrics(),
            "issues": self._detect_performance_issues(self._analyze_metrics()),
        }

    def get_optimization_recommendations(self) -> List[Dict]:
        """Get optimization recommendations based on performance analysis."""
        analysis = self._analyze_metrics()
        issues = self._detect_performance_issues(analysis)

        recommendations = []
        for issue in issues:
            if issue["type"] == "high_cpu_usage":
                recommendations.append(
                    {
                        "type": "cpu_optimization",
                        "priority": "high",
                        "suggestions": [
                            "Scale horizontally by adding more workers",
                            "Optimize database queries",
                            "Implement request caching",
                            "Review and optimize CPU-intensive operations",
                        ],
                    }
                )
            elif issue["type"] == "high_memory_usage":
                recommendations.append(
                    {
                        "type": "memory_optimization",
                        "priority": "high",
                        "suggestions": [
                            "Implement memory caching",
                            "Optimize data structures",
                            "Review memory leaks",
                            "Configure garbage collection",
                        ],
                    }
                )

        return recommendations

    def start(self):
        """Start the performance monitoring service"""
        if self.is_running:
            return
        
        self.is_running = True
        self._monitor_thread = Thread(target=self._monitor_loop)
        self._monitor_thread.daemon = True
        self._monitor_thread.start()
        self.logger.info("Performance monitoring started")

    def stop(self):
        """Stop the performance monitoring service"""
        self.is_running = False
        if self._monitor_thread:
            self._monitor_thread.join()
        self.logger.info("Performance monitoring stopped")

    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.is_running:
            try:
                self._collect_metrics()
                self._save_metrics()
                time.sleep(60)  # Collect metrics every minute
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {str(e)}")

    def _collect_metrics(self):
        """Collect various performance metrics"""
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        # Add system metrics
        self._add_metric("CPU Usage", cpu_percent, "system", "%")
        self._add_metric("Memory Usage", memory.percent, "system", "%")
        self._add_metric("Disk Usage", disk.percent, "system", "%")

        # Game-specific metrics (example)
        self._collect_game_metrics()

        # API metrics
        self._collect_api_metrics()

    def _collect_game_metrics(self):
        """Collect game-specific performance metrics"""
        # These would be integrated with your game engine
        # Example metrics:
        self._add_metric("Frame Rate", 60.0, "game", "fps")  # Placeholder
        self._add_metric("Latency", 50.0, "game", "ms")  # Placeholder

    def _collect_api_metrics(self):
        """Collect API performance metrics"""
        # These would be integrated with your API monitoring
        # Example metrics:
        self._add_metric("API Response Time", 100.0, "api", "ms")  # Placeholder
        self._add_metric("API Error Rate", 0.1, "api", "%")  # Placeholder

    def _add_metric(self, name: str, value: float, category: str, unit: str):
        """Add a new metric to the collection"""
        metric = PerformanceMetric(
            name=name,
            value=value,
            timestamp=datetime.now(),
            category=category,
            unit=unit
        )
        self.metrics.append(metric)

    def _save_metrics(self):
        """Save collected metrics to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.metrics_dir}/metrics_{timestamp}.json"
        
        metrics_data = [
            {
                "name": m.name,
                "value": m.value,
                "timestamp": m.timestamp.isoformat(),
                "category": m.category,
                "unit": m.unit
            }
            for m in self.metrics
        ]
        
        with open(filename, 'w') as f:
            json.dump(metrics_data, f, indent=2)
        
        self.logger.info(f"Saved metrics to {filename}")
        self.metrics.clear()  # Clear after saving

    def get_latest_metrics(self) -> Dict[str, Dict]:
        """Get the most recent metrics for each metric name"""
        latest_metrics = {}
        
        # Find the most recent metrics file
        metric_files = sorted([f for f in os.listdir(self.metrics_dir) if f.startswith('metrics_')])
        if not metric_files:
            return {}
        
        latest_file = os.path.join(self.metrics_dir, metric_files[-1])
        with open(latest_file, 'r') as f:
            metrics_data = json.load(f)
        
        # Group by metric name and get latest
        for metric in metrics_data:
            name = metric['name']
            if name not in latest_metrics or \
               metric['timestamp'] > latest_metrics[name]['timestamp']:
                latest_metrics[name] = metric
        
        return latest_metrics

    def get_metric_history(self, metric_name: str, hours: int = 24) -> List[Dict]:
        """Get historical data for a specific metric"""
        history = []
        cutoff_time = datetime.now().timestamp() - (hours * 3600)
        
        metric_files = sorted([f for f in os.listdir(self.metrics_dir) if f.startswith('metrics_')])
        for filename in metric_files:
            with open(os.path.join(self.metrics_dir, filename), 'r') as f:
                metrics_data = json.load(f)
                for metric in metrics_data:
                    if metric['name'] == metric_name and \
                       datetime.fromisoformat(metric['timestamp']).timestamp() > cutoff_time:
                        history.append(metric)
        
        return sorted(history, key=lambda x: x['timestamp'])

# Example usage:
if __name__ == "__main__":
    monitor = PerformanceMonitor(None, None)
    monitor.start()
    try:
        # Run for a while
        time.sleep(300)  # 5 minutes
    finally:
        monitor.stop()
