import React, { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, ListItemText, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import * as tournamentApi from '../../api/tournamentApi';
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

const TournamentList: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

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
  }, []);

  const handleJoinClick = (t: Tournament) => {
    setSelectedTournament(t);
    setConfirmDialogOpen(true);
  };

  const handleConfirmJoin = async () => {
    if (!selectedTournament) return;
    setJoiningId(selectedTournament.id);
    setJoinSuccess(null);
    setError(null);
    setConfirmDialogOpen(false);
    try {
      await tournamentApi.joinTournament(selectedTournament.id);
      setJoinSuccess(`Joined tournament ${selectedTournament.id} successfully!`);
      // Optionally refetch tournaments
      fetchTournaments();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to join tournament.');
    } finally {
      setJoiningId(null);
      setSelectedTournament(null);
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
                  onClick={() => handleJoinClick(t)}
                  disabled={Boolean(joiningId === t.id || (wallet && typeof t.entry_fee === 'number' && wallet.balance < t.entry_fee))}
                >
                  {joiningId === t.id ? <CircularProgress size={18} /> : 'Join'}
                </Button>
              } component={RouterLink} to={`/tournament/${t.id}`} button>
                <ListItemText
                  primary={<>
                    {t.name} ({t.tournament_type}, {t.game_type})
                    {typeof t.entry_fee !== 'undefined' && (
                      <span style={{ marginLeft: 12, fontSize: 13 }}>
                        | Entry Fee: <b>{t.entry_fee}</b> Dojo Coins
                        {walletLoading ? (
                          <span style={{ marginLeft: 8 }}><CircularProgress size={12} /></span>
                        ) : walletError ? (
                          <span style={{ marginLeft: 8, color: 'red' }}>Wallet error</span>
                        ) : wallet ? (
                          <span style={{ marginLeft: 8, color: wallet.balance < t.entry_fee ? 'red' : '#4caf50' }}>
                            Balance: <b>{wallet.balance}</b>
                          </span>
                        ) : null}
                      </span>
                    )}
                  </>}
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
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Tournament Entry</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedTournament ? (
              <>Are you sure you want to join <b>{selectedTournament.name}</b>?<br />
              Entry Fee: <b>{'entry_fee' in selectedTournament ? selectedTournament.entry_fee : 'N/A'} Dojo Coins</b></>
            ) : null}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="secondary">Cancel</Button>
          <Button onClick={handleConfirmJoin} color="primary" variant="contained">Confirm & Join</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentList;
