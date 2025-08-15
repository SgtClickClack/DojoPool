import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { feedbackService } from "../../services/FeedbackService";
import { FeedbackData } from "./FeedbackForm";

interface AnalyticsData {
  categoryDistribution: Record<string, number>;
  ratingTrends: Record<string, { sum: number; count: number }>;
  lastUpdated: string;
}

export const FeedbackAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [recentFeedback, setRecentFeedback] = useState<FeedbackData[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    loadAnalytics();
    loadRecentFeedback();
  }, []);

  const loadAnalytics = () => {
    const storedAnalytics = localStorage.getItem("feedback_analytics");
    if (storedAnalytics) {
      setAnalyticsData(JSON.parse(storedAnalytics));
    }
    setAverageRating(feedbackService.getAverageRating());
  };

  const loadRecentFeedback = () => {
    const allFeedback = feedbackService.getFeedback();
    setRecentFeedback(allFeedback.slice(-5));
  };

  const prepareCategoryData = () => {
    if (!analyticsData) return [];
    return Object.entries(analyticsData.categoryDistribution).map(
      ([category, count]) => ({
        category,
        count,
      }),
    );
  };

  const prepareRatingTrendData = () => {
    if (!analyticsData) return [];
    return Object.entries(analyticsData.ratingTrends).map(([date, data]) => ({
      date,
      rating: data.sum / data.count,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Feedback Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Average Rating Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Rating
              </Typography>
              <Typography variant="h3" color="primary">
                {averageRating.toFixed(1)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(averageRating / 5) * 100}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feedback by Category
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareCategoryData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Rating Trends Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rating Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareRatingTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#82ca9d"
                    name="Average Rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Feedback List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Feedback
              </Typography>
              {recentFeedback.map((feedback, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: "1px solid #eee",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1">
                    {feedback.category} - Rating: {feedback.rating}/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feedback.comment}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(feedback.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
