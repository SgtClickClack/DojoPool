"""Service for collecting and tracking security metrics."""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union

from prometheus_client import Counter, Gauge, Histogram
from redis import Redis

from dojopool.core.cache import SecureCache
from dojopool.core.errors import SecurityError


class SecurityMetricsService:
    """Service for collecting and managing security metrics."""

    def __init__(self, redis_client: Redis):
        """Initialize the security metrics service.

        Args:
            redis_client: Redis client for metrics storage
        """
        self.redis = redis_client
        self.cache = SecureCache()
        self.logger = logging.getLogger(__name__)

        # Initialize Prometheus metrics
        self.vulnerability_count = Gauge(
            "security_vulnerabilities_total",
            "Total number of security vulnerabilities",
            ["severity"],
        )

        self.security_score = Gauge(
            "security_compliance_score", "Overall security compliance score"
        )

        self.incident_count = Counter(
            "security_incidents_total",
            "Total number of security incidents",
            ["severity", "status"],
        )

        self.scan_duration = Histogram(
            "security_scan_duration_seconds",
            "Duration of security scans",
            ["scan_type"],
        )

        self.failed_checks = Counter(
            "security_check_failures_total",
            "Total number of failed security checks",
            ["check_type"],
        )

    def record_vulnerability(
        self, title: str, severity: str, location: str, description: str
    ) -> None:
        """Record a detected vulnerability.

        Args:
            title: Vulnerability title
            severity: Severity level
            location: Where the vulnerability was found
            description: Detailed description
        """
        try:
            # Increment Prometheus counter
            self.vulnerability_count.labels(severity=severity).inc()

            # Store vulnerability details
            vuln_data = {
                "title": title,
                "severity": severity,
                "location": location,
                "description": description,
                "detected_at": datetime.now().isoformat(),
                "status": "open",
            }

            # Use Redis to store vulnerability data
            vuln_id = f"vuln:{datetime.now().timestamp()}"
            self.redis.hmset(vuln_id, vuln_data)
            self.redis.sadd(f"vulns:{severity}", vuln_id)

            self.logger.info(f"Recorded vulnerability: {title}")

        except Exception as e:
            self.logger.error(f"Failed to record vulnerability: {str(e)}")
            raise SecurityError("Failed to record vulnerability")

    def update_security_score(self, score: float):
        """Update the overall security score.

        Args:
            score: New security score (0-100)
        """
        try:
            if not 0 <= score <= 100:
                raise ValueError("Score must be between 0 and 100")

            # Update Prometheus gauge
            self.security_score.set(score)

            # Store score history
            timestamp = datetime.now().timestamp()
            self.redis.zadd("security_scores", {str(score): timestamp})

            # Keep only last 30 days of scores
            cutoff = datetime.now() - timedelta(days=30)
            self.redis.zremrangebyscore("security_scores", "-inf", cutoff.timestamp())

            self.logger.info(f"Updated security score: {score}")

        except Exception as e:
            self.logger.error(f"Failed to update security score: {str(e)}")
            raise SecurityError("Failed to update security score")

    def record_security_incident(
        self, title: str, severity: str, description: str, status: str = "open"
    ) -> str:
        """Record a security incident.

        Args:
            title: Incident title
            severity: Incident severity
            description: Incident description
            status: Incident status

        Returns:
            str: Incident ID
        """
        try:
            # Increment Prometheus counter
            self.incident_count.labels(severity=severity, status=status).inc()

            # Store incident details
            incident_data = {
                "title": title,
                "severity": severity,
                "description": description,
                "status": status,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            # Generate incident ID and store in Redis
            incident_id = f"incident:{datetime.now().timestamp()}"
            self.redis.hmset(incident_id, incident_data)

            # Add to severity-specific set
            self.redis.sadd(f"incidents:{severity}", incident_id)

            self.logger.info(f"Recorded security incident: {title}")
            return incident_id

        except Exception as e:
            self.logger.error(f"Failed to record security incident: {str(e)}")
            raise SecurityError("Failed to record security incident")

    def record_scan_result(
        self, scan_type: str, duration: float, findings: List[Dict]
    ) -> None:
        """Record results from a security scan.

        Args:
            scan_type: Type of security scan
            duration: Scan duration in seconds
            findings: List of scan findings
        """
        try:
            # Record scan duration
            self.scan_duration.labels(scan_type=scan_type).observe(duration)

            # Store scan results
            scan_data = {
                "scan_type": scan_type,
                "duration": duration,
                "findings": findings,
                "timestamp": datetime.now().isoformat(),
            }

            # Store in Redis with TTL
            scan_id = f"scan:{datetime.now().timestamp()}"
            self.redis.hmset(scan_id, scan_data)
            self.redis.expire(scan_id, timedelta(days=30))

            self.logger.info(f"Recorded scan result: {scan_type}")

        except Exception as e:
            self.logger.error(f"Failed to record scan result: {str(e)}")
            raise SecurityError("Failed to record scan result")

    def get_security_metrics(self, period: str = "daily"):
        """Get security metrics for a time period.

        Args:
            period: Time period ('daily', 'weekly', 'monthly')

        Returns:
            Dict containing security metrics
        """
        try:
            # Calculate time range
            now = datetime.now()
            if period == "daily":
                start_time = now - timedelta(days=1)
            elif period == "weekly":
                start_time = now - timedelta(weeks=1)
            elif period == "monthly":
                start_time = now - timedelta(days=30)
            else:
                raise ValueError(f"Invalid period: {period}")

            # Collect metrics
            metrics = {
                "security_score": float(self.security_score._value.get()),
                "vulnerabilities": {
                    "total": sum(self.vulnerability_count._value.values()),
                    "high": self.vulnerability_count.labels("high")._value.get(),
                    "medium": self.vulnerability_count.labels("medium")._value.get(),
                    "low": self.vulnerability_count.labels("low")._value.get(),
                },
                "incidents": {
                    "total": sum(self.incident_count._value.values()),
                    "open": len(self.redis.keys("incident:*")),
                    "resolved": self.incident_count.labels(
                        status="resolved"
                    )._value.get(),
                },
                "scans": {
                    "total": len(self.redis.keys("scan:*")),
                    "avg_duration": self.scan_duration._sum.get()
                    / max(self.scan_duration._count.get(), 1),
                },
            }

            return metrics

        except Exception as e:
            self.logger.error(f"Failed to get security metrics: {str(e)}")
            raise SecurityError("Failed to get security metrics")

    def get_trend_data(self, metric: str, days: int = 30) -> List[Dict]:
        """Get trend data for a specific metric.

        Args:
            metric: Metric name
            days: Number of days of history

        Returns:
            List of data points
        """
        try:
            now = datetime.now()
            start_time = now - timedelta(days=days)

            if metric == "security_score":
                # Get score history from Redis
                scores = self.redis.zrangebyscore(
                    "security_scores",
                    start_time.timestamp(),
                    float("inf"),
                    withscores=True,
                )
                return [
                    {"value": float(score), "timestamp": ts} for score, ts in scores
                ]

            elif metric == "vulnerabilities":
                # Get vulnerability counts over time
                counts = []
                current = start_time
                while current <= now:
                    day_key = current.strftime("%Y-%m-%d")
                    count = len(self.redis.keys(f"vuln:{day_key}:*"))
                    counts.append({"value": count, "timestamp": current.timestamp()})
                    current += timedelta(days=1)
                return counts

            else:
                raise ValueError(f"Invalid metric: {metric}")

        except Exception as e:
            self.logger.error(f"Failed to get trend data: {str(e)}")
            raise SecurityError("Failed to get trend data")
