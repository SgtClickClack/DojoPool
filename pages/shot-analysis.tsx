/** @jsxImportSource react */
import React from 'react';
import Head from 'next/head';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import ShotAnalyzer from '../packages/frontend/src/components/AI/[AI]ShotAnalyzer';

const ShotAnalysisPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Shot Analysis | DojoPool</title>
        <meta name="description" content="Analyze your pool shots with AI to improve your game" />
      </Head>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Shot Analysis
        </Typography>
        
        <Typography variant="body1" paragraph>
          Upload a video of your shot to receive AI-powered analysis and recommendations to improve your game.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <ShotAnalyzer />
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              
              <Box component="ol" sx={{ pl: 2 }}>
                <li>
                  <Typography paragraph>
                    <strong>Record your shot</strong> from a stable position with a clear view of the table.
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    <strong>Upload the video</strong> using the analyzer tool.
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    <strong>Review the analysis</strong> including velocity, spin, accuracy, and difficulty metrics.
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    <strong>View the shot trajectory</strong> with our interactive visualization tool.
                  </Typography>
                </li>
                <li>
                  <Typography>
                    <strong>Get personalized recommendations</strong> to improve your technique.
                  </Typography>
                </li>
              </Box>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tips for Better Analysis
              </Typography>
              
              <Typography variant="body2" component="ul" sx={{ pl: 2 }} paragraph>
                <li>Ensure good lighting on the table</li>
                <li>Record from an overhead angle when possible</li>
                <li>Keep the camera steady</li>
                <li>Include the entire shot (setup, execution, and outcome)</li>
                <li>Videos under 15 seconds work best</li>
              </Typography>
              
              <Typography variant="body2">
                The AI analysis works best with clear, well-lit videos that capture the entire shot sequence.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default ShotAnalysisPage;