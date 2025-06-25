import React from 'react';
import { Card, CardContent, Typography, Grid, Chip, Box, Button } from '@mui/material';
import { Analytics } from '@mui/icons-material';
import { AdvancedAnalysisSession } from '../../types/analysis';

interface AnalysisSessionCardProps {
  session: AdvancedAnalysisSession;
  onStartAnalysis: (session: AdvancedAnalysisSession) => void;
}

const AnalysisSessionCard: React.FC<AnalysisSessionCardProps> = ({ session, onStartAnalysis }) => {
  return (
    <Card 
      sx={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid #00d4ff',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 25px rgba(0, 212, 255, 0.3)',
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
            {session.focusArea}
          </Typography>
          <Chip 
            label={`${session.performance}%`} 
            color="primary" 
            sx={{ 
              background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" mb={2}>
          {session.date} • {session.duration} minutes
        </Typography>

        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Performance Scores:
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">Mental</Typography>
                <Typography variant="h6" color="#ff6b6b">{session.mentalGameScore}</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">Tactical</Typography>
                <Typography variant="h6" color="#4ecdc4">{session.tacticalScore}</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">Physical</Typography>
                <Typography variant="h6" color="#45b7d1">{session.physicalScore}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Focus Areas:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {session.exercises.map((exercise, index) => (
              <Chip
                key={index}
                label={exercise}
                size="small"
                sx={{
                  background: 'rgba(0, 212, 255, 0.1)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0, 212, 255, 0.3)'
                }}
              />
            ))}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {session.notes}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            variant="contained"
            startIcon={<Analytics />}
            onClick={() => onStartAnalysis(session)}
            sx={{
              background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #0099cc, #006699)',
              }
            }}
          >
            Analyze
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(AnalysisSessionCard); 