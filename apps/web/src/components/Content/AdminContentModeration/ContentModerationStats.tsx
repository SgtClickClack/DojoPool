import { Card, CardContent, Grid, Typography } from '@mui/material';
import React from 'react';
import { ContentStats } from '@/types/content';

interface ContentModerationStatsProps {
  stats: ContentStats;
}

const ContentModerationStats: React.FC<ContentModerationStatsProps> = ({ stats }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Content
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
            <Typography variant="h6" color="success.main">
              {stats.approved}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="error.main">
              {stats.rejected}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rejected
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ContentModerationStats;
