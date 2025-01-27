"""Game strategy service for AI-driven strategy recommendations."""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from tensorflow.keras.models import load_model
from services.shot_analysis import ShotAnalysis
from models.game_state import GameState
from models.player import Player
from src.core.config import AI_CONFIG
from src.extensions import cache


@dataclass
class PositionAnalysis:
    """Analysis of table position and shot options."""

    difficulty: float  # 0-1 scale
    shot_options: List[Dict[str, Any]]  # List of possible shots
    position_quality: float  # 0-1 scale
    safety_options: List[Dict[str, Any]]  # Defensive options
    risk_reward_ratio: float  # Risk vs reward assessment
    strategic_value: float  # Overall strategic value


@dataclass
class StrategyRecommendation:
    """Strategic recommendation for the current game state."""

    recommended_shot: Dict[str, Any]  # Primary shot recommendation
    alternative_shots: List[Dict[str, Any]]  # Alternative options
    position_plan: List[Dict[str, Any]]  # Future position considerations
    safety_plan: Optional[Dict[str, Any]]  # Defensive strategy if needed
    success_probability: float  # Estimated success rate
    confidence_score: float  # Confidence in recommendation
    strategic_notes: List[str]  # Additional strategic insights


class GameStrategy:
    """Service for analyzing game situations and recommending strategies."""

    def __init__(self):
        """Initialize the game strategy service."""
        # Load ML models
        self.position_analyzer = load_model(AI_CONFIG["position_analyzer_path"])
        self.shot_selector = load_model(AI_CONFIG["shot_selector_path"])
        self.strategy_predictor = load_model(AI_CONFIG["strategy_predictor_path"])

        # Initialize shot analysis
        self.shot_analysis = ShotAnalysis()

        # Strategy parameters
        self.risk_threshold = 0.7  # Threshold for high-risk shots
        self.position_weight = 0.6  # Weight for position play importance
        self.safety_threshold = 0.4  # Threshold for considering safety play

    async def analyze_position(self, game_state: GameState, player: Player) -> PositionAnalysis:
        """Analyze the current table position.

        Args:
            game_state: Current state of the game
            player: Player to analyze for

        Returns:
            PositionAnalysis containing detailed position assessment
        """
        # Extract position features
        features = self._extract_position_features(game_state)

        # Get model predictions
        predictions = self.position_analyzer.predict(features)

        # Generate shot options
        shot_options = self._generate_shot_options(game_state, player)

        # Calculate position quality
        position_quality = self._calculate_position_quality(game_state, shot_options)

        # Generate safety options
        safety_options = self._generate_safety_options(game_state)

        # Calculate risk-reward ratio
        risk_reward = self._calculate_risk_reward(
            shot_options, position_quality, game_state.score_difference
        )

        # Calculate strategic value
        strategic_value = self._calculate_strategic_value(position_quality, risk_reward, game_state)

        return PositionAnalysis(
            difficulty=float(predictions[0]),
            shot_options=shot_options,
            position_quality=position_quality,
            safety_options=safety_options,
            risk_reward_ratio=risk_reward,
            strategic_value=strategic_value,
        )

    async def get_strategy_recommendation(
        self,
        game_state: GameState,
        player: Player,
        position_analysis: Optional[PositionAnalysis] = None,
    ) -> StrategyRecommendation:
        """Get strategic recommendations for the current game situation.

        Args:
            game_state: Current state of the game
            player: Player to generate recommendations for
            position_analysis: Optional pre-computed position analysis

        Returns:
            StrategyRecommendation containing detailed strategic advice
        """
        # Get position analysis if not provided
        if position_analysis is None:
            position_analysis = await self.analyze_position(game_state, player)

        # Extract strategy features
        features = self._extract_strategy_features(game_state, position_analysis, player)

        # Get model predictions
        predictions = self.strategy_predictor.predict(features)

        # Select optimal shot
        recommended_shot = self._select_optimal_shot(
            position_analysis.shot_options, predictions, game_state
        )

        # Generate alternative shots
        alternative_shots = self._generate_alternatives(
            position_analysis.shot_options, recommended_shot, game_state
        )

        # Generate position plan
        position_plan = self._generate_position_plan(recommended_shot, game_state)

        # Consider safety play
        safety_plan = self._consider_safety_play(position_analysis, game_state)

        # Calculate success probability
        success_prob = self._calculate_success_probability(recommended_shot, player, game_state)

        # Calculate confidence score
        confidence = self._calculate_confidence_score(
            recommended_shot, position_analysis, success_prob
        )

        # Generate strategic notes
        notes = self._generate_strategic_notes(recommended_shot, position_analysis, game_state)

        return StrategyRecommendation(
            recommended_shot=recommended_shot,
            alternative_shots=alternative_shots,
            position_plan=position_plan,
            safety_plan=safety_plan,
            success_probability=success_prob,
            confidence_score=confidence,
            strategic_notes=notes,
        )

    def _extract_position_features(self, game_state: GameState) -> np.ndarray:
        """Extract features for position analysis."""
        features = []

        # Ball positions
        for ball in game_state.balls:
            features.extend([ball.x / game_state.table_width, ball.y / game_state.table_length])

        # Cue ball position
        features.extend(
            [
                game_state.cue_ball.x / game_state.table_width,
                game_state.cue_ball.y / game_state.table_length,
            ]
        )

        # Difficulty factors
        features.extend(
            [
                len(game_state.obstacles) / 10,  # Normalize obstacle count
                game_state.difficulty_rating,
            ]
        )

        return np.array(features).reshape(1, -1)

    def _generate_shot_options(self, game_state: GameState, player: Player) -> List[Dict[str, Any]]:
        """Generate possible shots for the current position."""
        options = []

        for ball in game_state.legal_targets:
            # Direct shots
            direct = self._analyze_direct_shot(ball, game_state)
            if direct:
                options.append(direct)

            # Bank shots
            bank = self._analyze_bank_shot(ball, game_state)
            if bank:
                options.append(bank)

            # Combination shots
            combos = self._analyze_combination_shots(ball, game_state)
            options.extend(combos)

        # Filter options based on player skill level
        return self._filter_options_by_skill(options, player)

    def _calculate_position_quality(
        self, game_state: GameState, shot_options: List[Dict[str, Any]]
    ) -> float:
        """Calculate the quality of the current position."""
        if not shot_options:
            return 0.0

        # Weighted factors
        num_options = len(shot_options)
        avg_difficulty = np.mean([opt["difficulty"] for opt in shot_options])
        position_potential = self._assess_position_potential(game_state)

        # Combine factors
        quality = (
            0.4 * (1 - avg_difficulty)  # Lower difficulty is better
            + 0.3 * min(1.0, num_options / 5)  # More options is better
            + 0.3 * position_potential  # Better future position potential
        )

        return max(0.0, min(1.0, quality))

    def _generate_safety_options(self, game_state: GameState) -> List[Dict[str, Any]]:
        """Generate defensive options."""
        options = []

        # Basic safety shots
        basic = self._analyze_basic_safety(game_state)
        if basic:
            options.append(basic)

        # Bank safeties
        bank = self._analyze_bank_safety(game_state)
        if bank:
            options.append(bank)

        # Snooker opportunities
        snooker = self._analyze_snooker_options(game_state)
        options.extend(snooker)

        return options

    def _calculate_risk_reward(
        self, shot_options: List[Dict[str, Any]], position_quality: float, score_difference: int
    ) -> float:
        """Calculate risk vs reward ratio."""
        if not shot_options:
            return 0.0

        # Get best shot option
        best_shot = max(shot_options, key=lambda x: x["success_probability"])

        # Calculate base risk-reward
        risk = 1 - best_shot["success_probability"]
        reward = position_quality * (1 + 0.1 * abs(score_difference))

        # Adjust based on game situation
        if score_difference < 0:  # Behind in score
            reward *= 1.2  # Increase reward weight when behind
        elif score_difference > 0:  # Ahead in score
            risk *= 1.2  # Increase risk weight when ahead

        return reward / max(0.1, risk)  # Avoid division by zero

    def _calculate_strategic_value(
        self, position_quality: float, risk_reward: float, game_state: GameState
    ) -> float:
        """Calculate overall strategic value of the position."""
        # Base value from position quality
        value = 0.4 * position_quality

        # Add risk-reward component
        value += 0.3 * min(1.0, risk_reward / 5)

        # Add game situation component
        situation_value = self._assess_game_situation(game_state)
        value += 0.3 * situation_value

        return max(0.0, min(1.0, value))

    def _extract_strategy_features(
        self, game_state: GameState, position_analysis: PositionAnalysis, player: Player
    ) -> np.ndarray:
        """Extract features for strategy prediction."""
        features = []

        # Position features
        features.extend(
            [
                position_analysis.difficulty,
                position_analysis.position_quality,
                position_analysis.risk_reward_ratio,
                position_analysis.strategic_value,
            ]
        )

        # Game state features
        features.extend(
            [
                game_state.score_difference / 10,  # Normalize score difference
                game_state.remaining_balls / 15,  # Normalize remaining balls
                game_state.difficulty_rating,
            ]
        )

        # Player features
        features.extend(
            [player.skill_level / 100, player.consistency / 100, player.risk_tolerance / 100]
        )

        return np.array(features).reshape(1, -1)

    def _select_optimal_shot(
        self, shot_options: List[Dict[str, Any]], predictions: np.ndarray, game_state: GameState
    ) -> Dict[str, Any]:
        """Select the optimal shot based on strategy predictions."""
        if not shot_options:
            return {}

        # Calculate shot scores
        scores = []
        for shot in shot_options:
            base_score = shot["success_probability"]

            # Adjust for position play
            position_factor = self.position_weight * shot.get("position_quality", 0.5)

            # Adjust for game situation
            situation_factor = self._get_situation_factor(game_state)

            # Adjust for risk tolerance
            risk_factor = self._get_risk_factor(game_state)

            # Calculate final score
            score = (
                (base_score * (1 - self.position_weight) + position_factor)
                * situation_factor
                * risk_factor
            )

            scores.append(score)

        # Select shot with highest score
        best_index = np.argmax(scores)
        return shot_options[best_index]

    def _generate_alternatives(
        self,
        shot_options: List[Dict[str, Any]],
        recommended_shot: Dict[str, Any],
        game_state: GameState,
    ) -> List[Dict[str, Any]]:
        """Generate alternative shots."""
        if not shot_options or not recommended_shot:
            return []

        # Remove recommended shot from options
        alternatives = [shot for shot in shot_options if shot != recommended_shot]

        # Sort by score
        scored_alternatives = []
        for shot in alternatives:
            score = self._calculate_alternative_score(shot, recommended_shot, game_state)
            scored_alternatives.append((score, shot))

        # Sort and return top 3 alternatives
        scored_alternatives.sort(reverse=True)
        return [shot for _, shot in scored_alternatives[:3]]

    def _generate_position_plan(
        self, recommended_shot: Dict[str, Any], game_state: GameState
    ) -> List[Dict[str, Any]]:
        """Generate a plan for position play."""
        if not recommended_shot:
            return []

        plan = []

        # Analyze immediate position
        next_position = self._predict_next_position(recommended_shot, game_state)
        plan.append(
            {
                "phase": "immediate",
                "position": next_position,
                "quality": self._assess_position_quality(next_position),
                "options": self._predict_next_options(next_position),
            }
        )

        # Look ahead one more shot if possible
        if plan[0]["options"]:
            future_position = self._predict_future_position(plan[0], game_state)
            plan.append(
                {
                    "phase": "future",
                    "position": future_position,
                    "quality": self._assess_position_quality(future_position),
                    "options": self._predict_next_options(future_position),
                }
            )

        return plan

    def _consider_safety_play(
        self, position_analysis: PositionAnalysis, game_state: GameState
    ) -> Optional[Dict[str, Any]]:
        """Consider whether to recommend a safety play."""
        # Check if safety threshold is met
        if (
            position_analysis.risk_reward_ratio > self.risk_threshold
            or not position_analysis.safety_options
        ):
            return None

        # Score safety options
        scored_safeties = []
        for safety in position_analysis.safety_options:
            score = self._calculate_safety_score(safety, game_state)
            scored_safeties.append((score, safety))

        if not scored_safeties:
            return None

        # Return highest scored safety
        scored_safeties.sort(reverse=True)
        best_safety = scored_safeties[0][1]

        return {
            "shot": best_safety,
            "reasoning": self._generate_safety_reasoning(best_safety, game_state),
            "success_probability": best_safety["success_probability"],
            "defensive_value": best_safety["defensive_value"],
        }

    def _calculate_success_probability(
        self, shot: Dict[str, Any], player: Player, game_state: GameState
    ) -> float:
        """Calculate probability of success for a shot."""
        if not shot:
            return 0.0

        # Base probability from shot
        base_prob = shot["success_probability"]

        # Adjust for player skill
        skill_factor = player.skill_level / 100

        # Adjust for game situation
        pressure_factor = self._calculate_pressure_factor(game_state)

        # Adjust for shot difficulty
        difficulty_factor = 1 - (shot["difficulty"] * 0.5)

        # Combine factors
        probability = base_prob * skill_factor * pressure_factor * difficulty_factor

        return max(0.0, min(1.0, probability))

    def _calculate_confidence_score(
        self, shot: Dict[str, Any], position_analysis: PositionAnalysis, success_probability: float
    ) -> float:
        """Calculate confidence in the recommendation."""
        if not shot:
            return 0.0

        # Factors affecting confidence
        factors = [
            success_probability,
            position_analysis.position_quality,
            1 - position_analysis.difficulty,  # Lower difficulty = higher confidence
            min(1.0, len(position_analysis.shot_options) / 3),  # More options = higher confidence
        ]

        # Calculate weighted average
        weights = [0.4, 0.3, 0.2, 0.1]
        confidence = sum(f * w for f, w in zip(factors, weights))

        return max(0.0, min(1.0, confidence))

    def _generate_strategic_notes(
        self, shot: Dict[str, Any], position_analysis: PositionAnalysis, game_state: GameState
    ) -> List[str]:
        """Generate strategic insights and notes."""
        notes = []

        # Shot selection reasoning
        notes.append(
            f"Selected {shot['type']} shot with {shot['success_probability']:.0%} "
            f"success probability"
        )

        # Position considerations
        if position_analysis.position_quality > 0.7:
            notes.append("Excellent position for follow-up shots")
        elif position_analysis.position_quality < 0.3:
            notes.append("Limited position options - careful consideration needed")

        # Risk-reward assessment
        if position_analysis.risk_reward_ratio > self.risk_threshold:
            notes.append("High risk-reward ratio - aggressive play recommended")
        elif position_analysis.risk_reward_ratio < self.safety_threshold:
            notes.append("Low risk-reward ratio - consider safety play")

        # Game situation notes
        if game_state.score_difference < 0:
            notes.append("Behind in score - prioritize high percentage shots")
        elif game_state.score_difference > 0:
            notes.append("Ahead in score - focus on position and control")

        return notes

    def _analyze_direct_shot(self, target: Any, game_state: GameState) -> Optional[Dict[str, Any]]:
        """Analyze possibility of direct shot."""
        # Implementation would include geometry calculations
        pass

    def _analyze_bank_shot(self, target: Any, game_state: GameState) -> Optional[Dict[str, Any]]:
        """Analyze possibility of bank shot."""
        # Implementation would include geometry calculations
        pass

    def _analyze_combination_shots(
        self, target: Any, game_state: GameState
    ) -> List[Dict[str, Any]]:
        """Analyze possible combination shots."""
        # Implementation would include geometry calculations
        pass

    def _filter_options_by_skill(
        self, options: List[Dict[str, Any]], player: Player
    ) -> List[Dict[str, Any]]:
        """Filter shot options based on player skill level."""
        # Implementation would include skill-based filtering
        pass

    def _assess_position_potential(self, game_state: GameState) -> float:
        """Assess potential for future position."""
        # Implementation would include position analysis
        pass

    def _analyze_basic_safety(self, game_state: GameState) -> Optional[Dict[str, Any]]:
        """Analyze basic safety options."""
        # Implementation would include safety analysis
        pass

    def _analyze_bank_safety(self, game_state: GameState) -> Optional[Dict[str, Any]]:
        """Analyze bank safety options."""
        # Implementation would include bank safety analysis
        pass

    def _analyze_snooker_options(self, game_state: GameState) -> List[Dict[str, Any]]:
        """Analyze possible snooker opportunities."""
        # Implementation would include snooker analysis
        pass

    def _assess_game_situation(self, game_state: GameState) -> float:
        """Assess the current game situation."""
        # Implementation would include game state analysis
        pass

    def _get_situation_factor(self, game_state: GameState) -> float:
        """Get factor based on game situation."""
        # Implementation would include situation analysis
        pass

    def _get_risk_factor(self, game_state: GameState) -> float:
        """Get factor based on risk assessment."""
        # Implementation would include risk analysis
        pass

    def _calculate_alternative_score(
        self, shot: Dict[str, Any], recommended: Dict[str, Any], game_state: GameState
    ) -> float:
        """Calculate score for alternative shot."""
        # Implementation would include scoring logic
        pass

    def _predict_next_position(self, shot: Dict[str, Any], game_state: GameState) -> Any:
        """Predict position after shot."""
        # Implementation would include position prediction
        pass

    def _predict_next_options(self, position: Any) -> List[Dict[str, Any]]:
        """Predict available options from position."""
        # Implementation would include options analysis
        pass

    def _predict_future_position(self, current: Dict[str, Any], game_state: GameState) -> Any:
        """Predict future position possibilities."""
        # Implementation would include future position analysis
        pass

    def _calculate_safety_score(self, safety: Dict[str, Any], game_state: GameState) -> float:
        """Calculate score for a safety shot."""
        # Implementation would include safety scoring
        pass

    def _generate_safety_reasoning(self, safety: Dict[str, Any], game_state: GameState) -> str:
        """Generate reasoning for safety shot."""
        # Implementation would include reasoning logic
        pass

    def _calculate_pressure_factor(self, game_state: GameState) -> float:
        """Calculate factor based on game pressure."""
        # Implementation would include pressure analysis
        pass
