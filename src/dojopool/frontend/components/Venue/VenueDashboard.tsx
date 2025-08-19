import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Switch,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  People,
  TableBar,
  LocalOffer,
  BarChart,
  CheckCircle,
  Cancel,
  Chat,
} from '@mui/icons-material';
import ChatInterface from '../Chat/ChatInterface';

interface Table {
  id: string;
  number: number;
  status: 'available' | 'occupied' | 'reserved';
  currentPlayers: number;
}

interface Deal {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

interface VenueAnalytics {
  occupancyRate: number;
  revenueToday: number;
  gamesPlayed: number;
  avgSessionTime: number;
}

const VenueDashboard: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [analytics, setAnalytics] = useState<VenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    setTables([
      { id: '1', number: 1, status: 'available', currentPlayers: 0 },
      { id: '2', number: 2, status: 'occupied', currentPlayers: 4 },
      { id: '3', number: 3, status: 'reserved', currentPlayers: 0 },
    ]);
    setDeals([
      {
        id: '1',
        title: 'Happy Hour',
        description: '50% off tables 5-7pm',
        active: true,
      },
      {
        id: '2',
        title: 'Ladies Night',
        description: 'Free entry for women on Thursdays',
        active: false,
      },
    ]);
    setAnalytics({
      occupancyRate: 0.67,
      revenueToday: 320,
      gamesPlayed: 42,
      avgSessionTime: 48,
    });
    setLoading(false);
  }, []);

  const handleCreateDeal = () => setShowCreateDeal(true);
  const handleToggleDeal = (dealId: string) => {
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId ? { ...deal, active: !deal.active } : deal
      )
    );
  };
  const handleDeleteDeal = (dealId: string) => {
    setDeals((prev) => prev.filter((deal) => deal.id !== dealId));
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Venue Dashboard</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateDeal}
          >
            Add Deal
          </Button>
          <Tooltip title="Toggle Chat">
            <IconButton
              onClick={() => setShowChat(!showChat)}
              color={showChat ? 'primary' : 'default'}
            >
              <Chat />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Grid container spacing={3}>
        {/* Tables */}
        <Grid item xs={12} md={showChat ? 4 : 6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tables
            </Typography>
            <List>
              {tables.map((table) => (
                <ListItem key={table.id}>
                  <TableBar sx={{ mr: 1 }} />
                  <ListItemText
                    primary={`Table ${table.number}`}
                    secondary={`Status: ${table.status} | Players: ${table.currentPlayers}`}
                  />
                  <Chip
                    label={table.status}
                    color={
                      table.status === 'available'
                        ? 'success'
                        : table.status === 'occupied'
                          ? 'warning'
                          : 'info'
                    }
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        {/* Deals */}
        <Grid item xs={12} md={showChat ? 4 : 3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Deals
            </Typography>
            <List>
              {deals.map((deal) => (
                <ListItem key={deal.id}>
                  <LocalOffer sx={{ mr: 1 }} />
                  <ListItemText
                    primary={deal.title}
                    secondary={deal.description}
                  />
                  <Switch
                    checked={deal.active}
                    onChange={() => handleToggleDeal(deal.id)}
                    color="primary"
                  />
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDeleteDeal(deal.id)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        {/* Analytics */}
        <Grid item xs={12} md={showChat ? 4 : 3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Analytics
            </Typography>
            {analytics && (
              <>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <People fontSize="small" />
                  <Typography variant="body2">
                    Occupancy Rate: {(analytics.occupancyRate * 100).toFixed(0)}
                    %
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <BarChart fontSize="small" />
                  <Typography variant="body2">
                    Revenue Today: ${analytics.revenueToday}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TableBar fontSize="small" />
                  <Typography variant="body2">
                    Games Played: {analytics.gamesPlayed}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Schedule fontSize="small" />
                  <Typography variant="body2">
                    Avg. Session: {analytics.avgSessionTime} min
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
        {/* Chat Panel */}
        {showChat && (
          <Grid item xs={12} md={4}>
            <ChatInterface
              roomId="venue"
              roomType="venue"
              roomName="Venue Chat"
              maxHeight={600}
            />
          </Grid>
        )}
      </Grid>
      {/* Create Deal Dialog */}
      <Dialog
        open={showCreateDeal}
        onClose={() => setShowCreateDeal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Deal</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Deal Title" margin="normal" required />
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDeal(false)}>Cancel</Button>
          <Button variant="contained">Add Deal</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VenueDashboard;
