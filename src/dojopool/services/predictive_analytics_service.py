import numpy as np
import pandas as pd
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

class PredictiveAnalyticsService:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.forecast_horizons = [7, 30, 90]  # Days to forecast
        
    async def forecast_player_performance(
        self,
        player_id: str,
        performance_history: List[dict],
        target_metrics: List[str],
        horizon_days: int = 30
    ) -> Dict:
        """
        Forecast player performance metrics for the specified horizon.
        """
        df = pd.DataFrame(performance_history)
        df['date'] = pd.to_datetime(df['date'])
        
        forecasts = {}
        confidence_intervals = {}
        
        for metric in target_metrics:
            if metric not in df.columns:
                continue
                
            # Prepare time series features
            X = self._create_time_features(df)
            y = df[metric].values
            
            # Train model
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X, y)
            
            # Generate future dates
            future_dates = pd.date_range(
                start=df['date'].max(),
                periods=horizon_days + 1,
                freq='D'
            )[1:]
            
            # Create features for prediction
            future_X = self._create_time_features(
                pd.DataFrame({'date': future_dates})
            )
            
            # Make predictions with confidence intervals
            predictions = []
            lower_bounds = []
            upper_bounds = []
            
            for _ in range(100):  # Bootstrap for confidence intervals
                bootstrap_indices = np.random.choice(
                    len(X),
                    size=len(X),
                    replace=True
                )
                bootstrap_model = RandomForestRegressor(
                    n_estimators=100,
                    random_state=np.random.randint(1000)
                )
                bootstrap_model.fit(
                    X[bootstrap_indices],
                    y[bootstrap_indices]
                )
                pred = bootstrap_model.predict(future_X)
                predictions.append(pred)
            
            predictions = np.array(predictions)
            mean_predictions = np.mean(predictions, axis=0)
            lower_bounds = np.percentile(predictions, 5, axis=0)
            upper_bounds = np.percentile(predictions, 95, axis=0)
            
            forecasts[metric] = {
                'dates': future_dates.strftime('%Y-%m-%d').tolist(),
                'values': mean_predictions.tolist()
            }
            confidence_intervals[metric] = {
                'lower': lower_bounds.tolist(),
                'upper': upper_bounds.tolist()
            }
            
        return {
            'forecasts': forecasts,
            'confidence_intervals': confidence_intervals
        }
        
    async def predict_skill_progression(
        self,
        player_id: str,
        training_history: List[dict],
        target_skills: List[str],
        prediction_weeks: int = 12
    ) -> Dict:
        """
        Predict skill progression based on training history and current performance.
        """
        df = pd.DataFrame(training_history)
        df['date'] = pd.to_datetime(df['date'])
        
        progression_predictions = {}
        milestones = {}
        
        for skill in target_skills:
            if skill not in df.columns:
                continue
                
            # Create features for skill progression
            X = self._create_progression_features(df, skill)
            y = df[skill].values
            
            # Split data and scale features
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train model
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X_train_scaled, y_train)
            
            # Generate future weeks
            future_dates = pd.date_range(
                start=df['date'].max(),
                periods=prediction_weeks * 7 + 1,
                freq='D'
            )[1:]
            
            # Create features for prediction
            future_X = self._create_progression_features(
                pd.DataFrame({'date': future_dates}),
                skill
            )
            future_X_scaled = scaler.transform(future_X)
            
            # Make predictions
            predictions = model.predict(future_X_scaled)
            
            # Identify key milestones
            current_level = df[skill].iloc[-1]
            milestone_thresholds = [
                current_level * (1 + i * 0.1) for i in range(1, 6)
            ]
            
            skill_milestones = []
            for threshold in milestone_thresholds:
                milestone_date = None
                for i, pred in enumerate(predictions):
                    if pred >= threshold:
                        milestone_date = future_dates[i]
                        break
                        
                if milestone_date:
                    skill_milestones.append({
                        'level': threshold,
                        'estimated_date': milestone_date.strftime('%Y-%m-%d')
                    })
            
            progression_predictions[skill] = {
                'dates': future_dates.strftime('%Y-%m-%d').tolist(),
                'values': predictions.tolist()
            }
            milestones[skill] = skill_milestones
            
        return {
            'progression_predictions': progression_predictions,
            'milestones': milestones
        }
        
    async def predict_matchup_outcomes(
        self,
        player_id: str,
        opponent_id: str,
        match_history: List[dict]
    ) -> Dict:
        """
        Predict outcomes for potential matchups based on historical performance.
        """
        df = pd.DataFrame(match_history)
        
        # Calculate player statistics
        player_stats = self._calculate_player_stats(df, player_id)
        opponent_stats = self._calculate_player_stats(df, opponent_id)
        
        # Create matchup features
        matchup_features = self._create_matchup_features(
            player_stats,
            opponent_stats
        )
        
        # Predict win probability
        win_prob = self._predict_win_probability(matchup_features)
        
        # Predict score ranges
        score_predictions = self._predict_score_ranges(
            matchup_features,
            player_stats,
            opponent_stats
        )
        
        return {
            'win_probability': win_prob,
            'score_predictions': score_predictions,
            'player_stats': player_stats,
            'opponent_stats': opponent_stats
        }
        
    def _create_time_features(self, df: pd.DataFrame) -> np.ndarray:
        """Create time-based features for forecasting."""
        features = pd.DataFrame()
        features['day_of_week'] = df['date'].dt.dayofweek
        features['month'] = df['date'].dt.month
        features['day_of_month'] = df['date'].dt.day
        features['week_of_year'] = df['date'].dt.isocalendar().week
        
        # Create cyclical features
        features['day_of_week_sin'] = np.sin(2 * np.pi * features['day_of_week'] / 7)
        features['day_of_week_cos'] = np.cos(2 * np.pi * features['day_of_week'] / 7)
        features['month_sin'] = np.sin(2 * np.pi * features['month'] / 12)
        features['month_cos'] = np.cos(2 * np.pi * features['month'] / 12)
        
        return features.values
        
    def _create_progression_features(
        self,
        df: pd.DataFrame,
        skill: str
    ) -> np.ndarray:
        """Create features for skill progression prediction."""
        features = pd.DataFrame()
        
        # Time-based features
        features['days_training'] = (
            df['date'] - df['date'].min()
        ).dt.total_seconds() / (24 * 3600)
        
        # Add rolling statistics if historical data is available
        if skill in df.columns:
            features['rolling_mean_7d'] = df[skill].rolling(7, min_periods=1).mean()
            features['rolling_std_7d'] = df[skill].rolling(7, min_periods=1).std()
            features['rolling_mean_30d'] = df[skill].rolling(30, min_periods=1).mean()
            features['rolling_std_30d'] = df[skill].rolling(30, min_periods=1).std()
        
        return features.values
        
    def _calculate_player_stats(
        self,
        df: pd.DataFrame,
        player_id: str
    ) -> Dict:
        """Calculate comprehensive player statistics."""
        player_matches = df[
            (df['player_id'] == player_id) | (df['opponent_id'] == player_id)
        ]
        
        stats = {
            'matches_played': len(player_matches),
            'wins': len(player_matches[player_matches['winner_id'] == player_id]),
            'avg_score': player_matches[
                player_matches['player_id'] == player_id
            ]['score'].mean(),
            'avg_opponent_score': player_matches[
                player_matches['opponent_id'] == player_id
            ]['score'].mean()
        }
        
        return stats
        
    def _create_matchup_features(
        self,
        player_stats: Dict,
        opponent_stats: Dict
    ) -> np.ndarray:
        """Create features for matchup prediction."""
        features = []
        
        # Win rates
        features.append(
            player_stats['wins'] / player_stats['matches_played']
            if player_stats['matches_played'] > 0 else 0.5
        )
        features.append(
            opponent_stats['wins'] / opponent_stats['matches_played']
            if opponent_stats['matches_played'] > 0 else 0.5
        )
        
        # Scoring ability
        features.append(player_stats['avg_score'])
        features.append(opponent_stats['avg_score'])
        
        # Defense ability
        features.append(player_stats['avg_opponent_score'])
        features.append(opponent_stats['avg_opponent_score'])
        
        return np.array(features).reshape(1, -1)
        
    def _predict_win_probability(self, features: np.ndarray) -> float:
        """Predict win probability for a matchup."""
        # Simple heuristic based on features
        player_strength = (
            features[0, 0] * 0.4 +  # Win rate
            features[0, 2] * 0.3 +  # Scoring
            (1 - features[0, 4]) * 0.3  # Defense
        )
        
        opponent_strength = (
            features[0, 1] * 0.4 +  # Win rate
            features[0, 3] * 0.3 +  # Scoring
            (1 - features[0, 5]) * 0.3  # Defense
        )
        
        total_strength = player_strength + opponent_strength
        win_prob = player_strength / total_strength if total_strength > 0 else 0.5
        
        return float(win_prob)
        
    def _predict_score_ranges(
        self,
        features: np.ndarray,
        player_stats: Dict,
        opponent_stats: Dict
    ) -> Dict:
        """Predict likely score ranges for both players."""
        player_avg_score = player_stats['avg_score']
        opponent_avg_score = opponent_stats['avg_score']
        
        # Adjust based on relative strength
        win_prob = self._predict_win_probability(features)
        score_adjustment = (win_prob - 0.5) * 10
        
        player_predicted = player_avg_score + score_adjustment
        opponent_predicted = opponent_avg_score - score_adjustment
        
        return {
            'player': {
                'low': max(0, player_predicted - 5),
                'high': player_predicted + 5
            },
            'opponent': {
                'low': max(0, opponent_predicted - 5),
                'high': opponent_predicted + 5
            }
        } 