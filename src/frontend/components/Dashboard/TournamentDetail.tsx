import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Divider, Button, Chip } from "@mui/material";
import * as tournamentApi from '../../api/tournamentApi';
import { useUserProfile } from "../../contexts/UserContext";

interface Tournament {
  id: number;
  name: string;
  tournament_type: string;
  game_type: string;
  format: string;
  status: string;
}

interface Match {
  id: number;
  round: number;
  match_number: number;
  player1_id: number;
  player2_id: number | null;
  status: string;
  winner_id?: number | null;
  score?: string;
}

interface Participant {
  id: number;
  username: string;
  status: string;
}

const TournamentDetail: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const { profile: userProfile, isLoading: profileLoading } = useUserProfile();

  useEffect(() => {
    const fetchTournament = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await tournamentApi.getTournament(Number(tournamentId));
        setTournament(data);
        setParticipants(data.participants || []);
        setMatches(data.matches || []);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load tournament.');
      } finally {
        setLoading(false);
      }
    };
    fetchTournament();
  }, [tournamentId]);

  // Helper: is user a participant?
  const isParticipant = userProfile && participants.some(p => p.id === userProfile.id);
  // Helper: is tournament joinable?
  const isJoinable = tournament && tournament.status === 'open' && !isParticipant;

  // Helper: Get username by participant id
  const getUsername = (id: number) => {
    const p = participants.find(p => p.id === id);
    if (!p) return id;
    if (userProfile && p.id === userProfile.id) return `${p.username} (You)`;
    return p.username;
  };

  return (
    <Box sx={{ my: 4 }}>
      <Button component={RouterLink} to="/dashboard" sx={{ mb: 2 }}>Back to Dashboard</Button>
      {loading || profileLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : tournament && (
        <>
          <Typography variant="h5" gutterBottom>{tournament.name}</Typography>
          <Typography variant="subtitle1" gutterBottom>
            Type: {tournament.tournament_type} | Game: {tournament.game_type} | Format: {tournament.format} | Status: {tournament.status}
          </Typography>
          {isJoinable && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={joining}
                onClick={async () => {
                  setJoining(true);
                  setJoinError(null);
                  setJoinSuccess(null);
                  try {
                    await tournamentApi.joinTournament(tournament.id);
                    setJoinSuccess('Successfully joined the tournament!');
                    // Refetch tournament data
                    const data = await tournamentApi.getTournament(Number(tournamentId));
                    setTournament(data);
                    setParticipants(data.participants || []);
                  } catch (err: any) {
                    setJoinError(err.response?.data?.error || err.message || 'Failed to join.');
                  } finally {
                    setJoining(false);
                  }
                }}
              >
                {joining ? <CircularProgress size={20} /> : 'Join Tournament'}
              </Button>
              {joinError && <Alert severity="error" sx={{ mt: 1 }}>{joinError}</Alert>}
              {joinSuccess && <Alert severity="success" sx={{ mt: 1 }}>{joinSuccess}</Alert>}
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6">Participants</Typography>
          {participants.length === 0 ? (
            <Typography>No participants have joined the tournament yet.</Typography>
          ) : (
            <List>
              {participants.map(p => (
                <ListItem key={p.id}>
                  <ListItemText
                    primary={<>
                      {p.username}
                      {userProfile && p.id === userProfile.id && (
                        <span style={{ marginLeft: 8, color: '#4caf50', fontWeight: 500 }}>(You)</span>
                      )}
                    </>}
                    secondary={<>
                      <Chip
                        label={p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        color={p.status === 'joined' ? 'success' : p.status === 'eliminated' ? 'default' : 'primary'}
                        size="small"
                        sx={{ ml: 0.5, fontWeight: 500 }}
                      />
                    </>}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6">Matches</Typography>
          {matches.length === 0 ? (
            <Typography>No matches have been scheduled for the tournament yet.</Typography>
          ) : (
            <List>
              {matches.map(m => (
                <ListItem key={m.id} divider>
                  <ListItemText
                    primary={`Round ${m.round} - Match ${m.match_number}`}
                    secondary={<>
                      <strong>Player 1:</strong> <span style={{color: userProfile && m.player1_id === userProfile.id ? '#4caf50' : undefined}}>{getUsername(m.player1_id)}</span>
                      {' vs '}
                      <strong>Player 2:</strong> <span style={{color: userProfile && m.player2_id === userProfile.id ? '#4caf50' : undefined}}>{m.player2_id ? getUsername(m.player2_id) : 'BYE'}</span>
                      {' | '}
                      <Chip
                        label={m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        color={m.status === 'scheduled' ? 'info' : m.status === 'completed' ? 'success' : 'default'}
                        size="small"
                        sx={{ mx: 1, fontWeight: 500 }}
                      />
                      {m.winner_id && (
                        <span style={{marginLeft: 8}}>
                          <strong>Winner:</strong> <span style={{color: userProfile && m.winner_id === userProfile.id ? '#4caf50' : undefined}}>{getUsername(m.winner_id)}</span>
                        </span>
                      )}
                      {m.score && (
                        <span style={{marginLeft: 8}}><strong>Score:</strong> {m.score}</span>
                      )}
                    </>}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}
    </Box>
  );
};

export default TournamentDetail;
