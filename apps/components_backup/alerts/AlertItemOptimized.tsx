import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Chip,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import type { ChipProps } from '@mui/material';
import { type Alert, AlertType, AlertStatus } from '../../types/alert';
import {
  CheckCircleOutline,
  InfoOutlined,
  CloseOutlined,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

interface AlertItemProps {
  alert: Alert;
  style?: React.CSSProperties;
  onHeightChange?: (height: number) => void;
  onAcknowledge?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onClose?: (id: string) => void;
}

const getAlertColor = (type: AlertType): ChipProps['color'] => {
  switch (type) {
    case AlertType.ERROR:
      return 'error';
    case AlertType.WARNING:
      return 'warning';
    case AlertType.SUCCESS:
      return 'success';
    default:
      return 'info';
  }
};

const getStatusColor = (status: AlertStatus): ChipProps['color'] => {
  switch (status) {
    case AlertStatus.ACTIVE:
      return 'primary';
    case AlertStatus.ACKNOWLEDGED:
      return 'secondary';
    default:
      return 'default';
  }
};

export const AlertItemOptimized = React.memo(
  ({
    alert,
    style = {},
    onHeightChange,
    onAcknowledge,
    onViewDetails,
    onClose,
  }: AlertItemProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const boxRef = useRef<HTMLDivElement>(null);

    // Memoize alert metadata to prevent unnecessary recalculations
    const metadata = useMemo(
      () => ({
        timestamp: new Date(alert.timestamp).toLocaleString(),
        alertColor: getAlertColor(alert.type),
        statusColor: getStatusColor(alert.status),
      }),
      [alert.timestamp, alert.type, alert.status]
    );

    // Optimize height measurement with RAF
    useEffect(() => {
      if (boxRef.current && onHeightChange) {
        requestAnimationFrame(() => {
          const height = boxRef.current?.getBoundingClientRect().height;
          if (height) {
            onHeightChange(height);
          }
        });
      }
    }, [alert.message, onHeightChange]);

    // Memoize event handlers
    const handleAnimationEnd = useCallback(() => {
      if (boxRef.current) {
        boxRef.current.style.animation = 'none';
      }
    }, []);

    // Handle keyboard navigation
    const handleKeyPress = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (
            event.currentTarget.getAttribute('data-action') === 'acknowledge' &&
            onAcknowledge
          ) {
            onAcknowledge(alert.id as string);
          } else if (
            event.currentTarget.getAttribute('data-action') === 'view' &&
            onViewDetails
          ) {
            onViewDetails(alert.id as string);
          } else if (
            event.currentTarget.getAttribute('data-action') === 'close' &&
            onClose
          ) {
            onClose(alert.id as string);
          }
        }
      },
      [alert.id, onAcknowledge, onViewDetails, onClose]
    );

    return (
      <Box
        ref={boxRef}
        role="article"
        aria-label={`${alert.type} alert: ${alert.message}`}
        aria-describedby={`alert-${alert.id}-timestamp alert-${alert.id}-status`}
        tabIndex={0}
        onKeyPress={handleKeyPress}
        sx={{
          p: 2,
          m: 1,
          borderRadius: 1,
          border: 1,
          borderColor: metadata.alertColor,
          backgroundColor: alpha(metadata.alertColor, 0.1),
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(metadata.alertColor, 0.15),
          },
          '&:focus': {
            outline: `2px solid ${metadata.alertColor}`,
            outlineOffset: '2px',
          },
          ...style,
        }}
        onAnimationEnd={handleAnimationEnd}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body1"
                component="h3"
                sx={{ fontWeight: 'medium' }}
                id={`alert-${alert.id}-message`}
              >
                {alert.message}
              </Typography>
              <Chip
                size="small"
                label={alert.type}
                color={metadata.alertColor}
                aria-label={`Alert type: ${alert.type}`}
              />
              <Chip
                size="small"
                label={alert.status}
                color={metadata.statusColor}
                aria-label={`Alert status: ${alert.status}`}
                id={`alert-${alert.id}-status`}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              component="time"
              dateTime={new Date(alert.timestamp).toISOString()}
              id={`alert-${alert.id}-timestamp`}
            >
              {metadata.timestamp}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={4}
            sx={{
              display: 'flex',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 1,
              }}
              role="toolbar"
              aria-label="Alert actions"
            >
              <Tooltip title="Acknowledge alert">
                <IconButton
                  size="small"
                  onClick={() => onAcknowledge?.(alert.id)}
                  aria-label="Acknowledge alert"
                  data-action="acknowledge"
                  tabIndex={0}
                >
                  <CheckCircleOutline />
                </IconButton>
              </Tooltip>
              <Tooltip title="View alert details">
                <IconButton
                  size="small"
                  onClick={() => onViewDetails?.(alert.id)}
                  aria-label="View alert details"
                  data-action="view"
                  tabIndex={0}
                >
                  <InfoOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close alert">
                <IconButton
                  size="small"
                  onClick={() => onClose?.(alert.id)}
                  aria-label="Close alert"
                  data-action="close"
                  tabIndex={0}
                >
                  <CloseOutlined />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    const prevStyle = prevProps.style || {};
    const nextStyle = nextProps.style || {};
    return (
      prevProps.alert === nextProps.alert &&
      JSON.stringify(prevStyle) === JSON.stringify(nextStyle)
    );
  }
);

AlertItemOptimized.displayName = 'AlertItemOptimized';
