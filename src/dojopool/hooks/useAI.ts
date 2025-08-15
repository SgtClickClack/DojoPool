import { useState, useCallback } from "react";
import axios from "axios";

interface Story {
  story: string;
  context: any;
  generated_at: string;
}

interface Recommendation {
  type: string;
  focus_area: string;
  difficulty: number;
  exercises: Array<{
    type: string;
    duration: number;
    difficulty: number;
    target_score: number;
  }>;
  duration: number;
}

interface Analysis {
  match_id: number;
  analysis: {
    performance_analysis: any;
    strategy_analysis: any;
    improvement_suggestions: any;
  };
  generated_at: string;
}

interface DifficultySettings {
  base_difficulty: number;
  adjustments: {
    speed: number;
    complexity: number;
    assistance: number;
  };
  recommended_settings: {
    game_speed: number;
    complexity_level: number;
    assistance_level: number;
    target_score: number;
  };
}

interface AIMetrics {
  story_generation: {
    total_stories: number;
    avg_generation_time: number;
    success_rate: number;
  };
  recommendations: {
    total_recommendations: number;
    avg_response_time: number;
    acceptance_rate: number;
  };
  match_analysis: {
    total_analyses: number;
    avg_analysis_time: number;
    accuracy_rate: number;
  };
  difficulty_adjustment: {
    total_adjustments: number;
    avg_calculation_time: number;
    effectiveness_rate: number;
  };
}

export const useAI = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [difficultySettings, setDifficultySettings] =
    useState<DifficultySettings | null>(null);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStory = useCallback(async (matchId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/ai/story/${matchId}`);
      setStory(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch story");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(
    async (type: string = "training") => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get("/api/ai/recommendations", {
          params: { type },
        });
        setRecommendations(response.data.recommendations);
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to fetch recommendations",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchAnalysis = useCallback(
    async (matchId: number, type: string = "full") => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`/api/ai/match/${matchId}/analysis`, {
          params: { type },
        });
        setAnalysis(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch match analysis");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchDifficultySettings = useCallback(async (gameId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/ai/game/${gameId}/difficulty`);
      setDifficultySettings(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to fetch difficulty settings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/ai/metrics");
      setMetrics(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch AI metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  const batchAnalyzeMatches = useCallback(async (matchIds: number[]) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post("/api/ai/batch/analysis", {
        match_ids: matchIds,
        type: "full",
      });
      return response.data.results;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze matches");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchGenerateRecommendations = useCallback(
    async (userIds: number[]) => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.post("/api/ai/batch/recommendations", {
          user_ids: userIds,
          type: "training",
        });
        return response.data.results;
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to generate recommendations",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    story,
    recommendations,
    analysis,
    difficultySettings,
    metrics,
    loading,
    error,
    fetchStory,
    fetchRecommendations,
    fetchAnalysis,
    fetchDifficultySettings,
    fetchMetrics,
    batchAnalyzeMatches,
    batchGenerateRecommendations,
  };
};
