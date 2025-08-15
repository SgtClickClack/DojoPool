import { useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

interface PerformanceHistory {
  date: string;
  metric_value: number;
  metric_type: string;
}

interface TrainingHistory {
  date: string;
  skill_value: number;
  skill_type: string;
}

interface MatchHistory {
  player_id: string;
  opponent_id: string;
  winner_id: string;
  score: number;
  date: string;
}

export const usePredictiveAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [performanceForecast, setPerformanceForecast] = useState<any>(null);
  const [skillProgression, setSkillProgression] = useState<any>(null);
  const [matchupPrediction, setMatchupPrediction] = useState<any>(null);

  const fetchModelMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/predictive/models/metrics`,
      );
      setModelMetrics(response.data.data.metrics);
    } catch (err) {
      setError("Failed to fetch model metrics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePerformanceForecast = useCallback(
    async (
      performanceHistory: PerformanceHistory[],
      targetMetrics: string[],
      horizonDays: number = 30,
    ) => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post(
          `${API_BASE_URL}/api/predictive/performance/forecast`,
          performanceHistory,
          {
            params: {
              target_metrics: targetMetrics,
              horizon_days: horizonDays,
            },
          },
        );
        setPerformanceForecast(response.data.data);
        return response.data.data;
      } catch (err) {
        setError("Failed to generate performance forecast");
        console.error(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const predictSkillProgression = useCallback(
    async (
      trainingHistory: TrainingHistory[],
      targetSkills: string[],
      predictionWeeks: number = 12,
    ) => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post(
          `${API_BASE_URL}/api/predictive/skills/progression`,
          trainingHistory,
          {
            params: {
              target_skills: targetSkills,
              prediction_weeks: predictionWeeks,
            },
          },
        );
        setSkillProgression(response.data.data);
        return response.data.data;
      } catch (err) {
        setError("Failed to predict skill progression");
        console.error(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const predictMatchup = useCallback(
    async (opponentId: string, matchHistory: MatchHistory[]) => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post(
          `${API_BASE_URL}/api/predictive/matchups/predict`,
          matchHistory,
          {
            params: { opponent_id: opponentId },
          },
        );
        setMatchupPrediction(response.data.data);
        return response.data.data;
      } catch (err) {
        setError("Failed to predict matchup outcome");
        console.error(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    modelMetrics,
    performanceForecast,
    skillProgression,
    matchupPrediction,
    fetchModelMetrics,
    generatePerformanceForecast,
    predictSkillProgression,
    predictMatchup,
    clearError,
  };
};
