import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, ListItemText, Button, CircularProgress, Alert } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import * as tournamentApi from '../../api/tournamentApi';

interface Tournament {
  id: number;
  name: string;
  tournament_type: string;
  game_type: string;
  format: string;
  status: string;
}

const TournamentList: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tournamentApi.listTournaments();
      setTournaments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load tournaments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleJoin = async (id: number) => {
    setJoiningId(id);
    setJoinSuccess(null);
    setError(null);
    try {
      await tournamentApi.joinTournament(id);
      setJoinSuccess(`Joined tournament ${id} successfully!`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to join tournament.');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h6">Available Tournaments</Typography>
      {loading && <CircularProgress size={24} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {joinSuccess && <Alert severity="success" sx={{ mt: 2 }}>{joinSuccess}</Alert>}
      {!loading && !error && (
        <List>
          {tournaments.length === 0 ? (
            <ListItem><ListItemText primary="No tournaments found." /></ListItem>
          ) : (
            tournaments.map(t => (
              <ListItem key={t.id} divider secondaryAction={
                <Button
                  variant="outlined"
                  onClick={() => handleJoin(t.id)}
                  disabled={joiningId === t.id}
                >
                  {joiningId === t.id ? <CircularProgress size={18} /> : 'Join'}
                </Button>
              } component={RouterLink} to={`/tournament/${t.id}`} button>
                <ListItemText
                  primary={`${t.name} (${t.tournament_type}, ${t.game_type})`}
                  secondary={`Format: ${t.format} | Status: ${t.status}`}
                />
              </ListItem>
            ))
          )}
        </List>
      )}
      <Button onClick={fetchTournaments} sx={{ mt: 2 }} disabled={loading}>
        Refresh
      </Button>
    </Box>
  );
};

export default TournamentList;
