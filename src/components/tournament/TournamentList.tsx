import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, Button } from '@mui/material';
import { SocketIOService } from '@/services/WebSocketService';

// Define a simple type for the tournament data expected from the API
// Expand this based on the actual data returned by the API
interface Tournament {
  id: number;
  name: string;
  format: string;
  status: string;
  start_date: string; // Assuming ISO string format
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

  return (
    <Box>
      <h2>Tournament List</h2>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={e => setTypeFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {TOURNAMENT_TYPES.map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={e => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {TOURNAMENT_STATUSES.map(status => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {isAdmin && (
          <Button variant="contained" color="secondary">Manage Tournaments</Button>
        )}
      </Box>
      {isLoading ? (
        <div>Loading tournaments...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>Error fetching tournaments: {error}</div>
      ) : tournaments.length === 0 ? (
        <div>No tournaments found.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tournaments.map((tournament) => (
            <li key={tournament.id} style={{ marginBottom: '15px', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
              <Link to={`/tournaments/${tournament.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>{tournament.name}</strong>
                <div>Format: {tournament.format}</div>
                <div>Status: {tournament.status}</div>
                <div>Starts: {new Date(tournament.start_date).toLocaleDateString()}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
};

export default TournamentList; 