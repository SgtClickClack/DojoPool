from typing import Dict, List, Optional, Any
from datetime import datetime
import random
from ..models.shot import Shot
from ..models.match import Match
from ..models.player import Player
from ..services.shot_analysis import ShotAnalysis
from ..services.performance_tracking_service import PerformanceTrackingService


class NarrativeGenerationService:
    def __init__(self):
        self.shot_analysis = ShotAnalysis()
        self.performance_tracking = PerformanceTrackingService()
        self.narrative_templates = {
            "match_intro": [
                "{player1} faces off against {player2} in what promises to be {match_intensity} match",
                "The stage is set for an exciting contest between {player1} and {player2}",
                "Two skilled competitors, {player1} and {player2}, meet at the table",
            ],
            "shot_description": {
                "power": [
                    "delivers a powerful shot",
                    "executes a forceful strike",
                    "demonstrates impressive power",
                ],
                "position": [
                    "plays a precise positional shot",
                    "shows excellent control",
                    "carefully places the cue ball",
                ],
                "spin": [
                    "applies masterful spin",
                    "uses clever english",
                    "demonstrates spin control",
                ],
                "safety": [
                    "opts for a safety play",
                    "plays a tactical safety shot",
                    "chooses a defensive approach",
                ],
            },
            "performance_highlight": [
                "showing remarkable consistency",
                "displaying exceptional skill",
                "demonstrating technical prowess",
            ],
            "match_conclusion": [
                "clinches the victory after {shot_count} shots",
                "secures the win in a {match_intensity} match",
                "emerges victorious in this {match_quality} display",
            ],
        }

    def generate_match_narrative(
        self, match_id: str, detail_level: str = "medium"
    ) -> Dict[str, Any]:
        """
        Generate a narrative for a complete match
        """
        # Get match data
        match = Match.get_by_id(match_id)
        if not match:
            return {"error": "Match not found"}

        # Get players
        player1 = Player.get_by_id(match.player1_id)
        player2 = Player.get_by_id(match.player2_id)

        # Get match shots
        shots = Shot.get_match_shots(match_id)
        if not shots:
            return {"error": "No shots found for match"}

        # Generate narrative components
        intro = self._generate_match_intro(player1, player2, match)
        highlights = self._generate_match_highlights(shots, player1, player2, detail_level)
        summary = self._generate_match_summary(match, shots, player1, player2)
        stats = self._generate_match_statistics(shots, player1, player2)

        return {
            "match_id": match_id,
            "timestamp": datetime.utcnow(),
            "narrative": {"intro": intro, "highlights": highlights, "summary": summary},
            "statistics": stats,
        }

    def generate_live_update(self, match_id: str, shot: Shot) -> Dict[str, Any]:
        """
        Generate a narrative update for a live shot
        """
        # Analyze the shot
        shot_analysis = self.shot_analysis.analyze_shot(shot.to_dict())

        # Get player
        player = Player.get_by_id(shot.player_id)

        # Generate shot narrative
        shot_description = self._generate_shot_description(shot, shot_analysis, player)

        # Add context if significant
        context = self._generate_shot_context(shot, shot_analysis)

        return {
            "match_id": match_id,
            "shot_id": str(shot._id),
            "timestamp": datetime.utcnow(),
            "narrative": {"description": shot_description, "context": context if context else None},
            "analysis": shot_analysis,
        }

    def _generate_match_intro(self, player1: Player, player2: Player, match: Match) -> str:
        """
        Generate the match introduction narrative
        """
        # Get player performance data
        p1_performance = self.performance_tracking.track_player_performance(str(player1._id))
        p2_performance = self.performance_tracking.track_player_performance(str(player2._id))

        # Determine match intensity based on player ratings
        if "error" not in p1_performance and "error" not in p2_performance:
            p1_rating = p1_performance["metrics"].get("overall_rating", 0)
            p2_rating = p2_performance["metrics"].get("overall_rating", 0)
            rating_diff = abs(p1_rating - p2_rating)

            if rating_diff < 10:
                match_intensity = "closely contested"
            elif rating_diff < 20:
                match_intensity = "challenging"
            else:
                match_intensity = "competitive"
        else:
            match_intensity = "promising"

        # Select and format intro template
        template = random.choice(self.narrative_templates["match_intro"])
        return template.format(
            player1=player1.username, player2=player2.username, match_intensity=match_intensity
        )

    def _generate_match_highlights(
        self, shots: List[Shot], player1: Player, player2: Player, detail_level: str
    ) -> List[Dict[str, Any]]:
        """
        Generate key highlights from the match
        """
        highlights = []

        # Determine number of highlights based on detail level
        if detail_level == "high":
            highlight_count = min(10, len(shots))
        elif detail_level == "medium":
            highlight_count = min(5, len(shots))
        else:
            highlight_count = min(3, len(shots))

        # Sort shots by effectiveness
        analyzed_shots = [(shot, self.shot_analysis.analyze_shot(shot.to_dict())) for shot in shots]
        sorted_shots = sorted(analyzed_shots, key=lambda x: x[1]["effectiveness"], reverse=True)

        # Generate highlights for most effective shots
        for shot, analysis in sorted_shots[:highlight_count]:
            player = player1 if shot.player_id == player1._id else player2

            highlight = {
                "timestamp": shot.timestamp,
                "player": player.username,
                "description": self._generate_shot_description(shot, analysis, player),
                "significance": self._determine_shot_significance(analysis),
            }
            highlights.append(highlight)

        return highlights

    def _generate_shot_description(
        self, shot: Shot, analysis: Dict[str, Any], player: Player
    ) -> str:
        """
        Generate a description for a single shot
        """
        # Determine shot characteristics
        shot_type = analysis["shot_type"]
        effectiveness = analysis["effectiveness"]
        difficulty = analysis["difficulty"]

        # Select appropriate template
        templates = self.narrative_templates["shot_description"].get(
            shot_type, self.narrative_templates["shot_description"]["position"]
        )
        action = random.choice(templates)

        # Add difficulty modifier if significant
        if difficulty > 0.7:
            difficulty_modifier = "an incredibly difficult"
        elif difficulty > 0.5:
            difficulty_modifier = "a challenging"
        else:
            difficulty_modifier = "a"

        # Add result
        if shot.result:
            result = "successfully"
        else:
            result = "unsuccessfully"

        return f"{player.username} {result} {action} in {difficulty_modifier} attempt"

    def _generate_shot_context(self, shot: Shot, analysis: Dict[str, Any]) -> Optional[str]:
        """
        Generate contextual information for a shot if significant
        """
        context = []

        # Add difficulty context
        if analysis["difficulty"] > 0.8:
            context.append("An extremely challenging shot")

        # Add effectiveness context
        if analysis["effectiveness"] > 0.8:
            context.append("Exceptional execution")

        # Add strategic context
        if analysis["shot_type"] == "safety":
            context.append("A strategic defensive play")
        elif analysis["shot_type"] == "power":
            context.append("A bold offensive move")

        return " - ".join(context) if context else None

    def _generate_match_summary(
        self, match: Match, shots: List[Shot], player1: Player, player2: Player
    ) -> Dict[str, Any]:
        """
        Generate a summary of the match
        """
        # Calculate match statistics
        p1_shots = [s for s in shots if s.player_id == player1._id]
        p2_shots = [s for s in shots if s.player_id == player2._id]

        p1_success = sum(1 for s in p1_shots if s.result)
        p2_success = sum(1 for s in p2_shots if s.result)

        # Determine match quality
        total_shots = len(shots)
        success_rate = (p1_success + p2_success) / total_shots if total_shots > 0 else 0

        if success_rate > 0.7:
            match_quality = "high-quality"
        elif success_rate > 0.5:
            match_quality = "solid"
        else:
            match_quality = "competitive"

        # Generate summary narrative
        winner = player1 if match.winner_id == player1._id else player2
        template = random.choice(self.narrative_templates["match_conclusion"])
        conclusion = template.format(
            shot_count=total_shots,
            match_intensity="intense" if total_shots > 20 else "quick",
            match_quality=match_quality,
        )

        return {
            "winner": winner.username,
            "shot_count": total_shots,
            "match_quality": match_quality,
            "conclusion": conclusion,
        }

    def _generate_match_statistics(
        self, shots: List[Shot], player1: Player, player2: Player
    ) -> Dict[str, Any]:
        """
        Generate detailed match statistics
        """
        p1_shots = [s for s in shots if s.player_id == player1._id]
        p2_shots = [s for s in shots if s.player_id == player2._id]

        return {
            "players": {
                player1.username: self._calculate_player_stats(p1_shots),
                player2.username: self._calculate_player_stats(p2_shots),
            },
            "match_pace": self._calculate_match_pace(shots),
            "shot_distribution": self._calculate_shot_distribution(shots),
        }

    def _calculate_player_stats(self, shots: List[Shot]) -> Dict[str, Any]:
        """
        Calculate detailed statistics for a player's shots
        """
        if not shots:
            return {"total_shots": 0, "success_rate": 0, "average_difficulty": 0}

        total_shots = len(shots)
        successful_shots = sum(1 for s in shots if s.result)

        difficulties = [
            self.shot_analysis._calculate_difficulty(s.power, s.angle, s.spin, s.english)
            for s in shots
        ]

        return {
            "total_shots": total_shots,
            "success_rate": successful_shots / total_shots,
            "average_difficulty": sum(difficulties) / total_shots,
        }

    def _calculate_match_pace(self, shots: List[Shot]) -> str:
        """
        Calculate the pace of the match
        """
        if len(shots) < 2:
            return "N/A"

        # Calculate average time between shots
        shot_times = [s.timestamp for s in shots]
        time_diffs = [(t2 - t1).total_seconds() for t1, t2 in zip(shot_times[:-1], shot_times[1:])]
        avg_time = sum(time_diffs) / len(time_diffs)

        if avg_time < 20:
            return "Fast-paced"
        elif avg_time < 40:
            return "Moderate"
        else:
            return "Methodical"

    def _calculate_shot_distribution(self, shots: List[Shot]) -> Dict[str, float]:
        """
        Calculate the distribution of shot types
        """
        shot_types = {}
        total_shots = len(shots)

        for shot in shots:
            shot_type = self.shot_analysis._determine_shot_type(shot.power, shot.spin, shot.result)
            shot_types[shot_type] = shot_types.get(shot_type, 0) + 1

        return {shot_type: count / total_shots for shot_type, count in shot_types.items()}

    def _determine_shot_significance(self, analysis: Dict[str, Any]) -> str:
        """
        Determine the significance of a shot based on its analysis
        """
        effectiveness = analysis["effectiveness"]
        difficulty = analysis["difficulty"]

        if effectiveness > 0.8 and difficulty > 0.7:
            return "Match-defining"
        elif effectiveness > 0.7 or difficulty > 0.6:
            return "Significant"
        else:
            return "Standard"
