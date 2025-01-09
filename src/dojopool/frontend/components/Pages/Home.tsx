import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Chip,
  CardActionArea,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import { Game } from '@/types/game';

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchGames = async () => {
      try {
        // Simulated API response
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
    <Container 
      maxWidth="lg" 
      sx={{ 
        mt: { xs: 2, sm: 4 }, 
        mb: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        gutterBottom
        sx={{ 
          mb: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 0 }
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
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              }}
            >
              <CardActionArea 
                component={RouterLink} 
                to={`/game/${game.id}`}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                <CardMedia
                  component="img"
                  height={isMobile ? "160" : "200"}
                  image={game.imageUrl}
                  alt={game.title}
                  sx={{ 
                    objectFit: 'cover',
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                />
                <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    gutterBottom 
                    variant={isMobile ? "h6" : "h5"} 
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
                      minHeight: '40px'
                    }}
                  >
                    {game.description}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 'auto'
                  }}>
                    <Chip
                      label={game.difficulty}
                      size={isMobile ? "small" : "medium"}
                      color={getDifficultyColor(game.difficulty)}
                      sx={{ minWidth: 80 }}
                    />
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={game.duration}
                      size={isMobile ? "small" : "medium"}
                      variant="outlined"
                    />
                    <Chip
                      icon={<GroupIcon />}
                      label={`${game.players} players`}
                      size={isMobile ? "small" : "medium"}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home; 