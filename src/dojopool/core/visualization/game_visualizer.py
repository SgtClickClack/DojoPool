"""Game visualization module.

This module provides real-time visualization capabilities for game analytics.
"""

from datetime import datetime
from typing import Any, Dict, List

import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots


class GameVisualizer:
    """Real-time game visualization processor."""

    def __init__(self, shot_history: List[Dict], game_state: Dict):
        """Initialize visualizer.

        Args:
            shot_history: List of shot records
            game_state: Current game state
        """
        self.shot_history = shot_history
        self.game_state = game_state
        self._cached_plots = {}

    def get_real_time_visualizations(self) -> Dict[str, Any]:
        """Get comprehensive real-time visualizations."""
        return {
            "shot_distribution": self.create_shot_distribution_plot(),
            "performance_trends": self.create_performance_trends_plot(),
            "position_heatmap": self.create_position_heatmap(),
            "success_patterns": self.create_success_patterns_plot(),
        }

    def create_shot_distribution_plot(self) -> Dict[str, Any]:
        """Create shot distribution visualization."""
        # Create table layout
        table_fig = go.Figure()

        # Add table boundaries
        table_fig.add_shape(
            type="rect", x0=0, y0=0, x1=1, y1=0.5, line={"color": "green", "width": 2}
        )

        # Plot shots
        shot_x = []
        shot_y = []
        colors = []
        sizes = []

        for shot in self.shot_history:
            if "position" in shot:
                x, y = shot["position"]
                shot_x.append(x)
                shot_y.append(y)
                colors.append("green" if shot.get("result") == "success" else "red")
                sizes.append(10 if shot.get("critical_shot") else 7)

        table_fig.add_trace(
            go.Scatter(
                x=shot_x,
                y=shot_y,
                mode="markers",
                marker={"color": colors, "size": sizes, "symbol": "circle"},
                name="Shots",
            )
        )

        table_fig.update_layout(title="Shot Distribution", showlegend=True, width=800, height=400)

        return {"figure": table_fig, "timestamp": datetime.utcnow().isoformat()}

    def create_performance_trends_plot(self) -> Dict[str, Any]:
        """Create performance trends visualization."""
        # Create subplots for different metrics
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Success Rate Trend",
                "Shot Difficulty",
                "Position Accuracy",
                "Shot Types",
            ),
        )

        # Success rate trend
        success_rates = self._calculate_rolling_success_rate()
        fig.add_trace(
            go.Scatter(x=list(range(len(success_rates))), y=success_rates, name="Success Rate"),
            row=1,
            col=1,
        )

        # Shot difficulty
        difficulties = [shot.get("difficulty", 0) for shot in self.shot_history]
        fig.add_trace(
            go.Scatter(x=list(range(len(difficulties))), y=difficulties, name="Difficulty"),
            row=1,
            col=2,
        )

        # Position accuracy
        accuracies = self._calculate_position_accuracies()
        fig.add_trace(
            go.Scatter(x=list(range(len(accuracies))), y=accuracies, name="Position Accuracy"),
            row=2,
            col=1,
        )

        # Shot types distribution
        shot_types = self._count_shot_types()
        fig.add_trace(
            go.Bar(x=list(shot_types.keys()), y=list(shot_types.values()), name="Shot Types"),
            row=2,
            col=2,
        )

        fig.update_layout(height=800, width=1000, title_text="Performance Trends")

        return {"figure": fig, "timestamp": datetime.utcnow().isoformat()}

    def create_position_heatmap(self) -> Dict[str, Any]:
        """Create position play heatmap."""
        # Create 9x9 grid for more detailed heatmap
        grid_size = 9
        position_grid = np.zeros((grid_size, grid_size))

        for shot in self.shot_history:
            if "position" in shot:
                x, y = shot["position"]
                grid_x = min(int(x * grid_size), grid_size - 1)
                grid_y = min(int(y * grid_size), grid_size - 1)
                position_grid[grid_y][grid_x] += 1

        fig = go.Figure(data=go.Heatmap(z=position_grid, colorscale="Viridis"))

        fig.update_layout(title="Position Play Heatmap", width=600, height=300)

        return {"figure": fig, "timestamp": datetime.utcnow().isoformat()}

    def create_success_patterns_plot(self) -> Dict[str, Any]:
        """Create success patterns visualization."""
        fig = make_subplots(
            rows=2,
            cols=2,
            subplot_titles=(
                "Success by Position",
                "Success by Shot Type",
                "Success by Difficulty",
                "Success by Game Phase",
            ),
        )

        # Success by position
        position_success = self._calculate_position_success()
        fig.add_trace(
            go.Bar(
                x=list(position_success.keys()),
                y=list(position_success.values()),
                name="Position Success",
            ),
            row=1,
            col=1,
        )

        # Success by shot type
        type_success = self._calculate_type_success()
        fig.add_trace(
            go.Bar(x=list(type_success.keys()), y=list(type_success.values()), name="Type Success"),
            row=1,
            col=2,
        )

        # Success by difficulty
        difficulty_success = self._calculate_difficulty_success()
        fig.add_trace(
            go.Bar(
                x=list(difficulty_success.keys()),
                y=list(difficulty_success.values()),
                name="Difficulty Success",
            ),
            row=2,
            col=1,
        )

        # Success by game phase
        phase_success = self._calculate_phase_success()
        fig.add_trace(
            go.Bar(
                x=list(phase_success.keys()), y=list(phase_success.values()), name="Phase Success"
            ),
            row=2,
            col=2,
        )

        fig.update_layout(height=800, width=1000, title_text="Success Patterns Analysis")

        return {"figure": fig, "timestamp": datetime.utcnow().isoformat()}

    def _calculate_rolling_success_rate(self, window_size: int = 5) -> List[float]:
        """Calculate rolling success rate."""
        success_rates = []
        for i in range(len(self.shot_history)):
            window = self.shot_history[max(0, i - window_size + 1) : i + 1]
            success_count = sum(1 for s in window if s.get("result") == "success")
            success_rates.append(success_count / len(window) * 100)
        return success_rates

    def _calculate_position_accuracies(self) -> List[float]:
        """Calculate position accuracy for each shot."""
        accuracies = []
        for shot in self.shot_history:
            if "intended_position" in shot and "actual_position" in shot:
                intended = shot["intended_position"]
                actual = shot["actual_position"]
                distance = ((intended[0] - actual[0]) ** 2 + (intended[1] - actual[1]) ** 2) ** 0.5
                accuracies.append(1 - min(1, distance))
            else:
                accuracies.append(0)
        return accuracies

    def _count_shot_types(self) -> Dict[str, int]:
        """Count occurrences of different shot types."""
        shot_types = {}
        for shot in self.shot_history:
            shot_type = shot.get("shot_type", "unknown")
            shot_types[shot_type] = shot_types.get(shot_type, 0) + 1
        return shot_types

    def _calculate_position_success(self) -> Dict[str, float]:
        """Calculate success rate by position zone."""
        zones = {f"zone_{i}_{j}": {"attempts": 0, "success": 0} for i in range(3) for j in range(3)}

        for shot in self.shot_history:
            if "position" in shot:
                x, y = shot["position"]
                zone_x = int(x * 3)
                zone_y = int(y * 3)
                zone_key = f"zone_{zone_x}_{zone_y}"

                zones[zone_key]["attempts"] += 1
                if shot.get("result") == "success":
                    zones[zone_key]["success"] += 1

        return {
            zone: (stats["success"] / stats["attempts"] * 100 if stats["attempts"] > 0 else 0)
            for zone, stats in zones.items()
        }

    def _calculate_type_success(self) -> Dict[str, float]:
        """Calculate success rate by shot type."""
        types = {}
        for shot in self.shot_history:
            shot_type = shot.get("shot_type", "unknown")
            if shot_type not in types:
                types[shot_type] = {"attempts": 0, "success": 0}

            types[shot_type]["attempts"] += 1
            if shot.get("result") == "success":
                types[shot_type]["success"] += 1

        return {
            shot_type: (stats["success"] / stats["attempts"] * 100 if stats["attempts"] > 0 else 0)
            for shot_type, stats in types.items()
        }

    def _calculate_difficulty_success(self) -> Dict[str, float]:
        """Calculate success rate by difficulty level."""
        difficulties = {
            "easy": {"attempts": 0, "success": 0},
            "medium": {"attempts": 0, "success": 0},
            "hard": {"attempts": 0, "success": 0},
        }

        for shot in self.shot_history:
            difficulty = shot.get("difficulty", 0)
            if difficulty < 0.3:
                level = "easy"
            elif difficulty < 0.7:
                level = "medium"
            else:
                level = "hard"

            difficulties[level]["attempts"] += 1
            if shot.get("result") == "success":
                difficulties[level]["success"] += 1

        return {
            level: (stats["success"] / stats["attempts"] * 100 if stats["attempts"] > 0 else 0)
            for level, stats in difficulties.items()
        }

    def _calculate_phase_success(self) -> Dict[str, float]:
        """Calculate success rate by game phase."""
        total_shots = len(self.shot_history)
        if total_shots < 3:
            return {"early": 0, "mid": 0, "late": 0}

        phase_size = total_shots // 3
        phases = {
            "early": {"shots": self.shot_history[:phase_size], "success": 0},
            "mid": {"shots": self.shot_history[phase_size : 2 * phase_size], "success": 0},
            "late": {"shots": self.shot_history[2 * phase_size :], "success": 0},
        }

        for _phase, data in phases.items():
            success_count = sum(1 for s in data["shots"] if s.get("result") == "success")
            data["success"] = success_count / len(data["shots"]) * 100 if data["shots"] else 0

        return {phase: data["success"] for phase, data in phases.items()}
