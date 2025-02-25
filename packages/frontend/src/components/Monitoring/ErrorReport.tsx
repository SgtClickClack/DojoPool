import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Collapse,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { gameMetricsMonitor } from '../../utils/monitoring';

interface ErrorEvent {
  id: string;
  timestamp: number;
  type: 'validation' | 'connection' | 'system' | 'boundary';
  severity: 'error' | 'warning' | 'info';
  message: string;
  playerId?: string;
  details?: Record<string, any>;
}

interface ErrorReportProps {
  gameId?: string;
  onErrorClick?: (error: ErrorEvent) => void;
}

export const ErrorReport: React.FC<ErrorReportProps> = ({ gameId, onErrorClick }) => {
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [errorStats, setErrorStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
  });

  useEffect(() => {
    const unsubscribe = gameMetricsMonitor.subscribeToErrors((error: ErrorEvent) => {
      setErrors((prev) => [error, ...prev].slice(0, 100)); // Keep last 100 errors
      updateErrorStats(error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateErrorStats = (error: ErrorEvent) => {
    setErrorStats((prev) => ({
      total: prev.total + 1,
      byType: {
        ...prev.byType,
        [error.type]: (prev.byType[error.type] || 0) + 1,
      },
      bySeverity: {
        ...prev.bySeverity,
        [error.severity]: (prev.bySeverity[error.severity] || 0) + 1,
      },
    }));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'validation':
        return 'primary';
      case 'connection':
        return 'error';
      case 'system':
        return 'warning';
      case 'boundary':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateErrorRate = () => {
    const recentErrors = errors.filter(
      (e) => Date.now() - e.timestamp < 5 * 60 * 1000 // Last 5 minutes
    ).length;
    return (recentErrors / 5).toFixed(2); // Errors per minute
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Error Report
        </Typography>

        {/* Error Statistics */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Error Rate: {calculateErrorRate()} errors/minute
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min((Number(calculateErrorRate()) / 10) * 100, 100)}
            color={Number(calculateErrorRate()) > 5 ? 'error' : 'primary'}
          />
        </Box>

        {/* Error Summary */}
        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          {Object.entries(errorStats.byType).map(([type, count]) => (
            <Chip
              key={type}
              label={`${type}: ${count}`}
              color={getErrorTypeColor(type) as any}
              variant="outlined"
            />
          ))}
        </Box>

        {/* Error Table */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Player ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.map((error) => (
                <React.Fragment key={error.id}>
                  <TableRow
                    hover
                    onClick={() => onErrorClick?.(error)}
                    style={{ cursor: onErrorClick ? 'pointer' : 'default' }}
                  >
                    <TableCell padding="checkbox">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded(expanded === error.id ? false : error.id);
                        }}
                      >
                        {expanded === error.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{formatTimestamp(error.timestamp)}</TableCell>
                    <TableCell>
                      <Chip
                        label={error.type}
                        size="small"
                        color={getErrorTypeColor(error.type) as any}
                      />
                    </TableCell>
                    <TableCell>{getSeverityIcon(error.severity)}</TableCell>
                    <TableCell>{error.message}</TableCell>
                    <TableCell>{error.playerId || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                      <Collapse in={expanded === error.id} timeout="auto" unmountOnExit>
                        <Box p={2}>
                          <Alert severity={error.severity as any}>
                            <Typography variant="subtitle2" gutterBottom>
                              Error Details
                            </Typography>
                            <pre>{JSON.stringify(error.details, null, 2)}</pre>
                          </Alert>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
