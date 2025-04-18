import { Game } from '@/types/game';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const mockGames: Game[] = [
          {
            id: '1',
            title: 'City Explorer',
            description: 'Discover hidden gems in your city through an exciting scavenger hunt!',
            imageUrl: '/images/city-explorer.jpg',
            difficulty: 'Medium',
            duration: '2 hours',
            players: 12,
          },
          {
            id: '2',
            title: 'Nature Trail',
            description: 'Connect with nature while solving riddles and finding treasures.',
            imageUrl: '/images/nature-trail.jpg',
            difficulty: 'Easy',
            duration: '1.5 hours',
            players: 8,
          },
        ];
        setGames(mockGames);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching games:', error);
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

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
                    fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                  }}
                >
                  Level Up Your Pool Game
                </Typography>
                <Typography
                  variant="h5"
                  color="text.secondary"
                  paragraph
                  sx={{
                    mb: 4,
                    fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                    fontWeight: 300,
                  }}
                >
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
                    sx={{
                      background: theme.palette.primary.main,
                      '&:hover': {
                        background: theme.palette.primary.dark,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'transform 0.2s ease-in-out',
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    component={RouterLink}
                    to="/about"
                    sx={{
                      borderColor: theme.palette.secondary.main,
                      color: theme.palette.secondary.main,
                      '&:hover': {
                        borderColor: theme.palette.secondary.dark,
                        color: theme.palette.secondary.dark,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'transform 0.2s ease-in-out',
                    }}
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
              <Box
                component="img"
                src="/images/hero-vs.webp"
                alt="Pool Game"
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h2"
          align="center"
          gutterBottom
          className="neon-text"
          sx={{
            mb: 6,
            fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
            fontWeight: 900,
          }}
        >
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
                  transition: 'transform 0.2s ease-in-out',
                  background: 'rgba(10, 10, 10, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
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

      {/* Games Section */}
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 2, sm: 4 },
          mb: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          component="h1"
          gutterBottom
          sx={{
            mb: { xs: 2, sm: 3 },
            px: { xs: 1, sm: 0 },
          }}
        >
          Available Games
        </Typography>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {games.map((game) => (
            <Grid item key={game.id} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out',
                  background: 'rgba(10, 10, 10, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardActionArea
                  component={RouterLink}
                  to={`/game/${game.id}`}
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <CardMedia
                    component="img"
                    height={isMobile ? '160' : '200'}
                    image={game.imageUrl}
                    alt={game.title}
                    sx={{
                      objectFit: 'cover',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                    <Typography
                      gutterBottom
                      variant={isMobile ? 'h6' : 'h5'}
                      component="h2"
                      sx={{ mb: 1 }}
                    >
                      {game.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: '40px',
                      }}
                    >
                      {game.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mt: 'auto',
                      }}
                    >
                      <Chip
                        size="small"
                        label={game.difficulty}
                        color={getDifficultyColor(game.difficulty)}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'text.secondary',
                        }}
                      >
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="body2">{game.duration}</Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          color: 'text.secondary',
                        }}
                      >
                        <GroupIcon fontSize="small" />
                        <Typography variant="body2">{game.players}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
