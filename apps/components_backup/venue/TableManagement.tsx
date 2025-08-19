import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  TableBar,
  Add,
  Edit,
  Delete,
  Person,
  AccessTime,
  CheckCircle,
  Cancel,
  SportsEsports,
  Info,
  Refresh,
} from '@mui/icons-material';

interface Table {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentPlayers?: string[];
  gameType?: string;
  startTime?: string;
  reservedBy?: string;
  reservedUntil?: string;
}

interface TableManagementProps {
  venueId: string;
}

export const TableManagement: React.FC<TableManagementProps> = ({
  venueId,
}) => {
  const theme = useTheme();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    status: 'available' as Table['status'],
  });

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
    purple: '#8b00ff',
    orange: '#ff6600',
  };

  // Mock data - replace with actual API calls
  useEffect(() => {
    fetchTables();
  }, [venueId]);

  const fetchTables = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTables([
        {
          id: '1',
          number: '1',
          status: 'available',
        },
        {
          id: '2',
          number: '2',
          status: 'occupied',
          currentPlayers: ['Player1', 'Player2'],
          gameType: '8-ball',
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          number: '3',
          status: 'reserved',
          reservedBy: 'John Doe',
          reservedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          number: '4',
          status: 'available',
        },
        {
          id: '5',
          number: '5',
          status: 'occupied',
          currentPlayers: ['Player3', 'Player4'],
          gameType: '9-ball',
          startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: '6',
          number: '6',
          status: 'maintenance',
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return neonColors.primary;
      case 'occupied':
        return neonColors.warning;
      case 'reserved':
        return neonColors.info;
      case 'maintenance':
        return neonColors.error;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: Table['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle />;
      case 'occupied':
        return <Person />;
      case 'reserved':
        return <AccessTime />;
      case 'maintenance':
        return <Cancel />;
      default:
        return <Info />;
    }
  };

  const getTimePlayed = (startTime?: string) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
    return `${diff} min`;
  };

  const handleAddTable = () => {
    // API call to add table
    const newTable: Table = {
      id: Date.now().toString(),
      number: formData.number,
      status: formData.status,
    };
    setTables([...tables, newTable]);
    setAddDialogOpen(false);
    setFormData({ number: '', status: 'available' });
  };

  const handleUpdateTable = () => {
    if (!selectedTable) return;
    // API call to update table
    setTables(
      tables.map((t) =>
        t.id === selectedTable.id ? { ...t, status: formData.status } : t
      )
    );
    setEditDialogOpen(false);
    setSelectedTable(null);
  };

  const handleDeleteTable = (tableId: string) => {
    // API call to delete table
    setTables(tables.filter((t) => t.id !== tableId));
  };

  const occupancyRate =
    tables.length > 0
      ? Math.round(
          (tables.filter((t) => t.status === 'occupied').length /
            tables.length) *
            100
        )
      : 0;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
          }}
        >
          Table Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton
            onClick={fetchTables}
            sx={{
              color: neonColors.info,
              border: `1px solid ${alpha(neonColors.info, 0.3)}`,
              '&:hover': {
                background: alpha(neonColors.info, 0.1),
                borderColor: neonColors.info,
              },
            }}
          >
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.info} 90%)`,
              boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${neonColors.primary} 10%, ${neonColors.info} 100%)`,
                boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.7)}`,
              },
            }}
          >
            Add Table
          </Button>
        </Box>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: alpha(theme.palette.background.paper, 0.9),
              border: `1px solid ${alpha(neonColors.info, 0.3)}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                sx={{ color: neonColors.info, fontWeight: 'bold' }}
              >
                {tables.length}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Total Tables
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: alpha(theme.palette.background.paper, 0.9),
              border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                sx={{ color: neonColors.primary, fontWeight: 'bold' }}
              >
                {tables.filter((t) => t.status === 'available').length}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: alpha(theme.palette.background.paper, 0.9),
              border: `1px solid ${alpha(neonColors.warning, 0.3)}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                sx={{ color: neonColors.warning, fontWeight: 'bold' }}
              >
                {tables.filter((t) => t.status === 'occupied').length}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Occupied
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: alpha(theme.palette.background.paper, 0.9),
              border: `1px solid ${alpha(neonColors.secondary, 0.3)}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                sx={{ color: neonColors.secondary, fontWeight: 'bold' }}
              >
                {occupancyRate}%
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Occupancy Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tables Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: neonColors.primary }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tables.map((table) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
              <Card
                sx={{
                  height: '100%',
                  background: alpha(theme.palette.background.paper, 0.95),
                  border: `2px solid ${alpha(getStatusColor(table.status), 0.5)}`,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 0 30px ${alpha(getStatusColor(table.status), 0.6)}`,
                    borderColor: getStatusColor(table.status),
                  },
                }}
                onClick={() => {
                  setSelectedTable(table);
                  setFormData({ number: table.number, status: table.status });
                  setEditDialogOpen(true);
                }}
              >
                <CardContent>
                  {/* Table Number */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableBar
                        sx={{
                          fontSize: 40,
                          color: getStatusColor(table.status),
                          filter: `drop-shadow(0 0 10px ${getStatusColor(table.status)})`,
                        }}
                      />
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 'bold',
                          color: getStatusColor(table.status),
                          textShadow: `0 0 10px ${getStatusColor(table.status)}`,
                        }}
                      >
                        {table.number}
                      </Typography>
                    </Box>
                    <Tooltip title={table.status}>
                      <Box>{getStatusIcon(table.status)}</Box>
                    </Tooltip>
                  </Box>

                  {/* Status Chip */}
                  <Chip
                    label={table.status.toUpperCase()}
                    size="small"
                    sx={{
                      background: alpha(getStatusColor(table.status), 0.2),
                      color: getStatusColor(table.status),
                      border: `1px solid ${getStatusColor(table.status)}`,
                      textShadow: `0 0 5px ${getStatusColor(table.status)}`,
                      fontWeight: 'bold',
                      mb: 2,
                    }}
                  />

                  {/* Additional Info */}
                  {table.status === 'occupied' && table.currentPlayers && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        Players:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: neonColors.info }}
                      >
                        {table.currentPlayers.join(' vs ')}
                      </Typography>
                      {table.gameType && (
                        <Chip
                          icon={<SportsEsports />}
                          label={table.gameType}
                          size="small"
                          sx={{
                            mt: 1,
                            background: alpha(neonColors.secondary, 0.2),
                            color: neonColors.secondary,
                            border: `1px solid ${neonColors.secondary}`,
                          }}
                        />
                      )}
                      {table.startTime && (
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 1, color: neonColors.warning }}
                        >
                          <AccessTime
                            sx={{
                              fontSize: 14,
                              verticalAlign: 'middle',
                              mr: 0.5,
                            }}
                          />
                          {getTimePlayed(table.startTime)}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {table.status === 'reserved' && table.reservedBy && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        Reserved by:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: neonColors.info }}
                      >
                        {table.reservedBy}
                      </Typography>
                      {table.reservedUntil && (
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 1, color: neonColors.warning }}
                        >
                          Until:{' '}
                          {new Date(table.reservedUntil).toLocaleTimeString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>

                {/* Quick Actions */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    '.MuiCard-root:hover &': {
                      opacity: 1,
                    },
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTable(table.id);
                    }}
                    sx={{
                      color: neonColors.error,
                      background: alpha(neonColors.error, 0.1),
                      '&:hover': {
                        background: alpha(neonColors.error, 0.2),
                      },
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Table Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
            border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
            borderRadius: 2,
            boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.3)}`,
          },
        }}
      >
        <DialogTitle>Add New Table</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Table Number"
            fullWidth
            variant="outlined"
            value={formData.number}
            onChange={(e) =>
              setFormData({ ...formData, number: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as Table['status'],
                })
              }
              label="Status"
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="occupied">Occupied</MenuItem>
              <MenuItem value="reserved">Reserved</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddTable}
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.info} 90%)`,
            }}
          >
            Add Table
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
            border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
            borderRadius: 2,
            boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.3)}`,
          },
        }}
      >
        <DialogTitle>Edit Table {selectedTable?.number}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as Table['status'],
                })
              }
              label="Status"
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="occupied">Occupied</MenuItem>
              <MenuItem value="reserved">Reserved</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateTable}
            variant="contained"
            sx={{
              background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.info} 90%)`,
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableManagement;
