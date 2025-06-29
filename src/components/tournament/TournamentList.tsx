import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, Button, Typography, Card, Grid, Chip, CircularProgress, Alert } from '@mui/material';
import { EmojiEvents, Search, FilterList, Add, SportsEsports } from '@mui/icons-material';
import { SocketIOService } from '@/services/WebSocketService';

// Define a simple type for the tournament data expected from the API
// Expand this based on the actual data returned by the API
interface Tournament {
  id: number;
  name: string;
  format: string;
  status: string;
  start_date: string; // Assuming ISO string format
  entry_fee?: number;
  max_participants?: number;
  current_participants?: number;
  venue_name?: string;
  prize_pool?: number;
  // Add other relevant fields: venue_name, entry_fee, max_participants, etc.
}

const TOURNAMENT_TYPES = ['8-ball', '9-ball', 'straight pool', 'other']; // Example types
const TOURNAMENT_STATUSES = ['upcoming', 'open', 'active', 'full', 'closed', 'completed', 'cancelled'];

const TournamentList: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Real-time: fetchTournaments as a stable callback
  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/tournaments/';
      const params = [];
      if (typeFilter) params.push(`type=${encodeURIComponent(typeFilter)}`);
      if (statusFilter) params.push(`status=${encodeURIComponent(statusFilter)}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (params.length) url += '?' + params.join('&');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Tournament[] = await response.json();
      setTournaments(data);
    } catch (err) {
      console.error('Failed to fetch tournaments:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, statusFilter, search]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Real-time: subscribe to tournament_update
  useEffect(() => {
    const socket = SocketIOService.getInstance();
    socket.connect();
    const handleTournamentUpdate = () => {
      fetchTournaments();
    };
    socket.on('tournament_update', handleTournamentUpdate);
    return () => {
      socket.off('tournament_update', handleTournamentUpdate);
      socket.disconnect();
    };
  }, [fetchTournaments]);

  // Admin/organizer check (scaffold)
  const isAdmin = false; // TODO: Replace with real auth/role check

  // Cyberpunk styling
  const cyberCardStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #00ff9d',
    borderRadius: '15px',
    padding: '1.5rem',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.4s ease',
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px' as const,
    boxShadow: '0 0 30px rgba(0, 255, 157, 0.1), inset 0 0 30px rgba(0, 255, 157, 0.05)',
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
    '&:hover': {
      transform: 'translateY(-5px) scale(1.02)',
      borderColor: '#00a8ff',
      boxShadow: '0 15px 40px rgba(0, 168, 255, 0.3), inset 0 0 40px rgba(0, 168, 255, 0.2)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent, rgba(0, 255, 157, 0.1), transparent)',
      transform: 'translateZ(-1px)',
    }
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow: '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  };

  const cyberButtonStyle = {
    background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    padding: '12px 24px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
      background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
      transition: '0.5s',
    },
    '&:hover::before': {
      left: '100%',
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#00ff9d';
      case 'active': return '#00a8ff';
      case 'full': return '#ff00ff';
      case 'completed': return '#ffff00';
      case 'cancelled': return '#ff4444';
      default: return '#888888';
    }
  };

  const getStatusChipStyle = (status: string) => ({
    background: `rgba(${status === 'open' ? '0, 255, 157' : status === 'active' ? '0, 168, 255' : status === 'full' ? '255, 0, 255' : status === 'completed' ? '255, 255, 0' : status === 'cancelled' ? '255, 68, 68' : '136, 136, 136'}, 0.2)`,
    border: `1px solid ${getStatusColor(status)}`,
    color: getStatusColor(status),
    textShadow: `0 0 5px ${getStatusColor(status)}`,
    fontWeight: 600,
    letterSpacing: '1px',
  });

  return (
    <Box 
      sx={{ 
        p: 3,
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(transparent 95%, rgba(0,255,157,0.2) 95%),
            linear-gradient(90deg, transparent 95%, rgba(0,255,157,0.2) 95%)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.15,
          pointerEvents: 'none',
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            ...neonTextStyle,
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <EmojiEvents sx={{ fontSize: '2rem', color: '#00ff9d' }} />
          Tournament Arena
        </Typography>

        {/* Search and Filter Controls */}
        <Card sx={cyberCardStyle} style={{ marginBottom: '2rem' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Tournaments"
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: '#00ff9d', mr: 1 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: '#00ff9d',
                    },
                    '&:hover fieldset': {
                      borderColor: '#00a8ff',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00ff9d',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#00ff9d',
                    '&.Mui-focused': {
                      color: '#00a8ff',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#00ff9d' }}>Game Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Game Type"
                  onChange={e => setTypeFilter(e.target.value)}
                  startAdornment={<SportsEsports sx={{ color: '#00ff9d', mr: 1 }} />}
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff9d',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00a8ff',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff9d',
                    },
                  }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {TOURNAMENT_TYPES.map(type => (
                    <MenuItem key={type} value={type} sx={{ color: '#fff' }}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#00ff9d' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={e => setStatusFilter(e.target.value)}
                  startAdornment={<FilterList sx={{ color: '#00ff9d', mr: 1 }} />}
                  sx={{
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff9d',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00a8ff',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00ff9d',
                    },
                  }}
                >
                  <MenuItem value="">All Status</MenuItem>
                  {TOURNAMENT_STATUSES.map(status => (
                    <MenuItem key={status} value={status} sx={{ color: '#fff' }}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              {isAdmin && (
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  sx={cyberButtonStyle}
                  fullWidth
                >
                  Create
                </Button>
              )}
            </Grid>
          </Grid>
        </Card>

        {/* Loading State */}
        {isLoading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="400px"
            sx={{
              background: 'rgba(10, 10, 10, 0.95)',
              borderRadius: 2,
              border: '1px solid rgba(0, 255, 157, 0.2)',
              boxShadow: '0 0 20px rgba(0, 255, 157, 0.1)'
            }}
          >
            <CircularProgress 
              sx={{ 
                color: '#00ff9d',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }} 
            />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ 
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid #ff4444',
            color: '#ff4444',
            '& .MuiAlert-icon': { color: '#ff4444' }
          }}>
            Error fetching tournaments: {error}
          </Alert>
        ) : tournaments.length === 0 ? (
          <Card sx={cyberCardStyle}>
            <Typography sx={{ color: '#888', textAlign: 'center', py: 4 }}>
              No tournaments found matching your criteria.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {tournaments.map((tournament) => (
              <Grid item xs={12} md={6} lg={4} key={tournament.id}>
                <Card sx={cyberCardStyle}>
                  <Link 
                    to={`/tournaments/${tournament.id}`} 
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          ...neonTextStyle,
                          fontSize: '1.2rem',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tournament.name}
                      </Typography>
                      
                      <Chip 
                        label={tournament.format} 
                        size="small" 
                        sx={{ 
                          background: 'rgba(0, 168, 255, 0.2)',
                          border: '1px solid #00a8ff',
                          color: '#00a8ff',
                          textShadow: '0 0 5px #00a8ff',
                          fontWeight: 600,
                          mr: 1
                        }}
                      />
                      
                      <Chip 
                        label={tournament.status} 
                        size="small" 
                        sx={getStatusChipStyle(tournament.status)}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ color: '#888', fontSize: '0.9rem', mb: 0.5 }}>
                        Starts: {new Date(tournament.start_date).toLocaleDateString()}
                      </Typography>
                      
                      {tournament.venue_name && (
                        <Typography sx={{ color: '#888', fontSize: '0.9rem', mb: 0.5 }}>
                          Venue: {tournament.venue_name}
                        </Typography>
                      )}
                      
                      {tournament.entry_fee && (
                        <Typography sx={{ color: '#00ff9d', fontSize: '0.9rem', mb: 0.5 }}>
                          Entry: {tournament.entry_fee} coins
                        </Typography>
                      )}
                      
                      {tournament.prize_pool && (
                        <Typography sx={{ color: '#00a8ff', fontSize: '0.9rem', mb: 0.5 }}>
                          Prize Pool: {tournament.prize_pool} coins
                        </Typography>
                      )}
                      
                      {tournament.current_participants !== undefined && tournament.max_participants && (
                        <Typography sx={{ color: '#888', fontSize: '0.9rem' }}>
                          Players: {tournament.current_participants}/{tournament.max_participants}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mt: 'auto'
                    }}>
                      <Typography sx={{ 
                        color: '#00ff9d', 
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        View Details
                      </Typography>
                      <EmojiEvents sx={{ color: '#00ff9d', fontSize: '1.2rem' }} />
                    </Box>
                  </Link>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default TournamentList; 