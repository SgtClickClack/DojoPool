import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  Grade as StarIcon,
  Games as GamesIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  joinDate: string;
  stats: {
    totalGames: number;
    gamesWon: number;
    totalScore: number;
    averageTime: string;
  };
  achievements: {
    id: string;
    title: string;
    description: string;
    date: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }[];
  recentGames: {
    id: string;
    title: string;
    date: string;
    score: number;
    result: 'won' | 'lost' | 'abandoned';
  }[];
}

const Profile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAchievements, setExpandedAchievements] = useState(!isMobile);
  const [expandedGames, setExpandedGames] = useState(!isMobile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // TODO: Replace with actual API call
        const mockProfile: UserProfile = {
          id: '1',
          username: 'Explorer123',
          email: 'explorer@example.com',
          avatarUrl: '/avatars/user1.jpg',
          joinDate: '2023-01-15',
          stats: {
            totalGames: 15,
            gamesWon: 12,
            totalScore: 1250,
            averageTime: '1h 45m',
          },
          achievements: [
            {
              id: '1',
              title: 'First Victory',
              description: 'Complete your first scavenger hunt',
              date: '2023-01-20',
              rarity: 'common',
            },
            {
              id: '2',
              title: 'Speed Runner',
              description: 'Complete a hunt in under 1 hour',
              date: '2023-02-05',
              rarity: 'rare',
            },
            {
              id: '3',
              title: 'Perfect Score',
              description: 'Complete a hunt with maximum points',
              date: '2023-03-15',
              rarity: 'legendary',
            },
          ],
          recentGames: [
            {
              id: '1',
              title: 'City Explorer',
              date: '2023-12-20',
              score: 250,
              result: 'won',
            },
            {
              id: '2',
              title: 'Nature Trail',
              date: '2023-12-18',
              score: 200,
              result: 'won',
            },
            {
              id: '3',
              title: 'Historic Quest',
              date: '2023-12-15',
              score: 150,
              result: 'lost',
            },
          ],
        };
        setProfile(mockProfile);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'error';
      case 'epic':
        return 'secondary';
      case 'rare':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'won':
        return 'success';
      case 'lost':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Container>
        <Typography color="error" align="center">
          Failed to load profile
        </Typography>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: { xs: 2, sm: 4 },
        mb: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              gap: { xs: 2, sm: 3 },
              textAlign: isMobile ? 'center' : 'left',
            }}
          >
            <Avatar
              src={profile.avatarUrl}
              alt={profile.username}
              sx={{
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
              }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
                {profile.username}
              </Typography>
              <Typography
                color="text.secondary"
                variant={isMobile ? 'body2' : 'body1'}
              >
                Member since {profile.joinDate}
              </Typography>
              {isMobile ? (
                <IconButton
                  color="primary"
                  sx={{ mt: 1 }}
                  aria-label="edit profile"
                >
                  <EditIcon />
                </IconButton>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  sx={{ mt: 2 }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                gutterBottom
                sx={{ mb: 2 }}
              >
                Statistics
              </Typography>
              <List disablePadding>
                <ListItem sx={{ px: { xs: 1, sm: 2 } }}>
                  <ListItemIcon>
                    <GamesIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? 'body2' : 'body1'}>
                        Total Games
                      </Typography>
                    }
                    secondary={profile.stats.totalGames}
                  />
                </ListItem>
                <ListItem sx={{ px: { xs: 1, sm: 2 } }}>
                  <ListItemIcon>
                    <TrophyIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? 'body2' : 'body1'}>
                        Games Won
                      </Typography>
                    }
                    secondary={`${profile.stats.gamesWon} (${Math.round(
                      (profile.stats.gamesWon / profile.stats.totalGames) * 100
                    )}%)`}
                  />
                </ListItem>
                <ListItem sx={{ px: { xs: 1, sm: 2 } }}>
                  <ListItemIcon>
                    <StarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? 'body2' : 'body1'}>
                        Total Score
                      </Typography>
                    }
                    secondary={profile.stats.totalScore}
                  />
                </ListItem>
                <ListItem sx={{ px: { xs: 1, sm: 2 } }}>
                  <ListItemIcon>
                    <TimerIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant={isMobile ? 'body2' : 'body1'}>
                        Average Time
                      </Typography>
                    }
                    secondary={profile.stats.averageTime}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  cursor: isMobile ? 'pointer' : 'default',
                }}
                onClick={() =>
                  isMobile && setExpandedAchievements(!expandedAchievements)
                }
              >
                <Typography variant={isMobile ? 'h6' : 'h5'}>
                  Achievements
                </Typography>
                {isMobile && (
                  <IconButton size="small">
                    {expandedAchievements ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                )}
              </Box>
              <Collapse in={expandedAchievements}>
                <Grid container spacing={2}>
                  {profile.achievements.map((achievement) => (
                    <Grid item xs={12} sm={6} key={achievement.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant={isMobile ? 'subtitle2' : 'subtitle1'}
                              sx={{ flexGrow: 1 }}
                            >
                              {achievement.title}
                            </Typography>
                            <Chip
                              label={achievement.rarity}
                              size={isMobile ? 'small' : 'medium'}
                              color={getRarityColor(achievement.rarity)}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {achievement.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Earned on {achievement.date}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Games */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  cursor: isMobile ? 'pointer' : 'default',
                }}
                onClick={() => isMobile && setExpandedGames(!expandedGames)}
              >
                <Typography variant={isMobile ? 'h6' : 'h5'}>
                  Recent Games
                </Typography>
                {isMobile && (
                  <IconButton size="small">
                    {expandedGames ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                )}
              </Box>
              <Collapse in={expandedGames}>
                <Grid container spacing={2}>
                  {profile.recentGames.map((game) => (
                    <Grid item xs={12} sm={6} md={4} key={game.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant={isMobile ? 'subtitle2' : 'subtitle1'}
                              sx={{ flexGrow: 1 }}
                            >
                              {game.title}
                            </Typography>
                            <Chip
                              label={game.result}
                              size={isMobile ? 'small' : 'medium'}
                              color={getResultColor(game.result)}
                            />
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Score: {game.score}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {game.date}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
