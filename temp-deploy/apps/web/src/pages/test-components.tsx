import PlayerAvatar from '@/components/Avatar/PlayerAvatar';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { Box, Grid, Paper, Typography } from '@mui/material';

const TestComponentsPage = () => {
  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Component Test Page
      </Typography>

      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Player Avatar Components
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <PlayerAvatar playerName="RyuKlaw" level={15} size="small" />
              <PlayerAvatar playerName="JadeTiger" level={8} size="medium" />
              <PlayerAvatar playerName="PoolMaster" level={25} size="large" />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Loading Components
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <LoadingSpinner message="Loading..." size={30} />
              <LoadingSpinner message="Processing..." size={50} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestComponentsPage;
