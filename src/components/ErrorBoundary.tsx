import React, { Component, ErrorInfo } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Report error to error tracking service
    this.props.onError?.(error, errorInfo);

    // Log error details to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            minHeight: 200,
            justifyContent: 'center'
          }}
        >
          <Alert 
            severity="error"
            sx={{ 
              width: '100%',
              maxWidth: 500 
            }}
          >
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  mt: 2,
                  p: 1,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                {this.state.errorInfo.componentStack}
              </Typography>
            )}
          </Alert>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleReset}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
} 