import QRCodeScanner from '@/components/Common/QRCodeScanner';
import {
  BarChart as BarChartOutlined,
  CheckCircle as CheckCircleOutlined,
  Schedule as ClockCircleOutlined,
  Logout as LogoutOutlined,
  Group as TeamOutlined,
  Person as UserOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { message } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

import {
  checkIn,
  checkOut,
  getActiveCheckins,
  getCheckinHistory,
  getOccupancyStats,
} from '@/api/venues';
import { useAuth } from '@/hooks/useAuth';

interface CheckInSystemProps {
  venueId: number;
  venueName: string;
}

const CheckInSystem: React.FC<CheckInSystemProps> = ({
  venueId,
  venueName,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeCheckins, setActiveCheckins] = useState<any[]>([]);
  const [checkinHistory, setCheckinHistory] = useState<any[]>([]);
  const [occupancyStats, setOccupancyStats] = useState<any>(null);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [qrCheckInLoading, setQrCheckInLoading] = useState(false);
  const [qrCheckInError, setQrCheckInError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState(0);

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
    } catch (error) {
      console.error('Error fetching check-in data:', error);
      console.error('Failed to fetch check-in data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = {
      table_number: formData.get('table_number'),
      game_type: formData.get('game_type'),
    };

    try {
      await checkIn(venueId, values);
      console.log('Checked in successfully');
      setCheckInModalVisible(false);
      event.currentTarget.reset();
      fetchData();
    } catch (error) {
      console.error('Error checking in:', error);
      console.error('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut(venueId);
      console.log('Checked out successfully');
      fetchData();
    } catch (error) {
      console.error('Error checking out:', error);
      message.error('Failed to check out');
    }
  };

  const handleOpenQrDialog = () => {
    setQrDialogOpen(true);
    setQrScanResult(null);
    setGeoLocation(null);
    setQrCheckInError(null);
  };

  const handleQrScan = (code: string) => {
    setQrScanResult(code);
    // Get geolocation after QR scan
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          setQrCheckInError('Failed to get geolocation.');
        }
      );
    } else {
      setQrCheckInError('Geolocation not supported.');
    }
  };

  const handleQrCheckIn = async () => {
    if (!qrScanResult || !geoLocation) return;
    setQrCheckInLoading(true);
    setQrCheckInError(null);
    try {
      await checkIn(venueId, {
        qrCode: qrScanResult,
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
      });
      message.success('Checked in with QR/Geolocation!');
      setQrDialogOpen(false);
      fetchData();
    } catch (err) {
      setQrCheckInError('Failed to check in with QR/Geolocation.');
    } finally {
      setQrCheckInLoading(false);
    }
  };

  const activeColumns = [
    {
      title: 'Player',
      dataIndex: 'username',
      key: 'username',
      render: (text: any, record: any) => (
        <span>
          <UserOutlined />
          {String(text)}
        </span>
      ),
    },
    {
      title: 'Table',
      dataIndex: 'table_number',
      key: 'table_number',
    },
    {
      title: 'Game',
      dataIndex: 'game_type',
      key: 'game_type',
    },
    {
      title: 'Check-in Time',
      dataIndex: 'checked_in_at',
      key: 'checked_in_at',
      render: (date: any) => moment(date).format('h:mm A'),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record: any) => {
        const duration = moment.duration(
          moment().diff(moment(record.checked_in_at))
        );
        return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`;
      },
    },
  ];

  const historyColumns = [
    {
      title: 'Player',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Check-in',
      dataIndex: 'checked_in_at',
      key: 'checked_in_at',
      render: (date: string) => moment(date).format('MMM D, h:mm A'),
    },
    {
      title: 'Check-out',
      dataIndex: 'checked_out_at',
      key: 'checked_out_at',
      render: (date: any) => (date ? moment(date).format('h:mm A') : '-'),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: any) => duration || '-',
    },
  ];

  const isCheckedIn = activeCheckins.some((c) => c.user_id === user?.id);

  return (
    <div className="check-in-system">
      <Card
        title={
          <>
            <TeamOutlined /> Check-in System
          </>
        }
        extra={
          isCheckedIn ? (
            <Button
              type="primary"
              danger
              icon={<LogoutOutlined />}
              onClick={handleCheckOut}
            >
              Check Out
            </Button>
          ) : (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setCheckInModalVisible(true)}
              >
                Check In
              </Button>
              <Button
                type="default"
                icon={<CheckCircleOutlined />}
                onClick={handleOpenQrDialog}
                style={{ marginLeft: 8 }}
              >
                Check In with QR/Geolocation
              </Button>
            </>
          )
        }
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab
            label={
              <span>
                <TeamOutlined /> Active Players
              </span>
            }
          />
          <Tab
            label={
              <span>
                <ClockCircleOutlined /> Check-in History
              </span>
            }
          />
          <Tab
            label={
              <span>
                <BarChartOutlined /> Occupancy Trends
              </span>
            }
          />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ mt: 2 }}>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: 16,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                  }}
                >
                  <TeamOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {occupancyStats?.current_occupancy || 0}
                  </div>
                  <div style={{ color: '#666' }}>Current Occupancy</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: 16,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                  }}
                >
                  <BarChartOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {occupancyStats?.peak_occupancy || 0}
                  </div>
                  <div style={{ color: '#666' }}>Peak Occupancy</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: 16,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                  }}
                >
                  <CheckCircleOutlined
                    style={{ fontSize: 24, marginBottom: 8 }}
                  />
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {occupancyStats?.total_checkins || 0}
                  </div>
                  <div style={{ color: '#666' }}>Total Check-ins</div>
                </div>
              </div>

              <div
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      {activeColumns.map((col: any) => (
                        <th
                          key={col.key}
                          style={{
                            padding: 12,
                            textAlign: 'left',
                            borderBottom: '1px solid #ddd',
                          }}
                        >
                          {col.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeCheckins.map((record: any) => (
                      <tr key={record.id}>
                        {activeColumns.map((col: any) => (
                          <td
                            key={col.key}
                            style={{
                              padding: 12,
                              borderBottom: '1px solid #ddd',
                            }}
                          >
                            {col.render
                              ? col.render(record[col.dataIndex], record)
                              : record[col.dataIndex]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <div
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    {historyColumns.map((col: any) => (
                      <th
                        key={col.key}
                        style={{
                          padding: 12,
                          textAlign: 'left',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        {col.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checkinHistory.map((record: any) => (
                    <tr key={record.id}>
                      {historyColumns.map((col: any) => (
                        <td
                          key={col.key}
                          style={{
                            padding: 12,
                            borderBottom: '1px solid #ddd',
                          }}
                        >
                          {col.render
                            ? col.render(record[col.dataIndex], record)
                            : record[col.dataIndex]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ mt: 2 }}>
            {occupancyStats?.checkins_by_hour && (
              <Line
                data={{
                  labels: occupancyStats.checkins_by_hour.map(
                    (item: any) => item.hour
                  ),
                  datasets: [
                    {
                      label: 'Check-ins by Hour',
                      data: occupancyStats.checkins_by_hour.map(
                        (item: any) => item.count
                      ),
                      borderColor: 'rgb(75, 192, 192)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      tension: 0.1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            )}
          </Box>
        )}
      </Card>

      <Dialog
        open={checkInModalVisible}
        onClose={() => {
          setCheckInModalVisible(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Check In</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCheckIn} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              name="table_number"
              label="Table Number"
              type="number"
              inputProps={{ min: 1 }}
              required
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Game Type</InputLabel>
              <MuiSelect name="game_type" label="Game Type" required>
                <MenuItem value="8-ball">8-Ball</MenuItem>
                <MenuItem value="9-ball">9-Ball</MenuItem>
                <MenuItem value="straight">Straight Pool</MenuItem>
                <MenuItem value="one-pocket">One Pocket</MenuItem>
              </MuiSelect>
            </FormControl>

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Check In
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>QR/Geolocation Check-In</DialogTitle>
        <DialogContent>
          {qrCheckInError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {qrCheckInError}
            </Alert>
          )}
          {!qrScanResult ? (
            <QRCodeScanner onScan={handleQrScan} />
          ) : !geoLocation ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight={120}
            >
              <CircularProgress />
              <Typography style={{ marginLeft: 16 }}>
                Getting your location...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography>QR Code: {qrScanResult}</Typography>
              <Typography>
                Latitude: {geoLocation.latitude.toFixed(6)}
              </Typography>
              <Typography>
                Longitude: {geoLocation.longitude.toFixed(6)}
              </Typography>
              <Button
                type="primary"
                loading={qrCheckInLoading}
                onClick={handleQrCheckIn}
                style={{ marginTop: 16 }}
              >
                Confirm Check-In
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckInSystem;
