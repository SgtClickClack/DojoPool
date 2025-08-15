import {
  BugReport as BugReportIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import React, { Component, ErrorInfo } from "react";
import { logError } from "../../../../services/ErrorLoggingService";

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
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error
    logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  handleReportBug = (): void => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: {
        message: error?.message,
        stack: error?.stack,
      },
      errorInfo: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // TODO: Implement bug report submission
    console.log("Bug report:", errorReport);
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      return fallback;
    }

    return (
      <Container maxWidth="sm">
        <Box my={4}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom color="error">
              Oops! Something went wrong
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {error?.message || "An unexpected error occurred."}
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                mt: 3,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleRefresh}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<BugReportIcon />}
                onClick={this.handleReportBug}
              >
                Report Bug
              </Button>
            </Box>

            {process.env.NODE_ENV === "development" && error?.stack && (
              <Box mt={4} textAlign="left">
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Error Details (Development Only):
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "grey.100",
                    overflowX: "auto",
                  }}
                >
                  <pre style={{ margin: 0 }}>{error.stack}</pre>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    );
  }
}
