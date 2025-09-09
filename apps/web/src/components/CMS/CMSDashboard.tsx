import { CMSStats, getCMSStats } from '@/services/APIService';
import {
  Announcement as AnnouncementIcon,
  Article as ArticleIcon,
  Event as EventIcon,
  People as PeopleIcon,
  ThumbUp as ThumbUpIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Alert, Box, Card, CardContent, Grid, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import AssetBundleManagement from './AssetBundleManagement';
import CMSTabs from './CMSTabs';
import EventManagement from './EventManagement';
import NewsManagement from './NewsManagement';
import PromotionManagement from './PromotionManagement';
import SystemMessageManagement from './SystemMessageManagement';

// CMSStats interface is now imported from APIService

const CMSDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState<CMSStats>({
    totalEvents: 0,
    totalNewsArticles: 0,
    totalSystemMessages: 0,
    activeSystemMessages: 0,
    pendingContent: 0,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch real CMS statistics from the backend using API service
      const data = await getCMSStats();
      setStats(data);
    } catch (err) {
      setError('Failed to fetch CMS statistics');
      console.error('Error fetching stats:', err);
      // Fallback to mock data if API fails
      const mockStats: CMSStats = {
        totalEvents: 12,
        totalNewsArticles: 28,
        totalSystemMessages: 8,
        activeSystemMessages: 5,
        pendingContent: 3,
        totalViews: 15420,
        totalLikes: 892,
        totalShares: 0,
      };
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: EventIcon,
      color: 'primary',
      description: 'Published events',
    },
    {
      title: 'News Articles',
      value: stats.totalNewsArticles,
      icon: ArticleIcon,
      color: 'secondary',
      description: 'Published articles',
    },
    {
      title: 'System Messages',
      value: stats.totalSystemMessages,
      icon: AnnouncementIcon,
      color: 'warning',
      description: `${stats.activeSystemMessages} active`,
    },
    {
      title: 'Content Views',
      value: stats.totalViews.toLocaleString(),
      icon: VisibilityIcon,
      color: 'info',
      description: 'Total views across all content',
    },
    {
      title: 'Content Engagement',
      value: (stats.totalLikes + stats.totalShares).toLocaleString(),
      icon: ThumbUpIcon,
      color: 'success',
      description: 'Total likes and shares',
    },
    {
      title: 'Pending Content',
      value: stats.pendingContent,
      icon: PeopleIcon,
      color: 'error',
      description: 'Awaiting moderation',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading CMS dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
        Content Management System
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      color: `${stat.color}.main`,
                    }}
                  >
                    <IconComponent sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      fontWeight: 'bold',
                      color: `${stat.color}.main`,
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="h6" component="div" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* CMS Management Tabs */}
      <CMSTabs value={tabValue} onChange={handleTabChange}>
        <EventManagement />
        <NewsManagement />
        <SystemMessageManagement />
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Content Moderation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Content moderation features will be implemented here, including:
          </Typography>
          <Box component="ul" sx={{ mt: 2, pl: 3 }}>
            <li>Review pending user-generated content</li>
            <li>Moderate comments and interactions</li>
            <li>Handle reported content</li>
            <li>View moderation statistics</li>
          </Box>
        </Box>
        <PromotionManagement />
        <AssetBundleManagement />
      </CMSTabs>
    </Box>
  );
};

export default CMSDashboard;
