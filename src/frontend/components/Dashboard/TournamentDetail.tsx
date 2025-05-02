import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Divider, Button, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Paper } from "@mui/material";
import * as tournamentApi from '../../api/tournamentApi';
import { useUserProfile } from "../../contexts/UserContext";
import { getWallet, Wallet } from '../../api/walletApi';

interface Tournament {
  id: number;
  name: string;
  tournament_type: string;
  game_type: string;
  format: string;
  status: string;
  entry_fee?: number;
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
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
    // Fetch wallet
    const fetchWallet = async () => {
      setWalletLoading(true);
      setWalletError(null);
      try {
        const w = await getWallet();
        setWallet(w);
      } catch (err: any) {
        setWalletError(err.response?.data?.error || err.message || 'Failed to load wallet.');
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, [tournamentId]);

  // --- Real-time updates (polling) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const pollTournament = async () => {
      try {
        const data = await tournamentApi.getTournament(Number(tournamentId));
        setTournament(data);
        setParticipants(data.participants || []);
        setMatches(data.matches || []);
      } catch (err: any) {
        // Optionally handle polling errors silently
      }
    };
    interval = setInterval(pollTournament, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
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

  const handleJoinClick = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmJoin = async () => {
    if (!tournament) return;
    setJoining(true);
    setJoinError(null);
    setJoinSuccess(null);
    setConfirmDialogOpen(false);
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
  };

  // --- Bracket Visualization Helper ---
  // Group matches by round
  const bracketByRound = matches.reduce<{ [round: number]: Match[] }>((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});
  const sortedRounds = Object.keys(bracketByRound)
    .map(Number)
    .sort((a, b) => a - b);

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
          {typeof tournament.entry_fee !== 'undefined' && (
            <Typography variant="subtitle2" gutterBottom>
              Entry Fee: <b>{tournament.entry_fee}</b> Dojo Coins
              {walletLoading ? (
                <span style={{ marginLeft: 12 }}><CircularProgress size={14} /></span>
              ) : walletError ? (
                <span style={{ marginLeft: 12, color: 'red' }}>Wallet error</span>
              ) : wallet ? (
                <span style={{ marginLeft: 12, color: wallet.balance < tournament.entry_fee ? 'red' : '#4caf50' }}>
                  Balance: <b>{wallet.balance}</b> Dojo Coins
                </span>
              ) : null}
            </Typography>
          )}
          {isJoinable && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                disabled={Boolean(joining || (wallet && typeof tournament.entry_fee === 'number' && wallet.balance < tournament.entry_fee))}
                onClick={handleJoinClick}
              >
                {joining ? <CircularProgress size={20} /> : 'Join Tournament'}
              </Button>
              {joinError && <Alert severity="error" sx={{ mt: 1 }}>{joinError}</Alert>}
              {joinSuccess && <Alert severity="success" sx={{ mt: 1 }}>{joinSuccess}</Alert>}
              <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
                <DialogTitle>Confirm Tournament Entry</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Are you sure you want to join <b>{tournament?.name}</b>?<br />
                    Entry Fee: <b>{'entry_fee' in tournament ? tournament.entry_fee : 'N/A'} Dojo Coins</b>
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setConfirmDialogOpen(false)} color="secondary">Cancel</Button>
                  <Button onClick={handleConfirmJoin} color="primary" variant="contained">Confirm & Join</Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6">Bracket</Typography>
          {matches.length === 0 ? (
            <Typography>No matches have been scheduled for the tournament yet.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', my: 2 }}>
              {sortedRounds.map(round => (
                <Paper key={round} sx={{ p: 2, mx: 1, minWidth: 220, background: '#f6f8fa' }} elevation={2}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Round {round}</Typography>
                  {bracketByRound[round].map(m => (
                    <Box key={m.id} sx={{ mb: 2, p: 1, background: '#fff', borderRadius: 1, boxShadow: 1 }}>
                      <Typography variant="body2">
                        <b>Match {m.match_number}</b>
                      </Typography>
                      <Typography variant="body2">
                        <strong>Player 1:</strong> <span style={{color: userProfile && m.player1_id === userProfile.id ? '#4caf50' : undefined}}>{getUsername(m.player1_id)}</span>
                        {' vs '}
                        <strong>Player 2:</strong> <span style={{color: userProfile && m.player2_id === userProfile.id ? '#4caf50' : undefined}}>{m.player2_id ? getUsername(m.player2_id) : 'BYE'}</span>
                      </Typography>
                      <Chip
                        label={m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        color={m.status === 'scheduled' ? 'info' : m.status === 'completed' ? 'success' : 'default'}
                        size="small"
                        sx={{ my: 0.5, fontWeight: 500 }}
                      />
                      {m.winner_id && (
                        <Typography variant="body2" sx={{ color: '#388e3c' }}>
                          <strong>Winner:</strong> {getUsername(m.winner_id)}
                        </Typography>
                      )}
                      {m.score && (
                        <Typography variant="body2"><strong>Score:</strong> {m.score}</Typography>
                      )}
                    </Box>
                  ))}
                </Paper>
              ))}
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
        </>
      )}
    </Box>
  );
};

export default TournamentDetail;
