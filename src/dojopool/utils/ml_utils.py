import os
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler


class GameAnalyticsML:
    def __init__(self, model_path: str = "models"):
        self.model_path = model_path
        self.scaler = StandardScaler()
        self.performance_model = None
        self.anomaly_detector = None
        os.makedirs(model_path, exist_ok=True)

    def prepare_features(self, matches_data: List[Dict]) -> pd.DataFrame:
        """Convert raw match data into feature matrix."""
        features = []
        for match in matches_data:
            feature_dict = {
                "duration": match.get("duration", 0),
                "shots_taken": match.get("shots_taken", 0),
                "shots_hit": match.get("shots_hit", 0),
                "accuracy": match.get("shots_hit", 0)
                / max(match.get("shots_taken", 1), 1),
                "avg_shot_power": match.get("avg_shot_power", 0),
                "avg_shot_angle": match.get("avg_shot_angle", 0),
                "position_changes": match.get("position_changes", 0),
                "defensive_actions": match.get("defensive_actions", 0),
                "offensive_actions": match.get("offensive_actions", 0),
                "stamina_end": match.get("stamina_end", 0),
                "pressure_situations": match.get("pressure_situations", 0),
                "successful_pressure_shots": match.get("successful_pressure_shots", 0),
            }
            features.append(feature_dict)
        return pd.DataFrame(features)

    def extract_patterns(self, matches_data: List[Dict]):
        """Extract gameplay patterns from match data."""
        df = self.prepare_features(matches_data)
        patterns = {
            "shot_patterns": self._analyze_shot_patterns(df),
            "position_patterns": self._analyze_position_patterns(df),
            "performance_patterns": self._analyze_performance_patterns(df),
        }
        return patterns

    def _analyze_shot_patterns(self, df: pd.DataFrame):
        """Analyze patterns in shot-taking behavior."""
        return {
            "accuracy_trend": self._calculate_trend(df["accuracy"]),
            "power_distribution": {
                "mean": df["avg_shot_power"].mean(),
                "std": df["avg_shot_power"].std(),
                "percentiles": df["avg_shot_power"]
                .quantile([0.25, 0.5, 0.75])
                .to_dict(),
            },
            "angle_preference": self._calculate_angle_preference(df["avg_shot_angle"]),
        }

    def _analyze_position_patterns(self, df: pd.DataFrame) -> Dict:
        """Analyze patterns in positioning and movement."""
        return {
            "movement_frequency": df["position_changes"].mean(),
            "defensive_tendency": df["defensive_actions"].sum()
            / max(df["offensive_actions"].sum(), 1),
            "position_heatmap": self._calculate_position_heatmap(df),
        }

    def _analyze_performance_patterns(self, df: pd.DataFrame):
        """Analyze patterns in overall performance."""
        return {
            "stamina_management": self._analyze_stamina_pattern(df),
            "pressure_handling": self._analyze_pressure_handling(df),
            "consistency": self._calculate_consistency(df),
        }

    def train_performance_model(self, features: pd.DataFrame, targets: np.ndarray):
        """Train a model to predict player performance."""
        X = self.scaler.fit_transform(features)
        self.performance_model = RandomForestRegressor(
            n_estimators=100, random_state=42
        )
        self.performance_model.fit(X, targets)
        joblib.dump(
            self.performance_model,
            os.path.join(self.model_path, "performance_model.joblib"),
        )
        joblib.dump(self.scaler, os.path.join(self.model_path, "scaler.joblib"))

    def predict_performance(self, features: pd.DataFrame):
        """Predict player performance based on features."""
        if self.performance_model is None:
            self.performance_model = joblib.load(
                os.path.join(self.model_path, "performance_model.joblib")
            )
            self.scaler = joblib.load(os.path.join(self.model_path, "scaler.joblib"))
        X = self.scaler.transform(features)
        return self.performance_model.predict(X)

    def detect_anomalies(self, features: pd.DataFrame):
        """Detect anomalous performance patterns."""
        if self.anomaly_detector is None:
            self.anomaly_detector = IsolationForest(random_state=42)
            self.anomaly_detector.fit(features)
            joblib.dump(
                self.anomaly_detector,
                os.path.join(self.model_path, "anomaly_detector.joblib"),
            )
        return self.anomaly_detector.predict(features)

    def generate_training_plan(self, performance_history: pd.DataFrame) -> Dict:
        """Generate personalized training plan based on performance history."""
        patterns = self.extract_patterns(performance_history.to_dict("records"))
        weaknesses = self._identify_weaknesses(patterns)
        return {
            "focus_areas": weaknesses,
            "drills": self._recommend_drills(weaknesses),
            "intensity": self._calculate_training_intensity(patterns),
            "progression": self._design_progression_plan(patterns),
        }

    def _calculate_trend(self, series: pd.Series):
        """Calculate trend direction for a metric."""
        if len(series) < 2:
            return "stable"
        slope = np.polyfit(range(len(series)), series, 1)[0]
        if slope > 0.1:
            return "improving"
        elif slope < -0.1:
            return "declining"
        return "stable"

    def _calculate_angle_preference(self, angles: pd.Series) -> Dict:
        """Calculate preferred shooting angles."""
        bins = pd.cut(angles, bins=8)
        return bins.value_counts().to_dict()

    def _calculate_position_heatmap(self, df: pd.DataFrame):
        """Generate position heatmap from movement data."""
        # Implement position heatmap calculation
        return {}

    def _analyze_stamina_pattern(self, df: pd.DataFrame):
        """Analyze stamina management patterns."""
        return {
            "stamina_trend": self._calculate_trend(df["stamina_end"]),
            "stamina_efficiency": df["stamina_end"].mean() / df["duration"].mean(),
        }

    def _analyze_pressure_handling(self, df: pd.DataFrame):
        """Analyze performance under pressure."""
        pressure_success_rate = df["successful_pressure_shots"].sum() / max(
            df["pressure_situations"].sum(), 1
        )
        return {
            "pressure_success_rate": pressure_success_rate,
            "pressure_frequency": df["pressure_situations"].mean(),
        }

    def _calculate_consistency(self, df: pd.DataFrame) -> float:
        """Calculate player consistency score."""
        metrics = ["accuracy", "avg_shot_power", "stamina_end"]
        consistency_scores = []
        for metric in metrics:
            if metric in df.columns:
                consistency_scores.append(1 - df[metric].std() / df[metric].mean())
        return np.mean(consistency_scores) if consistency_scores else 0.0

    def _identify_weaknesses(self, patterns: Dict) -> List[str]:
        """Identify areas needing improvement."""
        weaknesses = []
        if patterns["shot_patterns"]["accuracy_trend"] == "declining":
            weaknesses.append("shot_accuracy")
        if (
            patterns["performance_patterns"]["pressure_handling"][
                "pressure_success_rate"
            ]
            < 0.5
        ):
            weaknesses.append("pressure_handling")
        if (
            patterns["performance_patterns"]["stamina_management"]["stamina_trend"]
            == "declining"
        ):
            weaknesses.append("stamina_management")
        return weaknesses

    def _recommend_drills(self, weaknesses: List[str]):
        """Recommend specific drills based on identified weaknesses."""
        drill_recommendations = []
        for weakness in weaknesses:
            drills = self._get_drills_for_weakness(weakness)
            drill_recommendations.extend(drills)
        return drill_recommendations

    def _get_drills_for_weakness(self, weakness: str):
        """Get specific drills for a weakness."""
        drill_database = {
            "shot_accuracy": [
                {"name": "Target Practice", "duration": 20, "intensity": "medium"},
                {"name": "Precision Shooting", "duration": 15, "intensity": "high"},
            ],
            "pressure_handling": [
                {"name": "Time Trial Shots", "duration": 10, "intensity": "high"},
                {
                    "name": "Pressure Point Practice",
                    "duration": 15,
                    "intensity": "medium",
                },
            ],
            "stamina_management": [
                {"name": "Endurance Training", "duration": 30, "intensity": "medium"},
                {"name": "Interval Training", "duration": 20, "intensity": "high"},
            ],
        }
        return drill_database.get(weakness, [])

    def _calculate_training_intensity(self, patterns: Dict):
        """Calculate recommended training intensity."""
        stamina_trend = patterns["performance_patterns"]["stamina_management"][
            "stamina_trend"
        ]
        if stamina_trend == "declining":
            return "medium"
        return "high"

    def _design_progression_plan(self, patterns: Dict) -> List[Dict]:
        """Design a progression plan based on patterns."""
        return [
            {"week": 1, "focus": "fundamentals", "intensity": "medium"},
            {"week": 2, "focus": "advanced_techniques", "intensity": "high"},
            {"week": 3, "focus": "specialization", "intensity": "high"},
            {"week": 4, "focus": "mastery", "intensity": "medium"},
        ]
