/** @jsxImportSource react */
import React from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  SportsBar,
  EmojiEvents,
  Analytics,
  Group,
  Speed,
  Psychology,
} from '@mui/icons-material';
import Link from 'next/link';

const features = [
  {
    icon: <SportsBar fontSize="large" />,
    title: 'Smart Venues',
    description: 'Experience pool gaming in tech-enhanced venues with real-time tracking and analysis.',
  },
  {
    icon: <EmojiEvents fontSize="large" />,
    title: 'Tournaments',
    description: 'Join competitive tournaments and climb the rankings in your local venues.',
  },
  {
    icon: <Analytics fontSize="large" />,
    title: 'Advanced Analytics',
    description: 'Track your performance with detailed statistics and AI-powered insights.',
  },
  {
    icon: <Group fontSize="large" />,
    title: 'Social Gaming',
    description: 'Connect with other players, form teams, and participate in community events.',
  },
  {
    icon: <Speed fontSize="large" />,
    title: 'Real-time Tracking',
    description: 'Get instant feedback on your shots and game progress with our smart tracking system.',
  },
  {
    icon: <Psychology fontSize="large" />,
    title: 'AI Training',
    description: 'Improve your game with personalized AI-powered training recommendations.',
  },
];

export default function Home() {
  const theme = useTheme();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h1" gutterBottom>
                Transform Your Pool Game
              </Typography>
              <Typography variant="h5" paragraph>
                Experience the future of pool gaming with AI-powered tracking, real-time analytics, and a vibrant community of players.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  component={Link}
                  href="/register"
                  sx={{ mr: 2 }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={Link}
                  href="/venues"
                >
                  Find Venues
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/images/hero-image.png"
                alt="Pool table with AR overlay"
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h2" align="center" gutterBottom>
          Features
        </Typography>
        <Typography variant="h5" align="center" color="textSecondary" paragraph>
          Discover what makes DojoPool the ultimate pool gaming platform
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography color="textSecondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom>
            Ready to Level Up Your Game?
          </Typography>
          <Typography variant="h6" align="center" paragraph>
            Join thousands of players and venues in the DojoPool community.
          </Typography>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={Link}
              href="/register"
              sx={{ mr: 2 }}
            >
              Sign Up Now
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              component={Link}
              href="/about"
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}