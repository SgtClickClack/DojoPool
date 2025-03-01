import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress,
  Skeleton,
  Chip,
  Divider,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  LinearProgress
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import leaderboardService from '../../services/leaderboardService';
import { useTheme } from '@mui/material/styles';

// Define types for user stats
interface UserStatsData {
  globalRank: number;
  totalScore: number;
  recentScore: number; // Score earned in the last 7 days
  winRate: number;
  wins: number;
  losses: number;
  totalGames: number;
  longestWinStreak: number;
  currentWinStreak: number;
  favoriteVenue?: {
    id: string;
    name: string;
    gamesPlayed: number;
    rank: number;
  };
  recentTournaments: Array<{
    id: string;
    name: string;
    rank: number;
    totalPlayers: number;
    date: string;
  }>;
  skillLevel: number; // 0 to 100
  skillTier: string; // e.g., "Beginner", "Intermediate", "Master"
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    dateEarned: string;
    icon?: string;
  }>;
}

interface UserStatsProps {
  userId?: string; // If not provided, use the current logged-in user
  className?: string;
  compact?: boolean; // If true, show a more compact version
}

export const UserStats: React.FC<UserStatsProps> = ({
  userId,
  className,
  compact = false
}) => {
  const theme = useTheme();
  
  // State variables
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user stats
  const loadUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await leaderboardService.getUserStats(userId);
      setUserStats(stats as UserStatsData);
    } catch (err) {
      console.error('Failed to load user stats:', err);
      setError('Failed to load user statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadUserStats();
  }, [userId]);

  // Get rank display text
  const getRankText = (rank: number) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  // Get skill tier color
  const getSkillTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'novice': return '#8BC34A'; // Light Green
      case 'amateur': return '#4CAF50'; // Green
      case 'intermediate': return '#03A9F4'; // Light Blue
      case 'advanced': return '#673AB7'; // Deep Purple
      case 'expert': return '#FF9800'; // Orange
      case 'master': return '#F44336'; // Red
      case 'grandmaster': return '#9C27B0'; // Purple
      case 'legend': return '#FFD700'; // Gold
      default: return theme.palette.primary.main;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ width: '100%' }} className={className}>
        {compact ? (
          <Card elevation={2}>
            <CardContent>
              <Skeleton variant="text" width="50%" height={40} />
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Grid>
                  <Grid item xs={6}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Box>
            <Skeleton variant="text" width="40%" height={60} />
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
              <Grid item xs={12}>
                <Skeleton variant="rectangular" height={250} />
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ width: '100%' }} className={className}>
        <Paper elevation={2} sx={{ p: 3, bgcolor: 'error.light', color: 'error.main' }}>
          <Typography variant="body1">{error}</Typography>
          <Button variant="outlined" color="primary" sx={{ mt: 2 }} onClick={loadUserStats}>
            Try Again
          </Button>
        </Paper>
      </Box>
    );
  }

  // Render no data state
  if (!userStats) {
    return (
      <Box sx={{ width: '100%' }} className={className}>
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No stats available. Play some games to see your stats here!</Typography>
        </Paper>
      </Box>
    );
  }

  // Compact view (for profile summary or sidebar)
  if (compact) {
    return (
      <Card elevation={2} className={className}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScoreboardIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
            <Typography variant="h6" component="h2">Player Stats</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Global Rank</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                #{userStats.globalRank} 
                {userStats.globalRank <= 100 && (
                  <VerifiedIcon sx={{ ml: 0.5, color: theme.palette.primary.main, fontSize: '1rem' }} />
                )}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Win Rate</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {(userStats.winRate * 100).toFixed(1)}%
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Total Score</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {userStats.totalScore.toLocaleString()}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="text.secondary">Games Played</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {userStats.totalGames}
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip 
              icon={<MilitaryTechIcon />} 
              label={`${userStats.skillTier}`} 
              sx={{ 
                bgcolor: getSkillTierColor(userStats.skillTier),
                color: 'white',
                fontWeight: 'bold'
              }} 
            />
            
            <Button 
              size="small" 
              color="primary" 
              variant="outlined"
              component="a"
              href="/profile/stats"
            >
              View Details
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Full detailed view
  return (
    <Box sx={{ width: '100%' }} className={className}>
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          mb: 3, 
          fontWeight: 'bold',
          fontFamily: 'var(--martial-arts-font)',
          color: theme.palette.primary.main
        }}
      >
        Player Statistics
      </Typography>
      
      <Grid container spacing={3}>
        {/* Summary Stats */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ScoreboardIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">Overview</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Global Rank</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  #{userStats.globalRank}
                  {userStats.globalRank <= 100 && (
                    <VerifiedIcon sx={{ ml: 0.5, color: theme.palette.primary.main }} />
                  )}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Skill Level</Typography>
                <Box sx={{ mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={userStats.skillLevel} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 5,
                      bgcolor: alpha(getSkillTierColor(userStats.skillTier), 0.2),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getSkillTierColor(userStats.skillTier)
                      }
                    }} 
                  />
                </Box>
                <Chip 
                  label={userStats.skillTier} 
                  size="small"
                  sx={{ 
                    bgcolor: getSkillTierColor(userStats.skillTier),
                    color: 'white',
                    fontWeight: 'bold'
                  }} 
                />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Total Score</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {userStats.totalScore.toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Recent Score</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  {userStats.recentScore.toLocaleString()}
                  {userStats.recentScore > 0 && (
                    <TrendingUpIcon sx={{ ml: 0.5, color: 'success.main', fontSize: '1.2rem' }} />
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Game Stats */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SportsEsportsIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">Game Performance</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Win Rate</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {(userStats.winRate * 100).toFixed(1)}%
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Win/Loss</Typography>
                <Typography variant="h6">
                  <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    {userStats.wins}
                  </Box>
                  {" / "}
                  <Box component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    {userStats.losses}
                  </Box>
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Total Games</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {userStats.totalGames}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Win Streak</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Current: {userStats.currentWinStreak}
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Best: {userStats.longestWinStreak}
                  </Typography>
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Favorite Venue */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationOnIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">
                {userStats.favoriteVenue ? 'Favorite Venue' : 'No Favorite Venue Yet'}
              </Typography>
            </Box>
            
            {userStats.favoriteVenue ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {userStats.favoriteVenue.name}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Venue Rank</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      #{userStats.favoriteVenue.rank}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Games Played</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {userStats.favoriteVenue.gamesPlayed}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  component="a"
                  href={`/venues/${userStats.favoriteVenue.id}`}
                >
                  View Venue
                </Button>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Play more games at your favorite venues to see stats here!
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  component="a"
                  href="/venues"
                >
                  Find Venues
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Tournaments */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiEventsIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">Recent Tournaments</Typography>
            </Box>
            
            {userStats.recentTournaments.length > 0 ? (
              <List>
                {userStats.recentTournaments.map((tournament) => (
                  <ListItem 
                    key={tournament.id}
                    divider
                    component="a"
                    href={`/tournaments/${tournament.id}`}
                    sx={{ 
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: tournament.rank <= 3 ? MEDAL_COLORS[tournament.rank] : 'grey.300' }}>
                        {tournament.rank <= 3 ? (
                          <MilitaryTechIcon />
                        ) : (
                          <EmojiEventsIcon />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={tournament.name}
                      secondary={`${new Date(tournament.date).toLocaleDateString()} • Ranked ${getRankText(tournament.rank)} of ${tournament.totalPlayers}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  You haven't participated in any tournaments yet.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  component="a"
                  href="/tournaments"
                >
                  Browse Tournaments
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Achievements */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MilitaryTechIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">Achievements</Typography>
            </Box>
            
            {userStats.achievements.length > 0 ? (
              <Grid container spacing={2}>
                {userStats.achievements.map((achievement) => (
                  <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                    <Paper 
                      elevation={1}
                      sx={{ 
                        p: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MilitaryTechIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {achievement.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1, flexGrow: 1 }}>
                        {achievement.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Earned on {new Date(achievement.dateEarned).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  Complete challenges and win games to earn achievements!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper function to create rgba color
function alpha(color: string, opacity: number): string {
  return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`;
}

// Medal colors for top 3 rankings
const MEDAL_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

export default UserStats; 