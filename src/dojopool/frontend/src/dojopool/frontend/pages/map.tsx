import { Box, Container, Typography } from '@mui/material';
import React from 'react';
import WorldHub from '../../../../../apps/web/src/components/world/WorldHub';
import PageBackground from '../src/components/common/PageBackground';
import Layout from '../src/components/layout/Layout';

const MapPage: React.FC = () => {
  return (
    <Layout>
      <PageBackground variant="map">
        <Box
          sx={{
            height: '100vh',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Container
            maxWidth={false}
            sx={{
              height: '100%',
              p: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 1000,
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                color: '#00ff9d',
                textShadow: '0 0 20px #00ff9d',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '10px 20px',
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
              }}
            >
              Living World Hub
            </Typography>

            <Typography
              variant="h6"
              sx={{
                position: 'absolute',
                top: 80,
                left: 20,
                zIndex: 1000,
                color: '#00a8ff',
                fontFamily: 'Orbitron, monospace',
                textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '5px 15px',
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
              }}
            >
              Explore the Dojo World
            </Typography>

            <Box sx={{ height: '100%', width: '100%' }}>
              <WorldHub />
            </Box>
          </Container>
        </Box>
      </PageBackground>
    </Layout>
  );
};

export default MapPage;
