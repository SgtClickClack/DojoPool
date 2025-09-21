import { Card, CardContent, Grid, Typography } from '@mui/material';
import React from 'react';
import { FeedbackStats } from '@/types/feedback';

interface FeedbackStatsCardsProps {
  stats: FeedbackStats;
}

const FeedbackStatsCards: React.FC<FeedbackStatsCardsProps> = ({ stats }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Feedback
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              {stats.pending}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Review
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="info.main">
              {stats.inReview}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Review
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="success.main">
              {stats.resolved}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resolved
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default FeedbackStatsCards;
