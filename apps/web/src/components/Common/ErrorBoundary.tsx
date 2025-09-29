/**
 * Enhanced Error Boundary Component
 * 
 * Provides comprehensive error handling with recovery mechanisms,
 * error reporting, and user-friendly error displays.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Alert, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  enableRecovery?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error reporting service
    // For now, we'll just log it
    console.error('Error reported:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails, retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: 3,
            textAlign: 'center',
          }}
        >
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We're sorry, but something unexpected happened. Please try again.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {canRetry && this.props.enableRecovery && (
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
              >
                Try Again ({this.maxRetries - retryCount} attempts left)
              </Button>
            )}
            <Button variant="outlined" onClick={this.handleReload}>
              Reload Page
            </Button>
          </Box>

          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ width: '100%', maxWidth: 800 }}>
              <Button
                onClick={this.toggleDetails}
                endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                sx={{ mb: 1 }}
              >
                {showDetails ? 'Hide' : 'Show'} Error Details
              </Button>
              
              <Collapse in={showDetails}>
                <Box
                  sx={{
                    backgroundColor: 'grey.100',
                    padding: 2,
                    borderRadius: 1,
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Error Message:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'error.main' }}>
                    {error?.message}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Stack Trace:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      mb: 2,
                    }}
                  >
                    {error?.stack}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Component Stack:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {errorInfo?.componentStack}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;