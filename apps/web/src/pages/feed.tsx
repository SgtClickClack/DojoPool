import { ActivityFeed } from '@/components/ActivityFeed';
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feed-tabpanel-${index}`}
      aria-labelledby={`feed-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `feed-tab-${index}`,
    'aria-controls': `feed-tabpanel-${index}`,
  };
}

export default function FeedPage() {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Activity Feed
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Stay updated with the latest happenings in the Dojo Pool world
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="activity feed tabs"
          variant={isMobile ? 'fullWidth' : 'standard'}
          centered={!isMobile}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            label="Global Activity"
            {...a11yProps(0)}
            icon={<span>🌍</span>}
            iconPosition="start"
          />
          <Tab
            label="Friends Activity"
            {...a11yProps(1)}
            icon={<span>👥</span>}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <ActivityFeed filter="global" />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ActivityFeed filter="friends" />
      </TabPanel>
    </Container>
  );
}
