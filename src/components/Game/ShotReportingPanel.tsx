import {
  Add,
  Cancel,
  CheckCircle,
  SportsEsports,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';

interface ShotReportingPanelProps {
  onShotReport: (shotData: {
    ballSunk: boolean;
    wasFoul: boolean;
    shotType: string;
    playerName?: string;
    notes?: string;
  }) => void;
  isConnected: boolean;
  playerName?: string;
  disabled?: boolean;
}

const CyberpunkPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  border: '2px solid #00d4ff',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
    animation: 'scanline 2s linear infinite',
  },
  '@keyframes scanline': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
}));

const ShotButton = styled(Button)(({ theme, color }) => ({
  background:
    color === 'success'
      ? 'linear-gradient(135deg, #4caf50, #45a049)'
      : color === 'warning'
        ? 'linear-gradient(135deg, #ff9800, #f57c00)'
        : color === 'error'
          ? 'linear-gradient(135deg, #f44336, #d32f2f)'
          : 'linear-gradient(135deg, #2196f3, #1976d2)',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  color: 'white',
  fontWeight: 'bold',
  textTransform: 'none',
  padding: '12px 24px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
  },
  '&:disabled': {
    opacity: 0.5,
    transform: 'none',
  },
}));

const ShotReportingPanel: React.FC<ShotReportingPanelProps> = ({
  onShotReport,
  isConnected,
  playerName,
  disabled = false,
}) => {
  const [shotReportDialog, setShotReportDialog] = useState(false);
  const [shotReportData, setShotReportData] = useState({
    shotType: 'successful_pot',
    ballSunk: true,
    wasFoul: false,
    notes: '',
  });

  const handleQuickShot = (
    type: string,
    ballSunk: boolean,
    wasFoul: boolean
  ) => {
    onShotReport({
      shotType: type,
      ballSunk,
      wasFoul,
      playerName,
    });
  };

  const handleShotReport = () => {
    setShotReportDialog(true);
  };

  const handleShotReportSubmit = () => {
    onShotReport({
      ...shotReportData,
      playerName,
    });

    // Reset form
    setShotReportData({
      shotType: 'successful_pot',
      ballSunk: true,
      wasFoul: false,
      notes: '',
    });
    setShotReportDialog(false);
  };

  const handleShotReportCancel = () => {
    setShotReportDialog(false);
    setShotReportData({
      shotType: 'successful_pot',
      ballSunk: true,
      wasFoul: false,
      notes: '',
    });
  };

  return (
    <>
      <CyberpunkPaper elevation={8}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <SportsEsports sx={{ color: '#00d4ff', fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                color: '#00d4ff',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
              }}
            >
              Shot Reporting
            </Typography>
          </Box>

          {/* Connection Status */}
          {!isConnected && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Not connected to match. Shot reporting unavailable.
            </Alert>
          )}

          {/* Quick Shot Buttons */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <ShotButton
                fullWidth
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleQuickShot('successful_pot', true, false)}
                disabled={!isConnected || disabled}
                size="large"
              >
                Successful Pot
              </ShotButton>
            </Grid>

            <Grid item xs={12} sm={6}>
              <ShotButton
                fullWidth
                color="warning"
                startIcon={<Cancel />}
                onClick={() => handleQuickShot('missed_shot', false, false)}
                disabled={!isConnected || disabled}
                size="large"
              >
                Missed Shot
              </ShotButton>
            </Grid>

            <Grid item xs={12} sm={6}>
              <ShotButton
                fullWidth
                color="error"
                startIcon={<Warning />}
                onClick={() => handleQuickShot('foul', false, true)}
                disabled={!isConnected || disabled}
                size="large"
              >
                Report Foul
              </ShotButton>
            </Grid>

            <Grid item xs={12} sm={6}>
              <ShotButton
                fullWidth
                color="info"
                startIcon={<Add />}
                onClick={handleShotReport}
                disabled={!isConnected || disabled}
                size="large"
              >
                Custom Report
              </ShotButton>
            </Grid>
          </Grid>

          {/* Instructions */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            Click any button above to quickly report your shot outcome, or use
            Custom Report for detailed information.
          </Typography>
        </Box>
      </CyberpunkPaper>

      {/* Custom Shot Report Dialog */}
      <Dialog
        open={shotReportDialog}
        onClose={handleShotReportCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '2px solid #00d4ff',
          },
        }}
      >
        <DialogTitle
          sx={{
            color: '#00d4ff',
            borderBottom: '1px solid rgba(0, 212, 255, 0.3)',
          }}
        >
          Custom Shot Report
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Shot Type
                </InputLabel>
                <Select
                  value={shotReportData.shotType}
                  onChange={(e) =>
                    setShotReportData((prev) => ({
                      ...prev,
                      shotType: e.target.value,
                      ballSunk: e.target.value === 'successful_pot',
                      wasFoul: e.target.value === 'foul',
                    }))
                  }
                  sx={{ color: 'white' }}
                >
                  <MenuItem value="successful_pot">Successful Pot</MenuItem>
                  <MenuItem value="missed_shot">Missed Shot</MenuItem>
                  <MenuItem value="foul">Foul</MenuItem>
                  <MenuItem value="scratch">Scratch</MenuItem>
                  <MenuItem value="safety">Safety Shot</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes (optional)"
                value={shotReportData.notes}
                onChange={(e) =>
                  setShotReportData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                multiline
                rows={3}
                placeholder="Any additional details about the shot..."
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 212, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#00d4ff' },
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{ borderTop: '1px solid rgba(0, 212, 255, 0.3)', p: 2 }}
        >
          <Button
            onClick={handleShotReportCancel}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShotReportSubmit}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #0099cc, #006699)',
              },
            }}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShotReportingPanel;
