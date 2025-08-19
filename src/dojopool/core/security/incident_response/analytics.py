"""
Incident analytics and reporting system implementation.
Provides analytics, insights, and reporting capabilities for security incidents.
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List

import numpy as np
import plotly.graph_objects as go
from jinja2 import Environment, FileSystemLoader

from ... import config
from .incident import SecurityIncident


class IncidentAnalytics:
    """Analytics engine for security incidents."""

    def __init__(self):
        """Initialize analytics engine."""
        self.logger = logging.getLogger(__name__)

        # Setup report templates
        self.template_env = Environment(loader=FileSystemLoader(config.REPORT_TEMPLATES_DIR))

    def analyze_trends(
        self, incidents: List[SecurityIncident], time_window: timedelta = timedelta(days=30)
    ) -> Dict[str, Any]:
        """Analyze incident trends."""
        try:
            cutoff = datetime.now() - time_window
            recent_incidents = [i for i in incidents if i.created_at >= cutoff]

            # Time-based analysis
            daily_counts = self._analyze_daily_distribution(recent_incidents)
            mttr_stats = self._analyze_mttr(recent_incidents)
            severity_trends = self._analyze_severity_trends(recent_incidents)
            type_distribution = self._analyze_type_distribution(recent_incidents)

            # System impact analysis
            system_impact = self._analyze_system_impact(recent_incidents)
            threat_patterns = self._analyze_threat_patterns(recent_incidents)

            # Response effectiveness
            response_stats = self._analyze_response_effectiveness(recent_incidents)
            playbook_stats = self._analyze_playbook_effectiveness(recent_incidents)

            return {
                "time_window": str(time_window),
                "total_incidents": len(recent_incidents),
                "daily_distribution": daily_counts,
                "mttr_stats": mttr_stats,
                "severity_trends": severity_trends,
                "type_distribution": type_distribution,
                "system_impact": system_impact,
                "threat_patterns": threat_patterns,
                "response_stats": response_stats,
                "playbook_stats": playbook_stats,
            }

        except Exception as e:
            self.logger.error(f"Error analyzing trends: {str(e)}")
            return {}

    def _analyze_daily_distribution(self, incidents: List[SecurityIncident]) -> Dict[str, int]:
        """Analyze daily incident distribution."""
        daily_counts = defaultdict(int)
        for incident in incidents:
            date_key = incident.created_at.date().isoformat()
            daily_counts[date_key] += 1
        return dict(daily_counts)

    def _analyze_mttr(self, incidents: List[SecurityIncident]) -> Dict[str, Any]:
        """Analyze Mean Time To Resolve (MTTR)."""
        resolution_times = []
        for incident in incidents:
            if incident.resolved_at:
                resolution_time = (incident.resolved_at - incident.created_at).total_seconds()
                resolution_times.append(resolution_time)

        if resolution_times:
            return {
                "mean": np.mean(resolution_times) / 3600,  # Convert to hours
                "median": np.median(resolution_times) / 3600,
                "p95": np.percentile(resolution_times, 95) / 3600,
                "min": min(resolution_times) / 3600,
                "max": max(resolution_times) / 3600,
            }
        return {}

    def _analyze_severity_trends(
        self, incidents: List[SecurityIncident]
    ) -> Dict[str, Dict[str, int]]:
        """Analyze severity trends over time."""
        severity_trends = defaultdict(lambda: defaultdict(int))
        for incident in incidents:
            date_key = incident.created_at.date().isoformat()
            severity_trends[date_key][incident.severity.value] += 1
        return {k: dict(v) for k, v in severity_trends.items()}

    def _analyze_type_distribution(self, incidents: List[SecurityIncident]) -> Dict[str, int]:
        """Analyze incident type distribution."""
        type_counts = defaultdict(int)
        for incident in incidents:
            type_counts[incident.incident_type.value] += 1
        return dict(type_counts)

    def _analyze_system_impact(self, incidents: List[SecurityIncident]) -> Dict[str, Any]:
        """Analyze system impact patterns."""
        system_stats = defaultdict(
            lambda: {
                "incident_count": 0,
                "severity_distribution": defaultdict(int),
                "type_distribution": defaultdict(int),
                "mean_resolution_time": 0.0,
            }
        )

        for incident in incidents:
            for system in incident.affected_systems:
                system_stats[system]["incident_count"] += 1
                system_stats[system]["severity_distribution"][incident.severity.value] += 1
                system_stats[system]["type_distribution"][incident.incident_type.value] += 1

                if incident.resolved_at:
                    resolution_time = (
                        incident.resolved_at - incident.created_at
                    ).total_seconds() / 3600
                    current_mean = system_stats[system]["mean_resolution_time"]
                    current_count = system_stats[system]["incident_count"]
                    system_stats[system]["mean_resolution_time"] = (
                        current_mean * (current_count - 1) + resolution_time
                    ) / current_count

        return {k: dict(v) for k, v in system_stats.items()}

    def _analyze_threat_patterns(self, incidents: List[SecurityIncident]) -> Dict[str, Any]:
        """Analyze threat patterns."""
        ip_stats = defaultdict(
            lambda: {
                "incident_count": 0,
                "severity_distribution": defaultdict(int),
                "type_distribution": defaultdict(int),
                "affected_systems": set(),
            }
        )

        indicator_stats = defaultdict(
            lambda: {
                "incident_count": 0,
                "severity_distribution": defaultdict(int),
                "type_distribution": defaultdict(int),
            }
        )

        for incident in incidents:
            if incident.source_ip:
                ip_stats[incident.source_ip]["incident_count"] += 1
                ip_stats[incident.source_ip]["severity_distribution"][incident.severity.value] += 1
                ip_stats[incident.source_ip]["type_distribution"][incident.incident_type.value] += 1
                ip_stats[incident.source_ip]["affected_systems"].update(incident.affected_systems)

            for indicator in incident.indicators:
                indicator_stats[indicator]["incident_count"] += 1
                indicator_stats[indicator]["severity_distribution"][incident.severity.value] += 1
                indicator_stats[indicator]["type_distribution"][incident.incident_type.value] += 1

        # Convert sets to lists for JSON serialization
        for ip_data in ip_stats.values():
            ip_data["affected_systems"] = list(ip_data["affected_systems"])

        return {"ip_patterns": dict(ip_stats), "indicator_patterns": dict(indicator_stats)}

    def _analyze_response_effectiveness(self, incidents: List[SecurityIncident]) -> Dict[str, Any]:
        """Analyze response effectiveness."""
        action_stats = defaultdict(
            lambda: {
                "total_executions": 0,
                "success_rate": 0.0,
                "average_time": 0.0,
                "severity_distribution": defaultdict(int),
            }
        )

        for incident in incidents:
            for action in incident.actions_taken:
                action_type = action["type"]
                action_stats[action_type]["total_executions"] += 1
                action_stats[action_type]["severity_distribution"][incident.severity.value] += 1

                # Assuming success if no error in details
                if "error" not in action.get("details", {}):
                    action_stats[action_type]["success_rate"] += 1

        # Calculate success rates
        for stats in action_stats.values():
            if stats["total_executions"] > 0:
                stats["success_rate"] = (stats["success_rate"] / stats["total_executions"]) * 100

        return dict(action_stats)

    def _analyze_playbook_effectiveness(self, incidents: List[SecurityIncident]) -> Dict[str, Any]:
        """Analyze playbook effectiveness."""
        playbook_stats = defaultdict(
            lambda: {
                "total_executions": 0,
                "success_rate": 0.0,
                "average_containment_time": 0.0,
                "severity_distribution": defaultdict(int),
            }
        )

        for incident in incidents:
            if not incident.actions_taken:
                continue

            playbook_type = incident.incident_type.value
            playbook_stats[playbook_type]["total_executions"] += 1
            playbook_stats[playbook_type]["severity_distribution"][incident.severity.value] += 1

            # Check if incident was contained
            containment_action = next(
                (
                    a
                    for a in incident.actions_taken
                    if a["type"] == "status_update" and "contained" in a["description"].lower()
                ),
                None,
            )

            if containment_action:
                playbook_stats[playbook_type]["success_rate"] += 1
                if incident.created_at:
                    containment_time = (
                        datetime.fromisoformat(containment_action["timestamp"])
                        - incident.created_at
                    ).total_seconds() / 60  # Convert to minutes
                    current_avg = playbook_stats[playbook_type]["average_containment_time"]
                    current_count = playbook_stats[playbook_type]["total_executions"]
                    playbook_stats[playbook_type]["average_containment_time"] = (
                        current_avg * (current_count - 1) + containment_time
                    ) / current_count

        # Calculate success rates
        for stats in playbook_stats.values():
            if stats["total_executions"] > 0:
                stats["success_rate"] = (stats["success_rate"] / stats["total_executions"]) * 100

        return dict(playbook_stats)

    def generate_report(self, analysis_results: Dict[str, Any], report_type: str = "html") -> str:
        """Generate incident analysis report."""
        try:
            template = self.template_env.get_template(f"incident_report.{report_type}")

            # Create visualizations
            visualizations = self._create_visualizations(analysis_results)

            # Render report
            return template.render(
                analysis=analysis_results,
                visualizations=visualizations,
                generated_at=datetime.now().isoformat(),
            )

        except Exception as e:
            self.logger.error(f"Error generating report: {str(e)}")
            return ""

    def _create_visualizations(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create visualizations for report."""
        visualizations = {}

        try:
            # Daily incident trend
            if "daily_distribution" in analysis_results:
                fig = go.Figure()
                dates = list(analysis_results["daily_distribution"].keys())
                counts = list(analysis_results["daily_distribution"].values())
                fig.add_trace(go.Scatter(x=dates, y=counts, mode="lines+markers"))
                fig.update_layout(title="Daily Incident Trend")
                visualizations["daily_trend"] = fig.to_html(full_html=False)

            # Severity distribution
            if "severity_trends" in analysis_results:
                severity_data = defaultdict(list)
                dates = []
                for date, severities in analysis_results["severity_trends"].items():
                    dates.append(date)
                    for severity, count in severities.items():
                        severity_data[severity].append(count)

                fig = go.Figure()
                for severity, counts in severity_data.items():
                    fig.add_trace(go.Bar(name=severity, x=dates, y=counts))
                fig.update_layout(title="Incident Severity Distribution", barmode="stack")
                visualizations["severity_distribution"] = fig.to_html(full_html=False)

            # System impact heatmap
            if "system_impact" in analysis_results:
                systems = list(analysis_results["system_impact"].keys())
                impact_data = [
                    [s["incident_count"] for s in analysis_results["system_impact"].values()]
                ]

                fig = go.Figure(
                    data=go.Heatmap(z=impact_data, x=systems, y=["Impact"], colorscale="Viridis")
                )
                fig.update_layout(title="System Impact Heatmap")
                visualizations["system_impact"] = fig.to_html(full_html=False)

            # Response effectiveness
            if "response_stats" in analysis_results:
                actions = list(analysis_results["response_stats"].keys())
                success_rates = [
                    s["success_rate"] for s in analysis_results["response_stats"].values()
                ]

                fig = go.Figure(data=go.Bar(x=actions, y=success_rates))
                fig.update_layout(title="Response Action Success Rates")
                visualizations["response_effectiveness"] = fig.to_html(full_html=False)

            return visualizations

        except Exception as e:
            self.logger.error(f"Error creating visualizations: {str(e)}")
            return {}
