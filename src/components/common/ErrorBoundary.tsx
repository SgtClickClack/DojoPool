import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Button, Typography, Container, Paper } from "@mui/material";
import { ErrorOutline as ErrorIcon } from "@mui/icons-material";
import { logError } from "../core/services/ErrorLoggingService";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

    // Log error to service
    logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              mt: 4,
              textAlign: "center",
              backgroundColor: "error.light",
              color: "error.contrastText",
            }}
          >
            <ErrorIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {this.state.error?.message || "An unexpected error occurred"}
            </Typography>
            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <Box
                component="pre"
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "background.paper",
                  color: "text.primary",
                  borderRadius: 1,
                  overflow: "auto",
                  maxHeight: "200px",
                  textAlign: "left",
                }}
              >
                <code>{this.state.errorInfo.componentStack}</code>
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleRetry}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) => {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
};
