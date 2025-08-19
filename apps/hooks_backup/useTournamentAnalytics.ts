import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

interface ScoreDistribution {
  range: string;
  count: number;
}

interface TeamPerformance {
  teamName: string;
  score: number;
  percentage: number;
}

interface Progression {
  round: string;
  averageScore: number;
  topScore: number;
}

interface TopScorer {
  userId: string;
  username: string;
  score: number;
}

interface TeamStat {
  teamId: string;
  teamName: string;
  totalScore: number;
  memberCount: number;
}

export interface TournamentAnalytics {
  totalParticipants: number;
  averageScore: number;
  topScorers: TopScorer[];
  teamStats: TeamStat[];
  scoreDistribution: ScoreDistribution[];
  teamPerformance: TeamPerformance[];
  progression: Progression[];
}

export const useTournamentAnalytics = (tournamentId: string) => {
  const [analytics, setAnalytics] = useState<TournamentAnalytics>({
    totalParticipants: 0,
    averageScore: 0,
    topScorers: [],
    teamStats: [],
    scoreDistribution: [],
    teamPerformance: [],
    progression: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(
        `/api/tournaments/${tournamentId}/analytics`
      );
      const rawAnalytics = response.data;

      // Calculate score distribution
      const scoreDistribution = calculateScoreDistribution(rawAnalytics.scores);

      // Calculate team performance
      const teamPerformance = calculateTeamPerformance(rawAnalytics.teams);

      // Calculate progression
      const progression = calculateProgression(rawAnalytics.rounds);

      // Get top scorers
      const topScorers = getTopScorers(rawAnalytics.scores, 10);

      // Get team stats
      const teamStats = getTeamStats(rawAnalytics.teams);

      setAnalytics({
        totalParticipants: rawAnalytics.participants.length,
        averageScore: calculateAverageScore(rawAnalytics.scores),
        topScorers,
        teamStats,
        scoreDistribution,
        teamPerformance,
        progression,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch analytics'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [tournamentId]);

  const calculateScoreDistribution = (
    scores: number[]
  ): ScoreDistribution[] => {
    const ranges = [
      { min: 0, max: 20 },
      { min: 21, max: 40 },
      { min: 41, max: 60 },
      { min: 61, max: 80 },
      { min: 81, max: 100 },
    ];

    return ranges.map((range) => ({
      range: `${range.min}-${range.max}`,
      count: scores.filter((score) => score >= range.min && score <= range.max)
        .length,
    }));
  };

  const calculateTeamPerformance = (teams: any[]): TeamPerformance[] => {
    const totalScore = teams.reduce((sum, team) => sum + team.score, 0);
    return teams.map((team) => ({
      teamName: team.name,
      score: team.score,
      percentage: (team.score / totalScore) * 100,
    }));
  };

  const calculateProgression = (rounds: any[]): Progression[] => {
    return rounds.map((round) => ({
      round: `Round ${round.number}`,
      averageScore: calculateAverageScore(round.scores),
      topScore: Math.max(...round.scores),
    }));
  };

  const getTopScorers = (scores: any[], limit: number): TopScorer[] => {
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((scorer) => ({
        userId: scorer.userId,
        username: scorer.username,
        score: scorer.score,
      }));
  };

  const getTeamStats = (teams: any[]): TeamStat[] => {
    return teams.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      totalScore: team.score,
      memberCount: team.members.length,
    }));
  };

  const calculateAverageScore = (scores: number[]): number => {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  return {
    analytics,
    loading,
    error,
  };
};
