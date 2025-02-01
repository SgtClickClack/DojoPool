from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from models.game_analytics import GameAnalytics
from sqlalchemy.orm import Session

from utils.ml_utils import GameAnalyticsML


class MLService:
    def __init__(self, db: Session):
        self.db = db
        self.ml = GameAnalyticsML()

    def analyze_player_performance(self, player_id: int) -> Dict:
        """Analyze player's performance using ML models."""
        # Get player's match history
        matches = self.db.query(GameAnalytics).filter(GameAnalytics.player_id == player_id).all()

        if not matches:
            return {"status": "error", "message": "No match data found for player"}

        # Convert matches to DataFrame
        matches_data = [match.to_dict() for match in matches]
        df = self.ml.prepare_features(matches_data)

        # Extract patterns
        patterns = self.ml.extract_patterns(matches_data)

        # Detect anomalies
        anomalies = self.ml.detect_anomalies(df)

        # Generate training plan
        training_plan = self.ml.generate_training_plan(pd.DataFrame(matches_data))

        return {
            "status": "success",
            "patterns": patterns,
            "anomalies": anomalies.tolist(),
            "training_plan": training_plan,
        }

    def predict_player_performance(self, player_id: int, opponent_id: Optional[int] = None) -> Dict:
        """Predict player's performance in upcoming matches."""
        # Get player's match history
        player_matches = (
            self.db.query(GameAnalytics).filter(GameAnalytics.player_id == player_id).all()
        )

        if not player_matches:
            return {"status": "error", "message": "No match data found for player"}

        # Prepare features
        matches_data = [match.to_dict() for match in player_matches]
        features = self.ml.prepare_features(matches_data)

        # Get performance targets
        targets = np.array([match.performance_score for match in player_matches])

        # Train model if needed
        if len(matches_data) >= 10:  # Minimum matches for training
            self.ml.train_performance_model(features, targets)

        # Predict performance
        predicted_performance = self.ml.predict_performance(features)

        # Get opponent data if provided
        opponent_prediction = None
        if opponent_id:
            opponent_matches = (
                self.db.query(GameAnalytics).filter(GameAnalytics.player_id == opponent_id).all()
            )
            if opponent_matches:
                opponent_data = [match.to_dict() for match in opponent_matches]
                opponent_features = self.ml.prepare_features(opponent_data)
                opponent_prediction = self.ml.predict_performance(opponent_features)

        return {
            "status": "success",
            "predicted_performance": predicted_performance.tolist(),
            "opponent_prediction": (
                opponent_prediction.tolist() if opponent_prediction is not None else None
            ),
            "confidence": self._calculate_prediction_confidence(predicted_performance),
        }

    def analyze_match_patterns(self, match_id: int) -> Dict:
        """Analyze patterns in a specific match."""
        match = self.db.query(GameAnalytics).filter(GameAnalytics.match_id == match_id).first()

        if not match:
            return {"status": "error", "message": "Match not found"}

        # Extract patterns from match data
        patterns = self.ml.extract_patterns([match.to_dict()])

        return {
            "status": "success",
            "patterns": patterns,
            "insights": self._generate_match_insights(patterns),
        }

    def generate_training_recommendations(self, player_id: int) -> Dict:
        """Generate personalized training recommendations."""
        # Get player's recent matches
        recent_matches = (
            self.db.query(GameAnalytics)
            .filter(GameAnalytics.player_id == player_id)
            .order_by(GameAnalytics.timestamp.desc())
            .limit(10)
            .all()
        )

        if not recent_matches:
            return {"status": "error", "message": "No recent matches found for player"}

        # Generate training plan
        matches_data = [match.to_dict() for match in recent_matches]
        training_plan = self.ml.generate_training_plan(pd.DataFrame(matches_data))

        return {
            "status": "success",
            "training_plan": training_plan,
            "focus_areas": training_plan["focus_areas"],
            "recommended_drills": training_plan["drills"],
        }

    def _calculate_prediction_confidence(self, predictions: np.ndarray) -> float:
        """Calculate confidence score for predictions."""
        if len(predictions) < 2:
            return 0.5

        # Calculate confidence based on prediction variance
        variance = np.var(predictions)
        confidence = 1 / (1 + variance)  # Transform to 0-1 scale
        return float(confidence)

    def _generate_match_insights(self, patterns: Dict) -> List[str]:
        """Generate insights from match patterns."""
        insights = []

        # Shot patterns insights
        if patterns["shot_patterns"]["accuracy_trend"] == "improving":
            insights.append("Shot accuracy shows improvement")
        elif patterns["shot_patterns"]["accuracy_trend"] == "declining":
            insights.append("Shot accuracy needs attention")

        # Position patterns insights
        defensive_tendency = patterns["position_patterns"]["defensive_tendency"]
        if defensive_tendency > 1.5:
            insights.append("Playing style is notably defensive")
        elif defensive_tendency < 0.5:
            insights.append("Playing style is highly aggressive")

        # Performance patterns insights
        stamina_trend = patterns["performance_patterns"]["stamina_management"]["stamina_trend"]
        if stamina_trend == "declining":
            insights.append("Stamina management needs improvement")

        pressure_handling = patterns["performance_patterns"]["pressure_handling"]
        if pressure_handling["pressure_success_rate"] < 0.5:
            insights.append("Performance under pressure needs work")

        return insights
