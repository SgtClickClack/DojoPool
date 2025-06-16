import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  alpha,
  LinearProgress,
  Zoom,
  Fade,
} from '@mui/material';
import {
  QrCodeScanner,
  LocationOn,
  CheckCircle,
  Cancel,
  Person,
  AccessTime,
  TableBar,
  SportsCricket,
  ExitToApp,
  Group,
  TrendingUp,
  Security,
  NetworkCheck,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { checkIn, checkOut, getActiveCheckins, getCheckinHistory, getOccupancyStats } from '../../services/venue/venue';
import { QRCodeScanner } from './QRCodeScanner';
import { GeolocationCheckIn } from './GeolocationCheckIn';
import moment from 'moment';

interface CheckInSystemProps {
  venueId: string;
  venueName?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`venue-tabpanel-${index}`}
      aria-labelledby={`venue-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const CheckInSystem: React.FC<CheckInSystemProps> = ({ venueId, venueName = 'Venue' }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeCheckins, setActiveCheckins] = useState<any[]>([]);
  const [checkinHistory, setCheckinHistory] = useState<any[]>([]);
  const [occupancyStats, setOccupancyStats] = useState<any>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkInMethod, setCheckInMethod] = useState<'qr' | 'geo' | 'manual'>('qr');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [gameType, setGameType] = useState<string>('8-ball');

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [venueId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [active, history, stats] = await Promise.all([
        getActiveCheckins(venueId),
        getCheckinHistory(venueId),
        getOccupancyStats(venueId),
      ]);
      setActiveCheckins(active);
      setCheckinHistory(history);
      setOccupancyStats(stats);
      
      // Check if current user is already checked in
      if (user) {
        setIsCheckedIn(active.some((checkin: any) => checkin.userId === user.uid));
      }
    } catch (error) {
      console.error('Error fetching check-in data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setCheckInError(null);

      const checkInData = {
        method: checkInMethod,
        qrCode: qrCode,
        location: location,
        tableNumber: tableNumber || undefined,
        gameType: gameType,
      };

      await checkIn(venueId, checkInData);
      setCheckInDialogOpen(false);
      setIsCheckedIn(true);
      await fetchData();
      
      // Reset form
      setQrCode(null);
      setLocation(null);
      setTableNumber('');
      setGameType('8-ball');
    } catch (error: any) {
      setCheckInError(error.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      await checkOut(venueId);
      setIsCheckedIn(false);
      await fetchData();
    } catch (error) {
      console.error('Error checking out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQrScan = (code: string) => {
    setQrCode(code);
    setCheckInMethod('qr');
  };

  const handleLocationReceived = (coords: { latitude: number; longitude: number }) => {
    setLocation(coords);
    setCheckInMethod('geo');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const renderOccupancyBar = () => {
    const occupancyRate = occupancyStats?.maxCapacity 
      ? (occupancyStats.currentOccupancy / occupancyStats.maxCapacity) * 100 
      : 0;
    
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: neonColors.info }}>
            Occupancy
          </Typography>
          <Typography variant="body2" sx={{ color: neonColors.warning }}>
            {occupancyStats?.currentOccupancy || 0} / {occupancyStats?.maxCapacity || 100}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={occupancyRate}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: alpha(neonColors.primary, 0.2),
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              background: `linear-gradient(90deg, ${neonColors.primary} 0%, ${neonColors.info} 100%)`,
              boxShadow: `0 0 10px ${neonColors.primary}`,
            },
          }}
        />
      </Box>
    );
  };

  return (
    <Box>
      {/* Header Card */}
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
          border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
          boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.2)}`,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
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
                {venueName} Check-In
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                Digital presence verification system
              </Typography>
            </Box>
            <Box>
              {isCheckedIn ? (
                <Button
                  variant="contained"
                  startIcon={<ExitToApp />}
                  onClick={handleCheckOut}
                  disabled={loading}
                  sx={{
                    background: `linear-gradient(45deg, ${neonColors.error} 30%, ${neonColors.orange} 90%)`,
                    boxShadow: `0 0 20px ${alpha(neonColors.error, 0.5)}`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${neonColors.error} 10%, ${neonColors.orange} 100%)`,
                      boxShadow: `0 0 30px ${alpha(neonColors.error, 0.7)}`,
                    },
                  }}
                >
                  Check Out
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<QrCodeScanner />}
                  onClick={() => setCheckInDialogOpen(true)}
                  disabled={loading}
                  sx={{
                    background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.info} 90%)`,
                    boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${neonColors.primary} 10%, ${neonColors.info} 100%)`,
                      boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.7)}`,
                    },
                  }}
                >
                  Check In
                </Button>
              )}
            </Box>
          </Box>

          {/* Occupancy Stats */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  p: 2,
                  background: alpha(neonColors.info, 0.1),
                  border: `1px solid ${alpha(neonColors.info, 0.3)}`,
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Group sx={{ color: neonColors.info, fontSize: 40 }} />
                <Typography variant="h5" sx={{ color: neonColors.info, fontWeight: 'bold' }}>
                  {occupancyStats?.currentOccupancy || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Current Players
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  p: 2,
                  background: alpha(neonColors.warning, 0.1),
                  border: `1px solid ${alpha(neonColors.warning, 0.3)}`,
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <TrendingUp sx={{ color: neonColors.warning, fontSize: 40 }} />
                <Typography variant="h5" sx={{ color: neonColors.warning, fontWeight: 'bold' }}>
                  {occupancyStats?.peakToday || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Peak Today
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  p: 2,
                  background: alpha(neonColors.primary, 0.1),
                  border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <CheckCircle sx={{ color: neonColors.primary, fontSize: 40 }} />
                <Typography variant="h5" sx={{ color: neonColors.primary, fontWeight: 'bold' }}>
                  {occupancyStats?.totalToday || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Total Check-ins Today
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {renderOccupancyBar()}
        </CardContent>
      </Card>

      {/* Tabs for Active Players and History */}
      <Card
        sx={{
          background: alpha(theme.palette.background.paper, 0.95),
          border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            borderBottom: `1px solid ${alpha(neonColors.primary, 0.3)}`,
            '& .MuiTab-root': {
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: neonColors.primary,
                textShadow: `0 0 10px ${neonColors.primary}`,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: neonColors.primary,
              boxShadow: `0 0 10px ${neonColors.primary}`,
            },
          }}
        >
          <Tab icon={<Person />} label="Active Players" />
          <Tab icon={<AccessTime />} label="Check-in History" />
        </Tabs>

        <TabPanel value={selectedTab} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: neonColors.primary }} />
            </Box>
          ) : activeCheckins.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', p: 4, color: theme.palette.text.secondary }}>
              No active players at the moment
            </Typography>
          ) : (
            <List>
              {activeCheckins.map((checkin, index) => (
                <Zoom in key={checkin.id} style={{ transitionDelay: `${index * 50}ms` }}>
                  <ListItem
                    sx={{
                      mb: 1,
                      background: alpha(neonColors.primary, 0.05),
                      border: `1px solid ${alpha(neonColors.primary, 0.2)}`,
                      borderRadius: 2,
                      '&:hover': {
                        background: alpha(neonColors.primary, 0.1),
                        borderColor: alpha(neonColors.primary, 0.4),
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: neonColors.info }}>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: neonColors.info, fontWeight: 'bold' }}>
                          {checkin.username}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <Chip
                            icon={<TableBar />}
                            label={`Table ${checkin.tableNumber || 'N/A'}`}
                            size="small"
                            sx={{
                              background: alpha(neonColors.warning, 0.2),
                              color: neonColors.warning,
                              border: `1px solid ${neonColors.warning}`,
                            }}
                          />
                          <Chip
                            icon={<SportsCricket />}
                            label={checkin.gameType}
                            size="small"
                            sx={{
                              background: alpha(neonColors.secondary, 0.2),
                              color: neonColors.secondary,
                              border: `1px solid ${neonColors.secondary}`,
                            }}
                          />
                          <Chip
                            icon={<AccessTime />}
                            label={moment(checkin.checkedInAt).fromNow()}
                            size="small"
                            sx={{
                              background: alpha(neonColors.info, 0.2),
                              color: neonColors.info,
                              border: `1px solid ${neonColors.info}`,
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                </Zoom>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: neonColors.primary }} />
            </Box>
          ) : checkinHistory.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', p: 4, color: theme.palette.text.secondary }}>
              No check-in history available
            </Typography>
          ) : (
            <List>
              {checkinHistory.map((checkin, index) => (
                <Fade in key={checkin.id} timeout={500 + index * 100}>
                  <ListItem
                    sx={{
                      mb: 1,
                      background: alpha(theme.palette.background.default, 0.5),
                      border: `1px solid ${alpha(neonColors.primary, 0.1)}`,
                      borderRadius: 2,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: alpha(neonColors.primary, 0.3) }}>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={checkin.username}
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" sx={{ color: neonColors.primary }}>
                            In: {moment(checkin.checkedInAt).format('h:mm A')}
                          </Typography>
                          {checkin.checkedOutAt && (
                            <Typography variant="caption" sx={{ color: neonColors.error }}>
                              Out: {moment(checkin.checkedOutAt).format('h:mm A')}
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ color: neonColors.info }}>
                            Duration: {checkin.duration || 'Active'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </Fade>
              ))}
            </List>
          )}
        </TabPanel>
      </Card>

      {/* Check-In Dialog */}
      <Dialog
        open={checkInDialogOpen}
        onClose={() => setCheckInDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
            border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
            borderRadius: 2,
            boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.3)}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            fontSize: '1.5rem',
          }}
        >
          Venue Check-In
        </DialogTitle>
        
        <DialogContent>
          {checkInError && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                background: alpha(neonColors.error, 0.1),
                border: `1px solid ${neonColors.error}`,
                '& .MuiAlert-icon': { color: neonColors.error },
              }}
            >
              {checkInError}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: neonColors.info }}>
              Choose Check-In Method:
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box
                  onClick={() => setCheckInMethod('qr')}
                  sx={{
                    p: 3,
                    border: `2px solid ${checkInMethod === 'qr' ? neonColors.primary : alpha(neonColors.primary, 0.3)}`,
                    borderRadius: 2,
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: checkInMethod === 'qr' ? alpha(neonColors.primary, 0.1) : 'transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: neonColors.primary,
                      background: alpha(neonColors.primary, 0.05),
                    },
                  }}
                >
                  <QrCodeScanner sx={{ fontSize: 48, color: neonColors.primary, mb: 1 }} />
                  <Typography variant="h6" sx={{ color: neonColors.primary }}>
                    QR Code
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Scan venue QR code
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  onClick={() => setCheckInMethod('geo')}
                  sx={{
                    p: 3,
                    border: `2px solid ${checkInMethod === 'geo' ? neonColors.info : alpha(neonColors.info, 0.3)}`,
                    borderRadius: 2,
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: checkInMethod === 'geo' ? alpha(neonColors.info, 0.1) : 'transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: neonColors.info,
                      background: alpha(neonColors.info, 0.05),
                    },
                  }}
                >
                  <LocationOn sx={{ fontSize: 48, color: neonColors.info, mb: 1 }} />
                  <Typography variant="h6" sx={{ color: neonColors.info }}>
                    Geolocation
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Verify your location
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Check-in method content */}
            <Box sx={{ mt: 3 }}>
              {checkInMethod === 'qr' && (
                <QRCodeScanner onScan={handleQrScan} />
              )}
              {checkInMethod === 'geo' && (
                <GeolocationCheckIn 
                  venueId={venueId}
                  onLocationReceived={handleLocationReceived}
                />
              )}
            </Box>

            {/* Status indicators */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              {qrCode && (
                <Chip
                  icon={<Security />}
                  label="QR Verified"
                  sx={{
                    background: alpha(neonColors.primary, 0.2),
                    color: neonColors.primary,
                    border: `1px solid ${neonColors.primary}`,
                  }}
                />
              )}
              {location && (
                <Chip
                  icon={<NetworkCheck />}
                  label="Location Verified"
                  sx={{
                    background: alpha(neonColors.info, 0.2),
                    color: neonColors.info,
                    border: `1px solid ${neonColors.info}`,
                  }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setCheckInDialogOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCheckIn}
            disabled={loading || (!qrCode && !location)}
            sx={{
              background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.info} 90%)`,
              boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${neonColors.primary} 10%, ${neonColors.info} 100%)`,
                boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.7)}`,
              },
              '&:disabled': {
                background: theme.palette.action.disabledBackground,
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Complete Check-In'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckInSystem;