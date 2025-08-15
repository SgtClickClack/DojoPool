"""Machine learning module for game prediction and pattern analysis.

This module provides ML-based predictions and pattern recognition for pool games.
"""

import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler

from .ab_testing import ABTest, ModelVariant
from .model_monitor import ModelMonitor
from .model_versioning import ModelVersion


class GamePredictor:
    """ML-based game prediction and pattern analysis."""

    def __init__(self, model_path: Optional[str] = None):
        """Initialize predictor.

        Args:
            model_path: Optional path to saved model
        """
        self.shot_classifier = None
        self.success_predictor = None
        self.position_predictor = None
        self.scaler = StandardScaler()
        self.monitor = ModelMonitor()
        self.version_manager = ModelVersion(model_path or "models")

        # Version IDs
        self.active_versions = {"shot": None, "success": None, "position": None}

        # A/B testing
        self.active_tests: Dict[str, ABTest] = {}
        self.test_variants: Dict[str, Dict[str, ModelVariant]] = {
            "shot": {},
            "success": {},
            "position": {},
        }

        if model_path:
            self._load_active_versions()

    def _load_active_versions(self):
        """Load active model versions."""
        versions = self.version_manager.list_versions(status="active")
        for version in versions:
            model_type = version["metadata"]["model_type"]
            if model_type in self.active_versions:
                self.active_versions[model_type] = version["id"]
                model = self.version_manager.load_version(version["id"])
                setattr(self, f"{model_type}_predictor", model)

    def create_ab_test(
        self,
        name: str,
        model_type: str,
        variants: List[Dict],
        duration: timedelta,
        success_criteria: Dict[str, float],
    ) -> str:
        """Create a new A/B test.

        Args:
            name: Test name
            model_type: Type of model to test
            variants: List of variant configurations
            duration: Test duration
            success_criteria: Success criteria thresholds

        Returns:
            str: Test ID
        """
        test = ABTest(name=name, description=f"A/B test for {model_type} model")

        # Add variants
        total_traffic = 0
        for variant_config in variants:
            variant = ModelVariant(
                name=variant_config["name"],
                model=variant_config["model"],
                variant_type=variant_config.get("type", "experiment"),
            )
            traffic = variant_config.get(
                "traffic_percentage",
                (
                    (100 - total_traffic)
                    if variant_config.get("type") == "control"
                    else (100 - total_traffic) / (len(variants) - len(test.variants))
                ),
            )
            test.add_variant(variant, traffic)
            total_traffic += traffic

            # Store variant for lookup
            self.test_variants[model_type][variant.id] = variant

        # Set success criteria and start test
        test.set_success_criteria(success_criteria)
        test.start_test(duration)

        # Store active test
        self.active_tests[test.id] = test

        return test.id

    def get_ab_test_results(self, test_id: str) -> Dict[str, Any]:
        """Get results of an A/B test.

        Args:
            test_id: Test ID

        Returns:
            dict: Test results
        """
        if test_id not in self.active_tests:
            raise ValueError(f"Unknown test ID: {test_id}")

        test = self.active_tests[test_id]
        return test.get_results()

    def train_models(self, training_data: List[Dict]) -> Dict[str, float]:
        """Train prediction models on historical game data.

        Args:
            training_data: List of historical game records

        Returns:
            dict: Training metrics
        """
        # Prepare training data
        shot_features, shot_labels = self._prepare_shot_data(training_data)
        success_features, success_labels = self._prepare_success_data(training_data)
        position_features, position_targets = self._prepare_position_data(training_data)

        # Train and version shot classifier
        self.shot_classifier = RandomForestClassifier(n_estimators=100)
        X_shot_scaled = self.scaler.fit_transform(shot_features)
        self.shot_classifier.fit(X_shot_scaled, shot_labels)
        shot_accuracy = self.shot_classifier.score(X_shot_scaled, shot_labels)

        shot_version = self.version_manager.create_version(
            model=self.shot_classifier,
            metadata={
                "model_type": "shot",
                "training_size": len(shot_features),
                "parameters": self.shot_classifier.get_params(),
            },
        )
        self.active_versions["shot"] = shot_version

        # Train and version success predictor
        self.success_predictor = GradientBoostingRegressor(n_estimators=100)
        X_success_scaled = self.scaler.transform(success_features)
        self.success_predictor.fit(X_success_scaled, success_labels)
        success_mse = mean_squared_error(
            success_labels, self.success_predictor.predict(X_success_scaled)
        )

        success_version = self.version_manager.create_version(
            model=self.success_predictor,
            metadata={
                "model_type": "success",
                "training_size": len(success_features),
                "parameters": self.success_predictor.get_params(),
            },
        )
        self.active_versions["success"] = success_version

        # Train and version position predictor
        self.position_predictor = GradientBoostingRegressor(n_estimators=100)
        X_position_scaled = self.scaler.transform(position_features)
        self.position_predictor.fit(X_position_scaled, position_targets)
        position_mse = mean_squared_error(
            position_targets, self.position_predictor.predict(X_position_scaled)
        )

        position_version = self.version_manager.create_version(
            model=self.position_predictor,
            metadata={
                "model_type": "position",
                "training_size": len(position_features),
                "parameters": self.position_predictor.get_params(),
            },
        )
        self.active_versions["position"] = position_version

        # Update version metrics
        self.version_manager.update_metrics(
            shot_version,
            {"accuracy": shot_accuracy, "training_timestamp": datetime.utcnow().isoformat()},
        )

        self.version_manager.update_metrics(
            success_version,
            {"mse": success_mse, "training_timestamp": datetime.utcnow().isoformat()},
        )

        self.version_manager.update_metrics(
            position_version,
            {"mse": position_mse, "training_timestamp": datetime.utcnow().isoformat()},
        )

        return {
            "shot_type_accuracy": shot_accuracy,
            "success_prediction_mse": success_mse,
            "position_prediction_mse": position_mse,
            "training_timestamp": datetime.utcnow().isoformat(),
            "versions": {
                "shot": shot_version,
                "success": success_version,
                "position": position_version,
            },
        }

    def predict_shot_success(self, shot_data: Dict) -> Dict[str, Any]:
        """Predict success probability for a shot.

        Args:
            shot_data: Shot details

        Returns:
            dict: Prediction results
        """
        if not self.success_predictor:
            raise ValueError("Models not trained")

        # Check for active A/B test
        active_test = self._get_active_test("success")
        if active_test:
            variant_id, prediction = active_test.route_prediction(shot_data)

            # Record outcome when available
            if "result" in shot_data:
                active_test.record_outcome(
                    variant_id=variant_id, prediction=prediction, actual=shot_data["result"]
                )

            return prediction

        # Default prediction path
        start_time = time.time()
        features = self._extract_shot_features(shot_data)
        X_scaled = self.scaler.transform([features])

        success_prob = self.success_predictor.predict(X_scaled)[0]
        latency = time.time() - start_time

        prediction = {
            "success_probability": float(success_prob),
            "confidence": self._calculate_prediction_confidence(success_prob),
            "factors": self._analyze_success_factors(features, success_prob),
        }

        # Record prediction for monitoring
        self.monitor.record_prediction(
            model_type="success",
            prediction=prediction,
            actual=shot_data.get("result"),
            latency=latency,
        )

        return prediction

    def recommend_shot_type(self, game_state: Dict) -> Dict[str, Any]:
        """Recommend optimal shot type for current game state.

        Args:
            game_state: Current game state

        Returns:
            dict: Shot recommendations
        """
        if not self.shot_classifier:
            raise ValueError("Models not trained")

        # Check for active A/B test
        active_test = self._get_active_test("shot")
        if active_test:
            variant_id, prediction = active_test.route_prediction(game_state)
            return prediction

        # Default prediction path
        start_time = time.time()
        features = self._extract_game_state_features(game_state)
        X_scaled = self.scaler.transform([features])

        # Get probabilities for each shot type
        shot_probs = self.shot_classifier.predict_proba(X_scaled)[0]
        shot_types = self.shot_classifier.classes_
        latency = time.time() - start_time

        recommendations = []
        for shot_type, prob in zip(shot_types, shot_probs):
            if prob > 0.1:  # Only include shots with >10% probability
                recommendations.append(
                    {
                        "shot_type": shot_type,
                        "confidence": float(prob),
                        "difficulty": self._estimate_shot_difficulty(game_state, shot_type),
                    }
                )

        prediction = {
            "recommendations": sorted(recommendations, key=lambda x: x["confidence"], reverse=True),
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Record prediction for monitoring
        self.monitor.record_prediction(model_type="shot", prediction=prediction, latency=latency)

        return prediction

    def predict_optimal_position(self, game_state: Dict) -> Dict[str, Any]:
        """Predict optimal position play.

        Args:
            game_state: Current game state

        Returns:
            dict: Position recommendations
        """
        if not self.position_predictor:
            raise ValueError("Models not trained")

        # Check for active A/B test
        active_test = self._get_active_test("position")
        if active_test:
            variant_id, prediction = active_test.route_prediction(game_state)

            # Record outcome when available
            if "actual_position" in game_state:
                active_test.record_outcome(
                    variant_id=variant_id,
                    prediction=prediction,
                    actual=game_state["actual_position"],
                )

            return prediction

        # Default prediction path
        start_time = time.time()
        features = self._extract_game_state_features(game_state)
        X_scaled = self.scaler.transform([features])

        predicted_pos = self.position_predictor.predict(X_scaled)[0]
        latency = time.time() - start_time

        prediction = {
            "recommended_position": {"x": float(predicted_pos[0]), "y": float(predicted_pos[1])},
            "confidence": self._calculate_position_confidence(predicted_pos),
            "alternatives": self._generate_position_alternatives(game_state, predicted_pos),
        }

        # Record prediction for monitoring
        self.monitor.record_prediction(
            model_type="position",
            prediction=prediction,
            actual=game_state.get("actual_position"),
            latency=latency,
        )

        return prediction

    def analyze_patterns(self, shot_history: List[Dict]) -> Dict[str, Any]:
        """Analyze patterns in shot history using ML.

        Args:
            shot_history: List of historical shots

        Returns:
            dict: Pattern analysis results
        """
        if len(shot_history) < 5:
            return {"error": "Insufficient data for pattern analysis"}

        # Extract sequential patterns
        shot_sequences = self._extract_shot_sequences(shot_history)

        # Analyze success patterns
        success_patterns = self._analyze_success_patterns(shot_sequences)

        # Analyze position patterns
        position_patterns = self._analyze_position_patterns(shot_history)

        # Analyze player tendencies
        player_patterns = self._analyze_player_patterns(shot_history)

        return {
            "shot_sequences": shot_sequences,
            "success_patterns": success_patterns,
            "position_patterns": position_patterns,
            "player_patterns": player_patterns,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def save_models(self, path: str):
        """Save trained models to disk.

        Args:
            path: Save directory path
        """
        if not all([self.shot_classifier, self.success_predictor, self.position_predictor]):
            raise ValueError("Models not trained")

        # Save current versions
        for _model_type, version_id in self.active_versions.items():
            if version_id:
                self.version_manager.record_deployment(version_id, "production")

    def load_models(self, path: str):
        """Load trained models from disk.

        Args:
            path: Model directory path
        """
        self._load_active_versions()

    def get_model_versions(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all model versions.

        Returns:
            dict: Version information by model type
        """
        versions = self.version_manager.list_versions()
        version_by_type = {"shot": [], "success": [], "position": []}

        for version in versions:
            model_type = version["metadata"]["model_type"]
            if model_type in version_by_type:
                version_by_type[model_type].append(version)

        return version_by_type

    def compare_model_versions(
        self, model_type: str, version_id_1: str, version_id_2: str
    ) -> Dict[str, Any]:
        """Compare two versions of a model type.

        Args:
            model_type: Type of model to compare
            version_id_1: First version ID
            version_id_2: Second version ID

        Returns:
            dict: Comparison results
        """
        return self.version_manager.compare_versions(version_id_1, version_id_2)

    def _prepare_shot_data(self, training_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for shot type classification."""
        features = []
        labels = []

        for game in training_data:
            for shot in game["shot_history"]:
                features.append(self._extract_shot_features(shot))
                labels.append(shot.get("shot_type", "unknown"))

        return np.array(features), np.array(labels)

    def _prepare_success_data(self, training_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for success prediction."""
        features = []
        labels = []

        for game in training_data:
            for shot in game["shot_history"]:
                features.append(self._extract_shot_features(shot))
                labels.append(1.0 if shot.get("result") == "success" else 0.0)

        return np.array(features), np.array(labels)

    def _prepare_position_data(self, training_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare data for position prediction."""
        features = []
        targets = []

        for game in training_data:
            for shot in game["shot_history"]:
                if "position" in shot:
                    features.append(self._extract_shot_features(shot))
                    targets.append(shot["position"])

        return np.array(features), np.array(targets)

    def _extract_shot_features(self, shot: Dict) -> List[float]:
        """Extract numerical features from shot data."""
        return [
            shot.get("power", 0),
            shot.get("angle", 0) / 360,  # Normalize angle
            shot.get("english", 0),
            shot.get("elevation", 0),
            1.0 if shot.get("spin") else 0.0,
            shot.get("difficulty", 0),
        ]

    def _extract_game_state_features(self, game_state: Dict) -> List[float]:
        """Extract numerical features from game state."""
        features = [
            len(game_state.get("remaining_balls", [])) / 15,  # Normalize ball count
            game_state.get("score", {}).get("difference", 0) / 10,  # Normalize score diff
            1.0 if game_state.get("phase") == "endgame" else 0.0,
            len(game_state.get("called_shots", [])) / 10,  # Normalize called shots
        ]

        # Add ball position features if available
        if "ball_positions" in game_state:
            ball_pos = game_state["ball_positions"]
            features.extend(
                [ball_pos.get("cue_ball", {}).get("x", 0), ball_pos.get("cue_ball", {}).get("y", 0)]
            )

        return features

    def _calculate_prediction_confidence(self, probability: float) -> float:
        """Calculate confidence score for a prediction."""
        # Adjust confidence based on probability distance from 0.5
        return min(1.0, abs(probability - 0.5) * 2)

    def _analyze_success_factors(
        self, features: List[float], probability: float
    ) -> Dict[str, float]:
        """Analyze factors contributing to success probability."""
        feature_names = ["power", "angle", "english", "elevation", "spin", "difficulty"]
        importance = self.success_predictor.feature_importances_

        return {name: float(imp) for name, imp in zip(feature_names, importance)}

    def _estimate_shot_difficulty(self, game_state: Dict, shot_type: str) -> float:
        """Estimate difficulty of a shot type in current state."""
        features = self._extract_game_state_features(game_state)

        # Add shot type specific features
        shot_features = features + [
            1.0 if shot_type == "bank" else 0.0,
            1.0 if shot_type == "jump" else 0.0,
            1.0 if shot_type == "masse" else 0.0,
        ]

        X_scaled = self.scaler.transform([shot_features])
        difficulty = 1 - self.success_predictor.predict(X_scaled)[0]

        return float(difficulty)

    def _calculate_position_confidence(self, position: np.ndarray) -> float:
        """Calculate confidence in position prediction."""
        # Use prediction variance as confidence measure
        variance = self.position_predictor.predict_proba([position])[0].var()
        return float(1 - min(1, variance))

    def _generate_position_alternatives(
        self, game_state: Dict, primary_position: np.ndarray
    ) -> List[Dict[str, Any]]:
        """Generate alternative position plays."""
        features = self._extract_game_state_features(game_state)
        self.scaler.transform([features])

        # Generate variations around primary position
        alternatives = []
        for offset in [(0.1, 0), (-0.1, 0), (0, 0.1), (0, -0.1)]:
            alt_pos = primary_position + offset
            if 0 <= alt_pos[0] <= 1 and 0 <= alt_pos[1] <= 1:
                confidence = self._calculate_position_confidence(alt_pos)
                if confidence > 0.3:  # Only include reasonable alternatives
                    alternatives.append(
                        {
                            "position": {"x": float(alt_pos[0]), "y": float(alt_pos[1])},
                            "confidence": confidence,
                        }
                    )

        return sorted(alternatives, key=lambda x: x["confidence"], reverse=True)

    def _extract_shot_sequences(self, shot_history: List[Dict]) -> List[Dict[str, Any]]:
        """Extract meaningful shot sequences using ML."""
        sequences = []
        min_sequence_length = 3

        for i in range(len(shot_history) - min_sequence_length + 1):
            sequence = shot_history[i : i + min_sequence_length]
            pattern = self._identify_sequence_pattern(sequence)
            if pattern["significance"] > 0.5:
                sequences.append(pattern)

        return sorted(sequences, key=lambda x: x["significance"], reverse=True)

    def _identify_sequence_pattern(self, sequence: List[Dict]) -> Dict[str, Any]:
        """Identify pattern in a shot sequence."""
        features = [self._extract_shot_features(shot) for shot in sequence]
        success_rate = sum(1 for s in sequence if s.get("result") == "success") / len(sequence)

        return {
            "shots": sequence,
            "length": len(sequence),
            "success_rate": success_rate,
            "pattern_type": self._classify_pattern_type(features),
            "significance": self._calculate_pattern_significance(features, success_rate),
        }

    def _classify_pattern_type(self, features: List[List[float]]) -> str:
        """Classify type of shot pattern."""
        feature_array = np.array(features)

        # Analyze feature variations
        variations = feature_array.std(axis=0)

        if variations[0] < 0.1:  # Power consistency
            return "power_control"
        elif variations[1] < 0.1:  # Angle consistency
            return "angle_control"
        elif variations[2] > 0.8:  # English variation
            return "spin_pattern"
        else:
            return "mixed"

    def _calculate_pattern_significance(
        self, features: List[List[float]], success_rate: float
    ) -> float:
        """Calculate significance score for a pattern."""
        # Combine multiple factors for significance
        feature_consistency = 1 - np.array(features).std()
        success_factor = success_rate - 0.5  # Adjust for random chance

        return float(min(1.0, (feature_consistency + success_factor) / 2))

    def get_monitoring_dashboard(self) -> Dict[str, Any]:
        """Get model monitoring dashboard data.

        Returns:
            dict: Dashboard data
        """
        return self.monitor.get_monitoring_dashboard()

    def check_model_health(self) -> Dict[str, Any]:
        """Check health of all models.

        Returns:
            dict: Health check results
        """
        health_status = {
            "shot_classifier": self._check_model_health(self.shot_classifier, "shot"),
            "success_predictor": self._check_model_health(self.success_predictor, "success"),
            "position_predictor": self._check_model_health(self.position_predictor, "position"),
            "overall_status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Check for critical issues
        if any(
            status["status"] == "unhealthy"
            for status in health_status.values()
            if isinstance(status, dict)
        ):
            health_status["overall_status"] = "unhealthy"
        elif any(
            status["status"] == "degraded"
            for status in health_status.values()
            if isinstance(status, dict)
        ):
            health_status["overall_status"] = "degraded"

        return health_status

    def _check_model_health(self, model: Any, model_type: str) -> Dict[str, Any]:
        """Check health of a specific model.

        Args:
            model: Model to check
            model_type: Type of model

        Returns:
            dict: Health check results
        """
        if not model:
            return {"status": "unhealthy", "reason": "Model not initialized"}

        # Get recent performance metrics
        performance = self.monitor.analyze_performance(model_type)
        if "error" in performance:
            return {"status": "unknown", "reason": "Insufficient data"}

        # Check accuracy if available
        status = "healthy"
        issues = []

        if "accuracy" in performance:
            accuracy = performance["accuracy"]
            if accuracy < 0.5:
                status = "unhealthy"
                issues.append("Low accuracy")
            elif accuracy < 0.7:
                status = "degraded"
                issues.append("Suboptimal accuracy")

        # Check latency
        avg_latency = performance["avg_latency"]
        if avg_latency > 1.0:  # More than 1 second
            status = "unhealthy"
            issues.append("High latency")
        elif avg_latency > 0.5:  # More than 500ms
            status = "degraded"
            issues.append("Elevated latency")

        return {
            "status": status,
            "issues": issues,
            "metrics": performance,
            "last_check": datetime.utcnow().isoformat(),
        }

    def _get_active_test(self, model_type: str) -> Optional[ABTest]:
        """Get active A/B test for a model type."""
        for test in self.active_tests.values():
            if test.status == "running":
                # Check if test has variants for this model type
                if any(v.type == model_type for v in test.variants.values()):
                    # Check if test should be completed
                    if test.check_completion():
                        continue
                    return test
        return None
