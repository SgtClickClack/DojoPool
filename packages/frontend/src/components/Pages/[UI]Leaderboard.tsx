import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  SportsScore as ScoreIcon,
  Games as GamesIcon,
  EmojiEvents as AchievementsIcon,
} from '@mui/icons-material';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
  gamesCompleted: number;
  achievements: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leaderboard-tabpanel-${index}`}
      aria-labelledby={`leaderboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
};

const MobileLeaderboardCard = ({ entry }: { entry: LeaderboardEntry }) => {
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <Card
      sx={{
        mb: 2,
        backgroundColor: entry.rank === 1 ? 'rgba(255, 215, 0, 0.1)' : 'inherit',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              {entry.rank === 1 ? (
                <TrophyIcon sx={{ color: 'gold', fontSize: '1.5rem' }} />
              ) : (
                <Typography variant="h6">#{entry.rank}</Typography>
              )}
            </Box>
            <Avatar
              src={entry.avatarUrl}
              alt={entry.username}
              sx={{ width: 40, height: 40, mr: 1 }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {entry.username}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScoreIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body2">Score: {entry.score}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GamesIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body2">Games: {entry.gamesCompleted}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setShowAchievements(!showAchievements)}
          >
            <AchievementsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Achievements ({entry.achievements.length})
            </Typography>
          </Box>
          {showAchievements && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {entry.achievements.map((achievement) => (
                <Chip
                  key={achievement}
                  label={achievement}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const Leaderboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // TODO: Replace with actual API call
        const mockData: LeaderboardEntry[] = [
          {
            rank: 1,
            userId: '1',
            username: 'Explorer123',
            avatarUrl: '/avatars/user1.jpg',
            score: 1250,
            gamesCompleted: 8,
            achievements: ['First Victory', 'Speed Runner', 'Perfect Score'],
          },
          {
            rank: 2,
            userId: '2',
            username: 'AdventureSeeker',
            avatarUrl: '/avatars/user2.jpg',
            score: 1100,
            gamesCompleted: 7,
            achievements: ['First Victory', 'Team Player'],
          },
          {
            rank: 3,
            userId: '3',
            username: 'QuestMaster',
            avatarUrl: '/avatars/user3.jpg',
            score: 950,
            gamesCompleted: 6,
            achievements: ['First Victory'],
          },
        ];
        setLeaderboardData(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const renderLeaderboardContent = () => {
    if (isMobile) {
      return leaderboardData.map((entry) => (
        <MobileLeaderboardCard key={entry.userId} entry={entry} />
      ));
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Player</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Games</TableCell>
              <TableCell>Achievements</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboardData.map((entry) => (
              <TableRow
                key={entry.userId}
                sx={{
                  backgroundColor: entry.rank === 1 ? 'rgba(255, 215, 0, 0.1)' : 'inherit',
                }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {entry.rank === 1 && <TrophyIcon sx={{ color: 'gold', mr: 1 }} />}#{entry.rank}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar
                      src={entry.avatarUrl}
                      alt={entry.username}
                      sx={{ width: 32, height: 32, mr: 1 }}
                    />
                    {entry.username}
                  </Box>
                </TableCell>
                <TableCell align="right">{entry.score}</TableCell>
                <TableCell align="right">{entry.gamesCompleted}</TableCell>
                <TableCell>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {entry.achievements.map((achievement) => (
                      <Chip
                        key={achievement}
                        label={achievement}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
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
        sx={{ mb: { xs: 2, sm: 3 } }}
      >
        Leaderboard
      </Typography>

      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="leaderboard tabs"
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            '& .MuiTab-root': {
              fontSize: isMobile ? '0.875rem' : '1rem',
              minWidth: isMobile ? 'auto' : 120,
            },
          }}
        >
          <Tab label="All Time" />
          <Tab label="This Month" />
          <Tab label="This Week" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderLeaderboardContent()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography color="text.secondary" align="center">
          Monthly leaderboard data will be displayed here
        </Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography color="text.secondary" align="center">
          Weekly leaderboard data will be displayed here
        </Typography>
      </TabPanel>
    </Container>
  );
};

export default Leaderboard;
