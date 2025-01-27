import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupsIcon from '@mui/icons-material/Groups';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Box, Button, Card, CardContent, Container, Grid, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

const features = [
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
  {
    title: 'Game Strategy',
    description:
      'Learn advanced techniques and strategies from top players and AI-powered analysis.',
    icon: <SportsEsportsIcon sx={{ fontSize: 40 }} />,
    path: '/game-strategy',
  },
];

export default function Home() {
  const theme = useTheme();

  return (
    <Box className="cyber-gradient" minHeight="100vh">
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: '70vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Image
          src="/images/pool-table-hero.jpg"
          alt="Pool table with neon lighting"
          layout="fill"
          objectFit="cover"
          priority
          style={{ opacity: 0.7 }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h1"
            className="neon-text"
            sx={{
              fontWeight: 700,
              mb: 2,
              textAlign: 'center',
              fontSize: { xs: '2.5rem', md: '4rem' },
            }}
          >
            Welcome to DojoPool
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: 'text.secondary',
              mb: 4,
              textAlign: 'center',
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Experience pool gaming like never before with our advanced tracking and analytics platform
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              className="hover-glow"
              sx={{
                fontSize: '1.2rem',
                py: 1.5,
                px: 4,
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              className="hover-glow"
              sx={{
                fontSize: '1.2rem',
                py: 1.5,
                px: 4,
              }}
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} md={3} key={feature.title}>
              <Link href={feature.path} passHref style={{ textDecoration: 'none' }}>
                <Card
                  className="hover-glow"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                        color: 'primary.main',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      gutterBottom
                      variant="h5"
                      component="h2"
                      sx={{ textAlign: 'center', color: 'primary.main' }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
