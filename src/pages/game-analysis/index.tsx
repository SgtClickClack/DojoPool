import { Box, Container, Typography } from '@mui/material';
import { type NextPage } from 'next';

const GameAnalysis: NextPage = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#1a1a1a', color: '#fff' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Game Analysis
        </Typography>
        <div className="game-analysis-content">
          {/* Game analysis components will be added here */}
          <Typography variant="body1">
            Analyze your game performance and get detailed insights
          </Typography>
        </div>
      </Container>
    </Box>
  );
};

export default GameAnalysis;
