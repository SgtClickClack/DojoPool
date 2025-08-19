import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface TableAvailability {
  tableId: number;
  availableSlots: Array<{
    start: string;
    end: string;
  }>;
}

interface PeakHours {
  [hour: string]: number;
}

interface MaintenanceSchedule {
  tableId: number;
  tableNumber: number;
  startTime: string;
  endTime: string;
  reason: string;
}

const TableAvailabilityDashboard: React.FC = () => {
  const [availability, setAvailability] = useState<TableAvailability[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHours>({});
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<
    MaintenanceSchedule[]
  >([]);
  const [selectedVenue, setSelectedVenue] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [endTime, setEndTime] = useState<string>(
    format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm")
  );
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    tableId: 0,
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(
      new Date(Date.now() + 2 * 60 * 60 * 1000),
      "yyyy-MM-dd'T'HH:mm"
    ),
    reason: '',
  });

  useEffect(() => {
    fetchAvailability();
    fetchPeakHours();
    fetchMaintenanceSchedule();
  }, [selectedVenue, startTime, endTime]);

  const fetchAvailability = async () => {
    try {
      const response = await fetch(
        `/api/table-availability/availability/${selectedVenue}?start_time=${startTime}&end_time=${endTime}`
      );
      const data = await response.json();
      setAvailability(data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const fetchPeakHours = async () => {
    try {
      const response = await fetch(
        `/api/table-availability/peak-hours/${selectedVenue}`
      );
      const data = await response.json();
      setPeakHours(data);
    } catch (error) {
      console.error('Error fetching peak hours:', error);
    }
  };

  const fetchMaintenanceSchedule = async () => {
    try {
      const response = await fetch(
        `/api/table-availability/maintenance/${selectedVenue}`
      );
      const data = await response.json();
      setMaintenanceSchedule(data);
    } catch (error) {
      console.error('Error fetching maintenance schedule:', error);
    }
  };

  const handleScheduleMaintenance = async () => {
    try {
      const response = await fetch('/api/table-availability/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMaintenance),
      });

      if (response.ok) {
        setOpenMaintenanceDialog(false);
        fetchMaintenanceSchedule();
      }
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
    }
  };

  const peakHoursData = Object.entries(peakHours).map(([hour, rate]) => ({
    hour,
    occupancy: rate,
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Peak Hours Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Peak Hours Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis
                    label={{
                      value: 'Occupancy Rate (%)',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#8884d8"
                    name="Occupancy Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Table Availability */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Table Availability
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Table ID</TableCell>
                      <TableCell>Available Slots</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availability.map((table) => (
                      <TableRow key={table.tableId}>
                        <TableCell>{table.tableId}</TableCell>
                        <TableCell>
                          {table.availableSlots.map((slot, index) => (
                            <div key={index}>
                              {format(
                                parseISO(slot.start),
                                'MMM d, yyyy HH:mm'
                              )}{' '}
                              -{' '}
                              {format(parseISO(slot.end), 'MMM d, yyyy HH:mm')}
                            </div>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Schedule */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Maintenance Schedule</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenMaintenanceDialog(true)}
                >
                  Schedule Maintenance
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Table</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenanceSchedule.map((schedule) => (
                      <TableRow key={schedule.tableId}>
                        <TableCell>{schedule.tableNumber}</TableCell>
                        <TableCell>
                          {format(
                            parseISO(schedule.startTime),
                            'MMM d, yyyy HH:mm'
                          )}
                        </TableCell>
                        <TableCell>
                          {format(
                            parseISO(schedule.endTime),
                            'MMM d, yyyy HH:mm'
                          )}
                        </TableCell>
                        <TableCell>{schedule.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Maintenance Dialog */}
      <Dialog
        open={openMaintenanceDialog}
        onClose={() => setOpenMaintenanceDialog(false)}
      >
        <DialogTitle>Schedule Maintenance</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Table</InputLabel>
            <Select
              value={newMaintenance.tableId}
              onChange={(e) =>
                setNewMaintenance({
                  ...newMaintenance,
                  tableId: Number(e.target.value),
                })
              }
            >
              {availability.map((table) => (
                <MenuItem key={table.tableId} value={table.tableId}>
                  Table {table.tableId}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="datetime-local"
            label="Start Time"
            value={newMaintenance.startTime}
            onChange={(e) =>
              setNewMaintenance({
                ...newMaintenance,
                startTime: e.target.value,
              })
            }
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            type="datetime-local"
            label="End Time"
            value={newMaintenance.endTime}
            onChange={(e) =>
              setNewMaintenance({ ...newMaintenance, endTime: e.target.value })
            }
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Reason"
            value={newMaintenance.reason}
            onChange={(e) =>
              setNewMaintenance({ ...newMaintenance, reason: e.target.value })
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMaintenanceDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleScheduleMaintenance}
            variant="contained"
            color="primary"
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableAvailabilityDashboard;
