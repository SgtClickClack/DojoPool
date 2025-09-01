import { Box, Button, Paper, Typography } from '@mui/material';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class InventoryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Inventory error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="200px"
          p={3}
        >
          <Paper
            elevation={2}
            sx={{ p: 3, textAlign: 'center', maxWidth: 400 }}
          >
            <Typography variant="h6" component="h2" gutterBottom color="error">
              Inventory Error
            </Typography>
            <Typography variant="body2" paragraph color="text.secondary">
              There was an issue loading your inventory. This might be a
              temporary issue.
            </Typography>
            {this.state.error && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, fontSize: '0.75rem' }}
              >
                {this.state.error.message}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
              size="small"
            >
              Retry
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default InventoryErrorBoundary;
