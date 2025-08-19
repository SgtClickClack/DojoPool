import { Box, Button, Container, Typography } from '@mui/material';
import React from 'react';

const Home = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #000000, #1a1a1a)',
        color: '#ffffff',
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h1"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
            mb: 4,
            background: 'linear-gradient(45deg, #00f2fe 30%, #4facfe 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome to DojoPool
        </Typography>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{
            textAlign: 'center',
            mb: 4,
            color: '#f0f0f0',
          }}
        >
          Where Pool Meets Digital Innovation
        </Typography>
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: '#cccccc',
          }}
        >
          Experience pool like never before with our innovative social gaming
          platform. Merge physical gameplay with digital enhancements, powered
          by AI and wrapped in a kung fu anime aesthetic.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            mt: 4,
          }}
        >
          <Button
            variant="contained"
            size="large"
            sx={{
              background: 'linear-gradient(45deg, #00f2fe 30%, #4facfe 90%)',
              color: '#ffffff',
              px: 4,
              py: 2,
              '&:hover': {
                background: 'linear-gradient(45deg, #4facfe 30%, #00f2fe 90%)',
              },
            }}
          >
            Find a Dojo
          </Button>
          <Button
            variant="outlined"
            size="large"
            sx={{
              borderColor: '#00f2fe',
              color: '#00f2fe',
              px: 4,
              py: 2,
              '&:hover': {
                borderColor: '#4facfe',
                color: '#4facfe',
              },
            }}
          >
            Learn More
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
