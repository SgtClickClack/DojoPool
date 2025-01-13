import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Box, Button, Card, CardContent, Container, Grid, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const features = [
  {
    title: 'AI-Powered Training',
    description:
      'Enhance your game with personalized training powered by advanced AI analysis of your technique and strategy.',
    icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    path: '/training',
  },
  {
    title: 'Marketplace',
    description:
      'Buy, sell, and trade pool equipment with our secure and user-friendly marketplace platform.',
    icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
    path: '/marketplace',
  },
  {
    title: 'Advanced Analytics',
    description:
      'Track your progress and gain insights with detailed performance analytics and statistics.',
    icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
    path: '/analytics',
  },
  {
    title: 'Community',
    description:
      'Connect with fellow players, share experiences, and participate in tournaments and events.',
    icon: <GroupsIcon sx={{ fontSize: 40 }} />,
    path: '/community',
  },
];

const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '70vh', md: '80vh' },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(0,255,157,0.1) 0%, rgba(0,168,255,0.1) 100%)',
            zIndex: -1,
          },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box className="fade-in">
                <Typography
                  variant="h1"
                  gutterBottom
                  className="neon-text"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: '-0.05em',
                    lineHeight: 1.2,
                  }}
                >
                  Level Up Your Pool Game
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
                  Master the art of pool with AI-powered training, analytics, and a vibrant
                  community of players.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    component={RouterLink}
                    to="/register"
                    startIcon={<SportsEsportsIcon />}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    component={RouterLink}
                    to="/about"
                  >
                    Learn More
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center',
              }}
            >
              {/* Add hero image or animation here */}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" align="center" gutterBottom className="neon-text" sx={{ mb: 6 }}>
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Card
                component={RouterLink}
                to={feature.path}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    textAlign: 'center',
                    p: 3,
                  }}
                >
                  <Box
                    sx={{
                      mb: 2,
                      color: 'primary.main',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{ color: 'text.primary' }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
